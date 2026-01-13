from sqlmodel import Session, select, SQLModel
from app.db.session import engine
from app.models.user import User, UserRole, Doctor, Patient
from app.core.security import get_password_hash
from datetime import datetime

def seed():
    try:
        # Ensure tables exist
        SQLModel.metadata.create_all(engine)
        
        with Session(engine) as session:
            # Check if users already exist
            existing_users = session.exec(select(User)).all()
            if existing_users:
                print("Database already seeded with users.")
                return

            print("Seeding database...")
            
            # 1. Create Patient User
            patient_user = User(
                email="patient@najbel.com",
                full_name="Test Patient",
                username="patient",
                hashed_password=get_password_hash("password"),
                role=UserRole.PATIENT,
                is_active=True
            )
            session.add(patient_user)
            session.commit()
            session.refresh(patient_user)
            
            patient_profile = Patient(
                user_id=patient_user.id,
                date_of_birth="1990-01-01",
                gender="Male",
                blood_group="O+"
            )
            session.add(patient_profile)
            
            # 2. Create Doctor User
            doctor_user = User(
                email="doctor@najbel.com",
                full_name="Dr. Musa Abdullahi",
                username="doctor",
                hashed_password=get_password_hash("password"),
                role=UserRole.DOCTOR,
                is_active=True
            )
            session.add(doctor_user)
            session.commit()
            session.refresh(doctor_user)
            
            doctor_profile = Doctor(
                user_id=doctor_user.id,
                specialization="General Medicine",
                consultation_fee=5000.0,
                bio="Experienced general practitioner."
            )
            session.add(doctor_profile)
            
            # 3. Create another Doctor (ID 2 hopefully)
            doctor_user2 = User(
                email="sarah@najbel.com",
                full_name="Dr. Sarah Ibrahim",
                username="sarah",
                hashed_password=get_password_hash("password"),
                role=UserRole.DOCTOR,
                is_active=True
            )
            session.add(doctor_user2)
            session.commit()
            session.refresh(doctor_user2)
            
            doctor_profile2 = Doctor(
                user_id=doctor_user2.id,
                specialization="Cardiology",
                consultation_fee=10000.0,
                bio="Expert in heart health."
            )
            session.add(doctor_profile2)
            
            session.commit()
            print("Seeding complete.")
    except Exception as e:
        print(f"Error during seeding: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    seed()
