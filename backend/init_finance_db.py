from sqlmodel import SQLModel, create_engine
from app.core.config import settings
# Import all models to ensure they are registered with SQLModel
from app.models import (
    User, Doctor, Patient, Appointment, AttendanceLog, 
    Prescription, MedicalRecord, Vitals, LabResult,
    Wallet, Invoice, InvoiceItem, Transaction
)

engine = create_engine(settings.DATABASE_URL)

def init_db():
    print("Initializing new financial tables...")
    SQLModel.metadata.create_all(engine)
    print("Database tables synchronized successfully.")

if __name__ == "__main__":
    init_db()
