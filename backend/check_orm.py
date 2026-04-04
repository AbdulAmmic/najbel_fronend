import os
import sys
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

# Add the backend directory to sys.path
sys.path.append(os.getcwd())

from app.core.config import settings
from app.models.consultation import Consultation
from app.models.chat import ChatMessage

def check_with_orm():
    print(f"Connecting to: {settings.DATABASE_URL[:30]}...")
    engine = create_engine(settings.DATABASE_URL)
    
    with Session(engine) as session:
        try:
            print("\n--- CHECKING CONSULTATION #1 (ORM) ---")
            statement = select(Consultation).where(Consultation.id == 1)
            result = session.exec(statement).first() if hasattr(session, 'exec') else session.execute(statement).first()
            
            # Handling both SQLModel and SQLAlchemy session styles
            if hasattr(result, 'Consultation'):
                cons = result.Consultation
            else:
                cons = result[0] if result else None
                
            if cons:
                print(f"Found Consultation #1: PatientID={cons.patient_id}, DoctorID={cons.doctor_id}, Status={cons.status}")
                
                print("\nChecking chat messages for this consultation...")
                msg_stmt = select(ChatMessage).where(ChatMessage.consultation_id == 1)
                msgs = session.execute(msg_stmt).all()
                print(f"Found {len(msgs)} messages in DB for room 1.")
            else:
                print("Consultation #1 NOT FOUND via ORM!")
                
                print("\nListing first 5 consultations:")
                all_stmt = select(Consultation).limit(5)
                results = session.execute(all_stmt).all()
                for r in results:
                    c = r[0]
                    print(f" - ID: {c.id}, Status: {c.status}")
                    
        except Exception as e:
            print(f"Error checking via ORM: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    check_with_orm()
