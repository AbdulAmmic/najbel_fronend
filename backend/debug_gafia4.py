from app.db.session import engine
from sqlmodel import Session, select
from app.models.patient import Patient
from app.models.user import User
from app.models.wallet import Wallet

db = Session(engine)
patients = db.exec(select(Patient)).all()
for p in patients:
    u = db.get(User, p.user_id)
    w = db.exec(select(Wallet).where(Wallet.patient_id == p.id)).first()
    v_acc = w.virtual_account_number if w else 'None'
    print(f"Patient {p.id} | User: {u.full_name if u else 'None'} | Virtual Acct: {v_acc} | Unique ID: {p.unique_id}")
