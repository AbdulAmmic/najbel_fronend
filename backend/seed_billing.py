from sqlmodel import Session, create_engine, select
from app.models.invoice import Invoice, InvoiceStatus, InvoiceItem
from app.models.wallet import Wallet
from app.models.user import Patient
from datetime import datetime, timedelta
import random

def seed_billing_data():
    db_file = "najbel.db"
    engine = create_engine(f"sqlite:///{db_file}")
    
    with Session(engine) as session:
        # Get a patient
        patient = session.exec(select(Patient)).first()
        if not patient:
            print("No patient found. Run direct_seed.py first.")
            return

        print(f"Seeding billing for Patient ID: {patient.id}")

        # Seed Wallet
        wallet = session.exec(select(Wallet).where(Wallet.patient_id == patient.id)).first()
        if not wallet:
            wallet = Wallet(patient_id=patient.id, balance=500.0)
            session.add(wallet)
            print("Created Wallet with $500")
        else:
            wallet.balance = 1000.0
            session.add(wallet)
            print("Updated Wallet to $1000")

        # Seed Invoices
        services = [("Consultation Fee", 50.0), ("Malaria Test", 25.0), ("Paracetamol Pack", 12.0)]
        
        for i in range(3):
            inv = Invoice(
                invoice_number=f"INV-SEED-{random.randint(10000,99999)}",
                patient_id=patient.id,
                amount=0, # will calc
                status=InvoiceStatus.PENDING if i < 2 else InvoiceStatus.PAID,
                payment_method="cash" if i == 2 else None,
                due_date=datetime.utcnow() + timedelta(days=7)
            )
            session.add(inv)
            session.commit()
            session.refresh(inv)
            
            # Add items
            total = 0
            for _ in range(random.randint(1, 3)):
                service = random.choice(services)
                item = InvoiceItem(
                    invoice_id=inv.id,
                    description=service[0],
                    amount=service[1]
                )
                session.add(item)
                total += service[1]
            
            inv.amount = total
            session.add(inv)
            
        session.commit()
        print("Seeded Invoices successfully.")

if __name__ == "__main__":
    seed_billing_data()
