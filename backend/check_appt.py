from sqlmodel import Session, select
from app.db.session import engine
from app.models.appointment import Appointment

with Session(engine) as session:
    appts = session.exec(select(Appointment)).all()
    print(f"Total Appointments: {len(appts)}")
    for a in appts:
        print(f"ID: {a.id}, DoctorID: {a.doctor_id}, PatientID: {a.patient_id}, Status: {a.status}")
