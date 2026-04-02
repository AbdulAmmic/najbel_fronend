from sqlmodel import Session, create_engine, select
from app.models.consultation import Consultation
from app.models.referral import Referral
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with Session(engine) as session:
    consultations = session.exec(select(Consultation)).all()
    print(f"Total Consultations: {len(consultations)}")
    for c in consultations:
        print(f"  Consultation ID: {c.id}, Patient ID: {c.patient_id}, Doctor ID: {c.doctor_id}")
    
    referrals = session.exec(select(Referral)).all()
    print(f"\nTotal Referrals: {len(referrals)}")
    for r in referrals:
        print(f"  Referral ID: {r.id}, Patient ID: {r.patient_id}, From: {r.from_doctor_id}, To: {r.to_doctor_id}, Status: {r.status}, Consultation ID: {r.consultation_id}")
