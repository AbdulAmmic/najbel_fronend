import sys
import os

# Add parent directory to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select, SQLModel, create_engine
from app.models.user import User, UserRole, Doctor, Patient
from app.models.appointment import Appointment
from app.models.prescription import Prescription
from app.models.medical_record import MedicalRecord
from app.models.vitals import Vitals
from app.models.lab_result import LabResult
from app.core.security import get_password_hash
from app.core.config import settings

def seed():
    print("Direct Seeding Start...")
    engine = create_engine(settings.DATABASE_URL, echo=False)
    
    try:
        print("Creating tables...")
        SQLModel.metadata.create_all(engine)
        
        with Session(engine) as session:
            # Check for existing doctor
            if session.exec(select(User).where(User.email == "doctor1@najbel.com")).first():
                print("Doctor1 already exists. Skipping seed.")
                return

            print("Creating Patient...")
            p_user = User(
                email="patient@najbel.com",
                full_name="Test Patient",
                hashed_password=get_password_hash("password"),
                role=UserRole.PATIENT,
                is_active=True
            )
            session.add(p_user)
            session.commit()
            session.refresh(p_user)
            
            p_profile = Patient(user_id=p_user.id, date_of_birth="1990-01-01", gender="Male")
            session.add(p_profile)
            
            print("Creating Doctors...")
            d_user1 = User(
                email="doctor1@najbel.com",
                full_name="Dr. Musa Abdullahi",
                hashed_password=get_password_hash("password"),
                role=UserRole.DOCTOR,
                is_active=True
            )
            session.add(d_user1)
            session.commit()
            session.refresh(d_user1)
            
            d_prof1 = Doctor(user_id=d_user1.id, specialization="General", consultation_fee=5000)
            session.add(d_prof1)
            
            d_user2 = User(
                email="doctor2@najbel.com",
                full_name="Dr. Sarah Ibrahim",
                hashed_password=get_password_hash("password"),
                role=UserRole.DOCTOR,
                is_active=True
            )
            session.add(d_user2)
            session.commit()
            session.refresh(d_user2)
            
            d_prof2 = Doctor(user_id=d_user2.id, specialization="Cardiology", consultation_fee=10000)
            session.add(d_prof2)
            
            session.commit()
            print("Seeding Successful!")

    except Exception as e:
        print(f"SEED ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    seed()
