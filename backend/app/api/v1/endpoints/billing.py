from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole, Patient
from app.models.invoice import Invoice, InvoiceStatus, InvoiceItem
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

@router.get("/invoices", response_model=List[Invoice])
def get_invoices(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    status: Optional[str] = None
) -> Any:
    """
    Get all invoices. Filterable by status.
    """
    query = select(Invoice)
    
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient:
            return []
        query = query.where(Invoice.patient_id == patient.id)
    
    if status:
        query = query.where(Invoice.status == status)
        
    invoices = db.exec(query).all()
    return invoices

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

    if payment_method == "wallet":
        # Check wallet balance
        wallet = db.exec(select(Wallet).where(Wallet.patient_id == invoice.patient_id)).first()
        if not wallet:
             # Create wallet if not exists (should technically exist on patient creation)
             wallet = Wallet(patient_id=invoice.patient_id, balance=0)
             db.add(wallet)
             db.commit()
             db.refresh(wallet)
             
        if wallet.balance < invoice.amount and not wallet.allow_overdraft:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")
            
        # Deduct
        wallet.balance -= invoice.amount
        wallet.updated_at = datetime.utcnow()
        db.add(wallet)
        
        # Record Transaction
        txn = Transaction(
            invoice_id=invoice.id,
            patient_id=invoice.patient_id,
            amount=invoice.amount,
            type=TransactionType.PAYMENT,
            payment_method=PaymentMethod.WALLET,
            status=TransactionStatus.COMPLETED,
            reference=f"TXN-WAL-{int(datetime.utcnow().timestamp())}",
            cashier_name="System"
        )
        db.add(txn)
        
        invoice.status = InvoiceStatus.PAID
        invoice.payment_method = "wallet"

        # E-mail notification for debit
        patient_record = db.get(Patient, invoice.patient_id)
        if patient_record:
            user_record = db.get(User, patient_record.user_id)
            if user_record and user_record.email:
                # Get a summary of items
                item_desc = invoice.items[0].description if invoice.items else "Service Payment"
                if len(invoice.items) > 1:
                    item_desc += " and other items"
                
                email_html = generate_wallet_alert_email(
                    user_record.full_name, 
                    "debit", 
                    invoice.amount, 
                    wallet.balance,
                    description=f"Invoice {invoice.invoice_number} - {item_desc}"
                )
                send_email_background(user_record.email, "Najbel Clinic Wallet Debit", email_html)

    elif payment_method == "insurance":
        # Just mark as pending insurance processing for now
        # In real world, would validate policy here
        invoice.status = "pending_insurance" # Custom status or handle in Enum
        invoice.payment_method = "insurance"
        # transaction might be pending
        
    else: # Cash/Card
        invoice.status = InvoiceStatus.PAID
        invoice.payment_method = payment_method
        
        # Record Transaction
        txn = Transaction(
            invoice_id=invoice.id,
            patient_id=invoice.patient_id,
            amount=invoice.amount,
            type=TransactionType.PAYMENT,
            payment_method=PaymentMethod(payment_method) if payment_method in ["cash", "card"] else PaymentMethod.CASH,
            status=TransactionStatus.COMPLETED,
            reference=f"TXN-{payment_method.upper()}-{int(datetime.utcnow().timestamp())}",
            cashier_name=current_user.full_name
        )
        db.add(txn)

    db.add(invoice)
    db.commit()
    
    background_tasks.add_task(manager.global_broadcast, f"billing_update: invoice {invoice.id} updated")
    
    return {"message": "Payment processed successfully", "status": invoice.status}

@router.get("/wallet")
def get_user_wallet(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # Assuming current_user is a patient or has a patient record
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

@router.post("/wallet/topup")
def topup_wallet(
    amount: float,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Top up wallet balance (Mock implementation).
    """
    patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
    if not patient:
         raise HTTPException(status_code=404, detail="Patient record not found")
         
    wallet = db.exec(select(Wallet).where(Wallet.patient_id == patient.id)).first()
    if not wallet:
        wallet = Wallet(patient_id=patient.id, balance=0.0)
    
    if amount <= 60:
         raise HTTPException(status_code=400, detail="Top up amount must be greater than 60 NGN charge.")
         
    actual_credit = amount - 60
    wallet.balance += actual_credit
    wallet.updated_at = datetime.utcnow()
    db.add(wallet)
    
    txn = Transaction(
            patient_id=patient.id,
            amount=amount,
            type=TransactionType.TOPUP,
            payment_method=PaymentMethod.CARD, # Mocking card topup
            status=TransactionStatus.COMPLETED,
            reference=f"TOPUP-{int(datetime.utcnow().timestamp())}",
            cashier_name="Self"
    )
    db.add(txn)
    
    db.commit()
    
    background_tasks.add_task(manager.global_broadcast, f"billing_update: wallet topup for patient {patient.id}")
    
    # E-mail notification
    user_record = db.get(User, patient.user_id)
    if user_record and user_record.email:
        email_html = generate_wallet_alert_email(
            user_record.full_name, 
            "credit", 
            amount, 
            wallet.balance,
            description="Online Wallet Top-up"
        )
        send_email_background(user_record.email, "Najbel Clinic Wallet Credit", email_html)
    
    return {"message": "Top up successful (60 NGN fee applied)", "new_balance": wallet.balance}

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
