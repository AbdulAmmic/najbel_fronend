import sys
sys.path.insert(0, '.')
from app.db.session import engine
from sqlmodel import Session, select
from app.models.invoice import Invoice, InvoiceStatus
from app.models.wallet import Wallet
from app.models.lab_result import LabResult
from app.models.prescription import Prescription
from app.models.transaction import Transaction, TransactionType, TransactionStatus, PaymentMethod
from datetime import datetime

with Session(engine) as db:
    patient_id = 6
    wallet = db.exec(select(Wallet).where(Wallet.patient_id == patient_id)).first()
    print('Wallet:', wallet)
    
    invoices = db.exec(select(Invoice).where(Invoice.patient_id == patient_id, Invoice.status == InvoiceStatus.PENDING)).all()
    for inv in invoices:
        print(f'Invoice id={inv.id} num={inv.invoice_number} amount={inv.amount}')
        lab = db.exec(select(LabResult).where(LabResult.invoice_id == inv.id)).first()
        print(f'  LabResult linked: {lab}')
    
    if invoices and wallet:
        inv = invoices[0]
        print(f'\nSimulating payment of invoice {inv.id} (amount={inv.amount})...')
        print(f'Wallet balance before: {wallet.balance}')
        
        # Try the deduction
        wallet.balance -= inv.amount
        db.add(wallet)
        
        txn = Transaction(
            invoice_id=inv.id,
            patient_id=inv.patient_id,
            amount=inv.amount,
            type=TransactionType.PAYMENT,
            payment_method=PaymentMethod.WALLET,
            status=TransactionStatus.COMPLETED,
            reference=f"TXN-WAL-TEST",
            cashier_name="System"
        )
        db.add(txn)
        
        inv.status = InvoiceStatus.PAID
        inv.payment_method = "wallet"
        db.add(inv)
        
        lab = db.exec(select(LabResult).where(LabResult.invoice_id == inv.id)).first()
        if lab:
            print(f'  Updating lab result status from {lab.status} to paid')
            if lab.status == "requested":
                lab.status = "paid"
                db.add(lab)
        
        try:
            db.commit()
            print('SUCCESS! Payment committed.')
        except Exception as e:
            db.rollback()
            print(f'FAILED: {e}')
