from app.db.session import engine, SessionLocal
from app.models.wallet import Wallet
from app.models.user import User, Patient, Doctor
from app.models.invoice import Invoice
from app.models.transaction import Transaction
from app.models.prescription import Prescription
from app.models.bed import Bed
from app.models.attendance import AttendanceLog
from app.models.appointment import Appointment
from app.models.notification import Notification

from sqlmodel import Session, select
import json
from fastapi.encoders import jsonable_encoder

def test():
    with SessionLocal() as session:
        wallet = session.exec(select(Wallet).where(Wallet.id == 1)).first()
        if wallet:
            print("WALLET DIR", dir(wallet))
            print("WALLET DICT", wallet.model_dump())
            # FastAPI uses jsonable_encoder
            print("FASTAPI ENCODER:", jsonable_encoder(wallet))
            
if __name__ == "__main__":
    test()
