from sqlmodel import Session, select, create_engine
from app.db.session import engine
from app.models.wallet import Wallet
from app.models.invoice import Invoice
from app.models.appointment import Appointment
from app.models.user import User, Patient

def debug_payments():
    try:
        with Session(engine) as session:
            # Check Wallet for patient 7
            wallet = session.exec(select(Wallet).where(Wallet.patient_id == 7)).first()
            if not wallet:
                print("No wallet found for patient 7!")
                return
            
            print(f"Patient 7 Wallet Balance: {wallet.balance}")

            # 1. Test Invoice Logic
            invoice = session.get(Invoice, 21)
            if invoice:
                print(f"Invoice 21 amount: {invoice.amount}")
                if wallet.balance < invoice.amount and not wallet.allow_overdraft:
                    print("--> ERROR: Insufficient wallet balance (Invoice)")
                else:
                    print("--> SUCCESS: Wallet balance sufficient (Invoice)")
            
            # 2. Test Booking Fee Logic
            fee = 5000.0  # Or whatever doctor fee
            print(f"Booking Fee amount: {fee}")
            if not wallet or (wallet.balance < fee and not wallet.allow_overdraft):
                 print("--> ERROR: Insufficient wallet balance for consultation fee")
            else:
                 print("--> SUCCESS: Wallet balance sufficient (Booking)")

            # Check for another patient just in case (like patient ID 15?)
            wallets = session.exec(select(Wallet)).all()
            print("All Wallets:", [(w.patient_id, w.balance) for w in wallets])
            
    except Exception as e:
        print("Exception:", e)

if __name__ == "__main__":
    debug_payments()
