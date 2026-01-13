from sqlmodel import Session, select
from app.db.session import engine, init_db
from app.models.user import User, UserRole, Doctor, Patient
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.core import security
from datetime import datetime, timedelta

def init_data():
    init_db()
    with Session(engine) as session:
        # Check if data exists
        user = session.exec(select(User).where(User.email == "patient@najbel.com")).first()
        if user:
            print("Data already initialized")
            return

        # Create Patient
        patient_user = User(
            email="patient@najbel.com",
            full_name="Abdurrahman Mustapha",
            hashed_password=security.get_password_hash("password123"),
            role=UserRole.PATIENT,
            is_active=True
        )
        session.add(patient_user)
        session.commit()
        session.refresh(patient_user)
        
        patient_profile = Patient(user_id=patient_user.id, date_of_birth="1990-01-01", blood_group="O+")
        session.add(patient_profile)
        
        # Create Doctor 1
        doc1_user = User(
            email="musa@najbel.com",
            full_name="Dr. Musa Abdullahi",
            hashed_password=security.get_password_hash("doctor123"),
            role=UserRole.DOCTOR,
            is_active=True
        )
        session.add(doc1_user)
        session.commit()
        session.refresh(doc1_user)
        
        doc1_profile = Doctor(
            user_id=doc1_user.id, 
            specialization="Cardiologist",
            consultation_fee=15000.0,
            bio="Experienced Cardiologist"
        )
        session.add(doc1_profile)
        session.commit()
        session.refresh(doc1_profile)

        # Create Doctor 2
        doc2_user = User(
            email="fatima@najbel.com",
            full_name="Dr. Fatima Bello",
            hashed_password=security.get_password_hash("doctor123"),
            role=UserRole.DOCTOR,
            is_active=True
        )
        session.add(doc2_user)
        session.commit()
        session.refresh(doc2_user)
        
        doc2_profile = Doctor(
            user_id=doc2_user.id, 
            specialization="General Physician",
            consultation_fee=5000.0
        )
        session.add(doc2_profile)
        session.commit()
        session.refresh(doc2_profile)

        # Appointments
        tomorrow = datetime.utcnow() + timedelta(days=1)
        
        appt1 = Appointment(
            doctor_id=doc1_profile.id,
            patient_id=patient_profile.id,
            appointment_time=tomorrow.replace(hour=10, minute=30),
            type=AppointmentType.ONLINE,
            status=AppointmentStatus.CONFIRMED,
            meeting_link="https://meet.google.com/abc-defg-hij",
            notes="Follow up for BP check",
            created_at=datetime.utcnow()
        )
        session.add(appt1)
        
        appt2 = Appointment(
             doctor_id=doc2_profile.id,
            patient_id=patient_profile.id,
            appointment_time=tomorrow.replace(hour=14, minute=0),
            type=AppointmentType.OFFLINE,
            status=AppointmentStatus.PENDING,
            notes="General checkup",
            created_at=datetime.utcnow()
        )
        session.add(appt2)

        session.commit()
        print("Data initialized successfully!")

if __name__ == "__main__":
    init_data()
