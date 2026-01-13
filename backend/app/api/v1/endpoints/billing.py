from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime, timedelta
import random

from app.api import deps
from app.models.user import User, UserRole, Patient
from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus
from app.models.wallet import Wallet
from app.models.transaction import Transaction, TransactionType, PaymentMethod, TransactionStatus
from app.schemas.finance import InvoiceCreate, Invoice as InvoiceSchema, Wallet as WalletSchema, WalletTopup, Transaction as TransactionSchema

router = APIRouter()

@router.get("/invoices/my", response_model=List[InvoiceSchema])
def get_my_invoices(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.PATIENT:
        # For staff, we might want to return all or filter by search, 
        # but for this specific "my" endpoint, we return based on current patient
        raise HTTPException(status_code=403, detail="Not authorized")
    
    patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
    if not patient:
        return []
        
    return db.exec(select(Invoice).where(Invoice.patient_id == patient.id)).all()

@router.get("/invoices", response_model=List[InvoiceSchema])
def get_all_invoices(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role == UserRole.PATIENT:
         raise HTTPException(status_code=403, detail="Use /my endpoint")
    
    return db.exec(select(Invoice)).all()

@router.post("/invoices", response_model=InvoiceSchema)
def create_invoice(
    *,
    db: Session = Depends(deps.get_db),
    invoice_in: InvoiceCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # Generate unique invoice number
    inv_num = f"INV-{datetime.now().year}-{random.randint(1000, 9999)}"
    
    invoice = Invoice(
        invoice_number=inv_num,
        patient_id=invoice_in.patient_id,
        amount=invoice_in.amount,
        due_date=invoice_in.due_date,
        status=InvoiceStatus.PENDING
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    
    for item_in in invoice_in.items:
        item = InvoiceItem(
            invoice_id=invoice.id,
            description=item_in.description,
            amount=item_in.amount
        )
        db.add(item)
    
    db.commit()
    db.refresh(invoice)
    return invoice

@router.get("/wallet", response_model=WalletSchema)
def get_my_wallet(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
        
    wallet = db.exec(select(Wallet).where(Wallet.patient_id == patient.id)).first()
    if not wallet:
        # Create wallet if not exists
        wallet = Wallet(patient_id=patient.id, balance=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    
    return wallet

@router.post("/wallet/topup", response_model=TransactionSchema)
def topup_wallet(
    *,
    db: Session = Depends(deps.get_db),
    topup_in: WalletTopup,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
        
    wallet = db.exec(select(Wallet).where(Wallet.patient_id == patient.id)).first()
    if not wallet:
        wallet = Wallet(patient_id=patient.id, balance=0.0)
        db.add(wallet)
    
    wallet.balance += topup_in.amount
    wallet.updated_at = datetime.utcnow()
    
    transaction = Transaction(
        patient_id=patient.id,
        amount=topup_in.amount,
        type=TransactionType.TOPUP,
        payment_method=topup_in.payment_method,
        reference=topup_in.reference,
        status=TransactionStatus.COMPLETED
    )
    
    db.add(wallet)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

@router.put("/invoices/{invoice_id}/pay", response_model=InvoiceSchema)
def pay_invoice(
    *,
    db: Session = Depends(deps.get_db),
    invoice_id: int,
    payment_method: PaymentMethod,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    invoice = db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(status_code=400, detail="Invoice already paid")

    if current_user.role == UserRole.PATIENT:
        # Verify ownership
        current_patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not current_patient or invoice.patient_id != current_patient.id:
            raise HTTPException(status_code=403, detail="Not authorized to pay this invoice")
        
    patient = db.get(Patient, invoice.patient_id)
    
    if payment_method == PaymentMethod.WALLET:
        wallet = db.exec(select(Wallet).where(Wallet.patient_id == patient.id)).first()
        if not wallet or wallet.balance < invoice.amount:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")
        wallet.balance -= invoice.amount
        wallet.updated_at = datetime.utcnow()
        db.add(wallet)
    
    invoice.status = InvoiceStatus.PAID
    
    transaction = Transaction(
        patient_id=patient.id,
        invoice_id=invoice.id,
        amount=invoice.amount,
        type=TransactionType.PAYMENT,
        payment_method=payment_method,
        reference=f"PAY-{invoice.invoice_number}-{random.randint(100, 999)}",
        status=TransactionStatus.COMPLETED
    )
    
    db.add(invoice)
    db.add(transaction)
    db.commit()
    db.refresh(invoice)
    return invoice

@router.get("/transactions/my", response_model=List[TransactionSchema])
def get_my_transactions(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
    if not patient: return []
    return db.exec(select(Transaction).where(Transaction.patient_id == patient.id).order_by(Transaction.created_at.desc())).all()
