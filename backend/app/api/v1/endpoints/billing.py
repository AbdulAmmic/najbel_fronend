from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole, Patient
from app.models.invoice import Invoice, InvoiceStatus, InvoiceItem
from app.schemas import finance as finance_schemas
from app.models.wallet import Wallet
from app.models.transaction import Transaction, TransactionType, TransactionStatus, PaymentMethod
from app.models.service_template import ServiceTemplate
from app.core.websockets import manager
from app.models.bank import Bank
from app.models.action_otp import ActionOTP
from app.core.email import send_email_background, generate_wallet_alert_email, generate_otp_email
from datetime import datetime, timedelta
import random
from app.core import security

router = APIRouter()

from sqlalchemy.orm import selectinload
from app.models.prescription import Prescription
from fastapi import Request
from app.core.gafiapay import initialize_payment, verify_webhook_signature
import json

@router.get("/invoices", response_model=List[finance_schemas.Invoice])
def get_invoices(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    status: Optional[str] = None
) -> Any:
    """
    Get all invoices. Filterable by status.
    """
    query = select(Invoice).options(selectinload(Invoice.items))
    
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient:
            return []
        query = query.where(Invoice.patient_id == patient.id)
    
    if status:
        query = query.where(Invoice.status == status)
        
    invoices = db.exec(query.order_by(Invoice.created_at.desc())).all()
    
    # Enrich with patient names
    results = []
    for inv in invoices:
        patient = db.get(Patient, inv.patient_id)
        patient_name = "Unknown Patient"
        if patient:
            user = db.get(User, patient.user_id)
            patient_name = user.full_name if user else "Unknown Patient"
        
        # Merge model fields with dynamic enrichment
        inv_data = inv.dict()
        inv_data["patient_name"] = patient_name
        inv_data["items"] = inv.items
        results.append(inv_data)
            
    return results

@router.post("/invoices", response_model=Invoice)
def create_invoice(
    invoice_in: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create a new invoice with items.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.PHARMACIST, UserRole.RECEPTIONIST, UserRole.ACCOUNTANT]:
         raise HTTPException(status_code=403, detail="Not permitted")
         
    # Generate Invoice Number
    inv_num = f"INV-{int(datetime.utcnow().timestamp())}"
    
    patient_id = invoice_in.get("patient_id")
    items_data = invoice_in.get("items", [])
    
    total_amount = sum(item.get("amount", 0) for item in items_data)
    
    invoice = Invoice(
        invoice_number=inv_num,
        patient_id=patient_id,
        amount=total_amount,
        status=InvoiceStatus.PENDING,
        due_date=datetime.utcnow() + timedelta(days=7)
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    # Add Items
    for item_data in items_data:
        inv_item = InvoiceItem(
            invoice_id=invoice.id,
            description=item_data.get("description"),
            amount=item_data.get("amount")
        )
        db.add(inv_item)
    
    db.commit()
    db.refresh(invoice)
    
    background_tasks.add_task(manager.global_broadcast, f"billing_update: new invoice {inv_num}")
    
    return invoice

@router.put("/invoices/{id}/pay")
def pay_invoice(
    id: int,
    background_tasks: BackgroundTasks,
    payment_method: str = Query(..., description="cash, card, wallet, transfer"),
    wallet_pin: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Pay an invoice. Handles Wallet deduction.
    """
    invoice = db.get(Invoice, id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(status_code=400, detail="Invoice already paid")

    if current_user.role == UserRole.PATIENT:
        if payment_method != "wallet":
            raise HTTPException(status_code=400, detail="Patients can only pay using wallet")
        if not wallet_pin or not current_user.hashed_pin or not security.verify_password(wallet_pin, current_user.hashed_pin):
            raise HTTPException(status_code=400, detail="Invalid wallet PIN")

    if payment_method in ["cash", "card", "transfer"]:
        # If paying by cash/card/transfer at the desk, we "fund" the wallet first
        # to ensure every payment is reflected as a wallet deduction for the patient.
        wallet = db.exec(select(Wallet).where(Wallet.patient_id == invoice.patient_id)).first()
        if not wallet:
            wallet = Wallet(patient_id=invoice.patient_id, balance=0)
            db.add(wallet)
            db.commit()
            db.refresh(wallet)
        
        # 1. Record the "Funding" transaction (Credit)
        fund_txn = Transaction(
            patient_id=invoice.patient_id,
            amount=invoice.amount,
            type=TransactionType.TOPUP,
            payment_method=PaymentMethod(payment_method),
            status=TransactionStatus.COMPLETED,
            reference=f"FUND-{payment_method.upper()}-{int(datetime.utcnow().timestamp())}",
            cashier_name=current_user.full_name
        )
        db.add(fund_txn)
        wallet.balance += invoice.amount
        db.add(wallet)
        
        # Now switch to wallet payment method for the actual deduction logic
        payment_method = "wallet"

    if payment_method == "wallet":
        # Check wallet balance
        wallet = db.exec(select(Wallet).where(Wallet.patient_id == invoice.patient_id)).first()
        if not wallet:
             wallet = Wallet(patient_id=invoice.patient_id, balance=0)
             db.add(wallet)
             
        print(f"DIAGNOSTIC: Patient={invoice.patient_id}, Wallet Bal={wallet.balance} (type: {type(wallet.balance)}), Inv Amt={invoice.amount} (type: {type(invoice.amount)})")
        if wallet.balance < invoice.amount and not wallet.allow_overdraft:
            raise HTTPException(status_code=400, detail=f"Insufficient wallet balance. Have: {wallet.balance}, Need: {invoice.amount}")
            
        # Deduct
        wallet.balance -= invoice.amount
        db.add(wallet)
        
        # Record Transaction (Debit)
        txn = Transaction(
            invoice_id=invoice.id,
            patient_id=invoice.patient_id,
            amount=invoice.amount,
            type=TransactionType.PAYMENT,
            payment_method=PaymentMethod.WALLET,
            status=TransactionStatus.COMPLETED,
            reference=f"TXN-WAL-{int(datetime.utcnow().timestamp())}",
            cashier_name=current_user.full_name if current_user.role != UserRole.PATIENT else "System"
        )
        db.add(txn)
        
        invoice.status = InvoiceStatus.PAID
        invoice.payment_method = payment_method or "wallet"
        db.add(invoice)

        # Commit the core payment first — this MUST succeed
        db.commit()
        
        # Post-payment side-effects (non-critical — wrapped so they never break payment)
        try:
            # Update linked Prescription if any
            prescription = db.exec(select(Prescription).where(Prescription.invoice_id == invoice.id)).first()
            if prescription:
                prescription.status = "sent_to_pharmacy"
                db.add(prescription)
                
            # Update linked LabResult status to 'paid' so lab techs know it's cleared
            from app.models.lab_result import LabResult
            lab_result = db.exec(select(LabResult).where(LabResult.invoice_id == invoice.id)).first()
            if lab_result and lab_result.status == "requested":
                lab_result.status = "paid"
                db.add(lab_result)

            db.commit()
        except Exception as side_effect_err:
            db.rollback()
            print(f"Warning: post-payment side effect failed (payment still succeeded): {side_effect_err}")

        # E-mail notification for debit (non-critical)
        try:
            patient_record = db.get(Patient, invoice.patient_id)
            if patient_record:
                user_record = db.get(User, patient_record.user_id)
                if user_record and user_record.email:
                    item_desc = invoice.items[0].description if invoice.items else "Service Payment"
                    email_html = generate_wallet_alert_email(
                        user_record.full_name, 
                        "debit", 
                        invoice.amount, 
                        wallet.balance,
                        description=f"Invoice {invoice.invoice_number} - {item_desc}"
                    )
                    send_email_background(user_record.email, "Najbel Clinic Wallet Debit", email_html, background_tasks)
        except Exception as email_err:
            print(f"Warning: payment email failed (payment still succeeded): {email_err}")

    elif payment_method == "insurance":
        invoice.status = "pending_insurance"
        invoice.payment_method = "insurance"
        db.add(invoice)
        db.commit()
    
    return {"message": "Payment processed successfully", "status": invoice.status}

@router.put("/invoices/{id}/revoke")
def revoke_invoice(
    id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Cancel/Revoke an an invoice manually (Admin/Accountant only)
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.ACCOUNTANT]:
        raise HTTPException(status_code=403, detail="Not permitted")
        
    invoice = db.get(Invoice, id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(status_code=400, detail="Cannot revoke a paid invoice. Process a refund first.")
        
    invoice.status = InvoiceStatus.CANCELLED
    db.add(invoice)
    db.commit()
    
    background_tasks.add_task(manager.global_broadcast, f"billing_update: invoice {invoice.invoice_number} revoked")
    
    return {"message": "Invoice revoked successfully", "status": invoice.status}


@router.get("/wallet")
def get_user_wallet(
    patient_id: Optional[int] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if patient_id:
        if current_user.role == UserRole.PATIENT:
            # Patients can only see their own wallet unless they have a child/etc (not implemented yet)
            # For now, just ensure they match
            actual_patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
            if not actual_patient or actual_patient.id != patient_id:
                 raise HTTPException(status_code=403, detail="Not permitted to view other wallets")
            patient = actual_patient
        else:
            patient = db.get(Patient, patient_id)
    else:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        
    if not patient:
         raise HTTPException(status_code=404, detail="Patient record not found")
         
    wallet = db.exec(select(Wallet).where(Wallet.patient_id == patient.id)).first()
    if not wallet:
        wallet = Wallet(patient_id=patient.id, balance=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
        
    return wallet

@router.post("/wallet/topup/initiate")
def topup_wallet_initiate(
    amount: float,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Initializes a real Gafiapay payment gateway transaction for wallet top-up.
    """
    patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
    if not patient:
         raise HTTPException(status_code=404, detail="Patient record not found")
         
    if amount < 100:
         raise HTTPException(status_code=400, detail="Minimum top-up amount is 100 NGN.")
    
    # Generate unique transaction reference
    reference = f"GAFIA-{patient.id}-{int(datetime.utcnow().timestamp())}"
    
    # Call Gafiapay via our integration module
    gafia_res = initialize_payment(amount, current_user.email, reference)
    
    # Store a PENDING transaction locally so the webhook can confirm it
    txn = Transaction(
        patient_id=patient.id,
        amount=amount,
        type=TransactionType.TOPUP,
        payment_method=PaymentMethod.CARD, # Represents external gateway
        status=TransactionStatus.PENDING,
        reference=reference,
        cashier_name="Self - Gafiapay"
    )
    db.add(txn)
    db.commit()
    
    return {
        "message": "Payment initialization triggered",
        "reference": reference,
        "payment_data": gafia_res
    }

@router.post("/gafiapay/webhook")
async def gafiapay_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Gafiapay Webhook Listener for real-time wallet funding.
    """
    payload_bytes = await request.body()
    signature = request.headers.get("x-signature")
    
    if not signature:
        raise HTTPException(status_code=400, detail="Missing Gafiapay signature")
        
    if not verify_webhook_signature(payload_bytes, signature):
        raise HTTPException(status_code=400, detail="Invalid HMAC signature")
        
    try:
        data = json.loads(payload_bytes)
        event = data.get("event", "payment.success")
        
        if event in ["payment.success", "transfer.success", "charge.success"]:
            # Depending on Gafiapay payload, data could be nested
            tx_data = data.get("data", data)
            
            reference = tx_data.get("reference")
            amount_paid = float(tx_data.get("amount", tx_data.get("settled_amount", 0)))
            account_number = tx_data.get("account_number") or tx_data.get("virtual_account")
            
            patient_id_target = None
            
            # Scenario 1: Reference-based payment
            if reference:
                txn = db.exec(select(Transaction).where(Transaction.reference == reference)).first()
                if txn:
                    if txn.status == TransactionStatus.COMPLETED:
                        return {"status": "ignored", "reason": "already_processed"}
                    patient_id_target = txn.patient_id
                    txn.status = TransactionStatus.COMPLETED
                    db.add(txn)
            
            # Scenario 2: Direct Virtual Account transfer 
            if not patient_id_target and account_number:
                # The UI uses patient.unique_id digits as the virtual account
                patients = db.exec(select(Patient)).all()
                for p in patients:
                    numeric_id = ''.join(filter(str.isdigit, p.unique_id)) if p.unique_id else ""
                    if numeric_id and numeric_id == str(account_number):
                        patient_id_target = p.id
                        break
                        
                if patient_id_target:
                    # Create the transaction record retroactively
                    txn_vt = Transaction(
                        patient_id=patient_id_target,
                        amount=amount_paid,
                        type=TransactionType.TOPUP,
                        payment_method=PaymentMethod.TRANSFER,
                        status=TransactionStatus.COMPLETED,
                        reference=f"GAF-VT-{int(datetime.utcnow().timestamp())}",
                        cashier_name="Gafiapay System"
                    )
                    db.add(txn_vt)
            
            if not patient_id_target:
                print(f"Webhook WARNING: Could not map payment to any patient. Payload: {data}")
                return {"status": "error", "reason": "patient_unmapped"}
                
            # Perform Wallet Credit
            wallet = db.exec(select(Wallet).where(Wallet.patient_id == patient_id_target)).first()
            if not wallet:
                wallet = Wallet(patient_id=patient_id_target, balance=0.0)
                db.add(wallet)
                
            wallet.balance += amount_paid
            wallet.updated_at = datetime.utcnow()
            db.add(wallet)
            db.commit()
            
            # Trigger real-time UI updates
            background_tasks.add_task(manager.global_broadcast, f"billing_update: wallet auto-funded {wallet.patient_id}")
            
            # Send Notification
            patient = db.get(Patient, patient_id_target)
            if patient:
                user_record = db.get(User, patient.user_id)
                if user_record and user_record.email:
                    email_html = generate_wallet_alert_email(
                        user_record.full_name, "credit", amount_paid, wallet.balance, "Gafiapay Auto Top-up"
                    )
                    send_email_background(user_record.email, "Najbel Clinic Wallet Credit", email_html, background_tasks)
                    
        return {"status": "success"}
    except Exception as e:
        print(f"Webhook Error: {e}")
        db.rollback()
        raise HTTPException(status_code=400, detail="Webhook processing error")

@router.get("/banks", response_model=List[Bank])
def get_banks(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return db.exec(select(Bank).where(Bank.is_active == True)).all()

@router.post("/banks", response_model=Bank)
def create_bank(
    bank_in: Bank,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not permitted")
    db.add(bank_in)
    db.commit()
    db.refresh(bank_in)
    return bank_in

@router.delete("/banks/{id}")
def delete_bank(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not permitted")
    bank = db.get(Bank, id)
    if bank:
        bank.is_active = False
        db.add(bank)
        db.commit()
    return {"message": "Bank deactivated"}

@router.post("/wallet/{patient_id}/fund")
def admin_fund_wallet(
    patient_id: int,
    amount: float,
    payment_method: str = Query("cash", description="cash, transfer"),
    bank_id: Optional[int] = Query(None),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Admin: Fund a patient's wallet.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT]:
        raise HTTPException(status_code=403, detail="Only admins can fund wallets")
        
    wallet = db.exec(select(Wallet).where(Wallet.patient_id == patient_id)).first()
    if not wallet:
        wallet = Wallet(patient_id=patient_id, balance=0.0)
    
    if amount <= 60:
        raise HTTPException(status_code=400, detail="Top up amount must be greater than 60 NGN charge.")
        
    actual_credit = amount - 60
    wallet.balance += actual_credit
    wallet.updated_at = datetime.utcnow()
    db.add(wallet)
    
    txn = Transaction(
            patient_id=patient_id,
            amount=amount,
            type=TransactionType.TOPUP,
            payment_method=PaymentMethod(payment_method) if payment_method in ["cash", "transfer"] else PaymentMethod.CASH,
            status=TransactionStatus.COMPLETED,
            reference=f"ADM-FUND-{int(datetime.utcnow().timestamp())}",
            cashier_name=current_user.full_name,
            bank_id=bank_id
    )
    db.add(txn)
    db.commit()
    
    if background_tasks:
        background_tasks.add_task(manager.global_broadcast, f"billing_update: admin fund for patient {patient_id}")
    
    patient_record = db.get(Patient, patient_id)
    if patient_record:
        user_record = db.get(User, patient_record.user_id)
        if user_record and user_record.email:
            email_html = generate_wallet_alert_email(
                user_record.full_name, 
                "credit", 
                amount, 
                wallet.balance,
                description=f"Administrative Funding ({payment_method})"
            )
            send_email_background(user_record.email, "Najbel Clinic Wallet Credit", email_html)
    
    return {"message": "Wallet funded successfully (60 NGN fee applied)", "new_balance": wallet.balance}


@router.get("/transactions", response_model=List[Transaction])
def get_transactions(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    status: Optional[str] = None
) -> Any:
    """
    Get current user's transaction history.
    """
    patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
    if not patient:
        return []
        
    query = select(Transaction).where(Transaction.patient_id == patient.id).order_by(Transaction.created_at.desc())
    
    if status:
        query = query.where(Transaction.status == status)
        
    transactions = db.exec(query).all()
    return transactions

@router.post("/wallet/{patient_id}/overdraft/request")
def request_overdraft_otp(
    patient_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Generate OTP for Admin/Accountant to enable overdraft for a patient.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT]:
        raise HTTPException(status_code=403, detail="Not authorized to enable overdraft")
    
    # Check if patient exists
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Generate 6 digit OTP
    otp_code = ''.join(random.choices("0123456789", k=6))
    
    # Clear old ones for this specific action
    db.query(ActionOTP).filter(
        ActionOTP.email == current_user.email,
        ActionOTP.action_type == "enable_overdraft",
        ActionOTP.target_id == str(patient_id)
    ).delete()
    
    otp_entry = ActionOTP(
        email=current_user.email,
        otp_code=otp_code,
        action_type="enable_overdraft",
        target_id=str(patient_id),
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(otp_entry)
    db.commit()

    # Dispatch email to Admin
    email_html = generate_otp_email(otp_code)
    send_email_background(current_user.email, "Najbel Clinic - Overdraft Authorization Code", email_html)

    return {"msg": "OTP sent to your email"}

@router.post("/wallet/{patient_id}/overdraft/confirm")
def confirm_overdraft(
    patient_id: int,
    otp_code: str = Query(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Verify OTP and enable overdraft for the patient.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT]:
        raise HTTPException(status_code=403, detail="Not authorized to enable overdraft")

    otp_entry = db.exec(
        select(ActionOTP)
        .where(ActionOTP.email == current_user.email)
        .where(ActionOTP.otp_code == otp_code)
        .where(ActionOTP.action_type == "enable_overdraft")
        .where(ActionOTP.target_id == str(patient_id))
    ).first()

    if not otp_entry or otp_entry.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    wallet = db.exec(select(Wallet).where(Wallet.patient_id == patient_id)).first()
    if not wallet:
        wallet = Wallet(patient_id=patient_id, balance=0)
        db.add(wallet)
    
    wallet.allow_overdraft = True
    wallet.updated_at = datetime.utcnow()
    db.add(wallet)
    
    # Delete the used OTP
    db.delete(otp_entry)
    db.commit()

    return {"msg": "Overdraft enabled successfully"}

@router.get("/service-templates", response_model=List[ServiceTemplate])
def get_service_templates(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return db.exec(select(ServiceTemplate).where(ServiceTemplate.is_active == True)).all()

@router.post("/service-templates", response_model=ServiceTemplate)
def create_service_template(
    template_in: ServiceTemplate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT]:
        raise HTTPException(status_code=403, detail="Not permitted")
    db.add(template_in)
    db.commit()
    db.refresh(template_in)
    return template_in

@router.delete("/service-templates/{id}")
def delete_service_template(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ACCOUNTANT]:
        raise HTTPException(status_code=403, detail="Not permitted")
    template = db.get(ServiceTemplate, id)
    if template:
        template.is_active = False
        db.add(template)
        db.commit()
    return {"message": "Template deactivated"}
