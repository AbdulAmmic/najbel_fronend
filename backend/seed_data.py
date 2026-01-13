from sqlmodel import Session, select
from app.db.session import engine, init_db
from app.models.user import User, UserRole, Doctor, Patient, UserBase
from app.models.bed import Bed, BedStatus
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.core.security import get_password_hash
from datetime import datetime, timedelta

def create_users(session: Session):
    print("Creating Users...")
    
    # Admin
    admin_email = "admin@najbel.com"
    if not session.exec(select(User).where(User.email == admin_email)).first():
        admin = User(
            email=admin_email,
            full_name="Super Admin",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        session.add(admin)

    # Doctor 1 (General)
    doc1_email = "doctor@najbel.com"
    doc1 = session.exec(select(User).where(User.email == doc1_email)).first()
    if not doc1:
        doc1 = User(
            email=doc1_email,
            full_name="Dr. Gregory House",
            hashed_password=get_password_hash("doc123"),
            role=UserRole.DOCTOR,
            is_active=True
        )
        session.add(doc1)
        session.commit()
        session.refresh(doc1)
        
        doctor_profile = Doctor(
            user_id=doc1.id,
            specialization="General Medicine",
            department="General",
            consultation_fee=100.0
        )
        session.add(doctor_profile)
        
    # Doctor 2 (Cardio)
    doc2_email = "cardio@najbel.com"
    if not session.exec(select(User).where(User.email == doc2_email)).first():
        doc2 = User(
            email=doc2_email,
            full_name="Dr. Strange",
            hashed_password=get_password_hash("doc123"),
            role=UserRole.DOCTOR,
            is_active=True
        )
        session.add(doc2)
        session.commit()
        session.refresh(doc2)
        
        doctor_profile2 = Doctor(
            user_id=doc2.id,
            specialization="Cardiology",
            department="Cardiology",
            consultation_fee=200.0
        )
        session.add(doctor_profile2)

    # Patient
    pat_email = "patient@najbel.com"
    pat = session.exec(select(User).where(User.email == pat_email)).first()
    if not pat:
        pat = User(
            email=pat_email,
            full_name="John Doe",
            hashed_password=get_password_hash("pat123"),
            role=UserRole.PATIENT,
            is_active=True,
            address="123 Baker St"
        )
        session.add(pat)
        session.commit()
        session.refresh(pat)
        
        patient_profile = Patient(
            user_id=pat.id,
            date_of_birth="1990-01-01",
            gender="Male",
            blood_group="O+"
        )
        session.add(patient_profile)

    session.commit()
    print("Users Created.")

def create_beds(session: Session):
    print("Creating Beds...")
    if not session.exec(select(Bed)).first():
        wards = ["General Ward A", "ICU"]
        for ward in wards:
            for i in range(1, 6): # 5 beds each
                bed = Bed(
                    ward_name=ward,
                    bed_number=f"{ward[0]}-{i:02d}",
                    status=BedStatus.AVAILABLE
                )
                session.add(bed)
        session.commit()
    # Create Nurse
    nurse = session.exec(select(User).where(User.email == "nurse@najbel.com")).first()
    if not nurse:
        nurse_user = User(
            email="nurse@najbel.com",
            hashed_password=get_password_hash("nurse123"),
            role=UserRole.NURSE,
            is_active=True,
            full_name="Nurse Ratched"
        )
        session.add(nurse_user)
        session.commit()
    
    # Create Pharmacist
    pharm = session.exec(select(User).where(User.email == "pharmacy@najbel.com")).first()
    if not pharm:
        pharm_user = User(
            email="pharmacy@najbel.com",
            hashed_password=get_password_hash("pharm123"),
            role=UserRole.PHARMACIST,
            is_active=True,
            full_name="Pharmacist Phil"
        )
        session.add(pharm_user)
        session.commit()

    print("Seed data created successfully!")
    print("Beds Created.")

    # Create Nurse
    nurse = session.exec(select(User).where(User.email == "nurse@najbel.com")).first()
    if not nurse:
        nurse_user = User(
            email="nurse@najbel.com",
            full_name="Nurse Ratched",
            hashed_password=get_password_hash("nurse123"),
            role=UserRole.NURSE,
            is_active=True
        )
        session.add(nurse_user)
        session.commit()
    
    # Create Pharmacist
    pharm = session.exec(select(User).where(User.email == "pharmacy@najbel.com")).first()
    if not pharm:
        pharm_user = User(
            email="pharmacy@najbel.com",
            full_name="Pharmacist Phil",
            hashed_password=get_password_hash("pharm123"),
            role=UserRole.PHARMACIST,
            is_active=True
        )
        session.add(pharm_user)
        session.commit()
    
    # Create Accountant
    acc = session.exec(select(User).where(User.email == "accountant@najbel.com")).first()
    if not acc:
        acc_user = User(
            email="accountant@najbel.com",
            full_name="Accountant Alex",
            hashed_password=get_password_hash("acc123"),
            role=UserRole.ACCOUNTANT,
            is_active=True
        )
        session.add(acc_user)
        session.commit()

    print("Staff Users Created.")

def create_appointments(session: Session):
    print("Creating Appointments...")
    # Link Patient to Doctor 1
    doc1 = session.exec(select(Doctor).join(User).where(User.email == "doctor@najbel.com")).first()
    pat = session.exec(select(Patient).join(User).where(User.email == "patient@najbel.com")).first()
    
    if doc1 and pat:
        # Create an appointment for TODAY
        app = Appointment(
            doctor_id=doc1.id,
            patient_id=pat.id,
            appointment_time=datetime.utcnow(), # Now
            status=AppointmentStatus.CONFIRMED,
            type=AppointmentType.OFFLINE,
            reason="Severe headache and dizziness"
        )
        session.add(app)
        session.commit()
        print(f"Appointment created for Dr. {doc1.user.full_name} and Patient {pat.user.full_name}")

def main():
    init_db() # Ensure tables exist
    with Session(engine) as session:
        create_users(session)
        create_beds(session)
        create_appointments(session)
    print("Seeding Complete!")

if __name__ == "__main__":
    main()
