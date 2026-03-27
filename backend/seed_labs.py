from sqlmodel import Session, create_engine, select
from app.models.lab_result import LabResult
from app.models.user import Patient, User, UserRole
from app.models.inventory import InventoryItem
from datetime import datetime, timedelta
import random

def seed_lab_data():
    db_file = "najbel.db"
    engine = create_engine(f"sqlite:///{db_file}")
    
    with Session(engine) as session:
        # Get a patient
        patient = session.exec(select(Patient)).first()
        if not patient:
            print("No patient found. Run direct_seed.py first.")
            return

        print(f"Seeding items for Patient ID: {patient.id}")

        # Create Requests
        tests = ["Full Blood Count", "Malaria Parasite", "Lipid Profile", "Liver Function Test"]
        statuses = ["requested", "sample_collected", "completed", "validated"]
        
        for i, test in enumerate(tests):
            status = statuses[i % len(statuses)]
            
            lab = LabResult(
                patient_id=patient.id,
                test_name=test,
                status=status,
                priority="normal" if i % 2 == 0 else "urgent",
                recorded_at=datetime.utcnow()
            )
            
            if status == "sample_collected":
                lab.sample_id = f"SA-{random.randint(1000,9999)}"
                lab.collected_at = datetime.utcnow()
                
            if status == "completed":
                lab.sample_id = f"SA-{random.randint(1000,9999)}"
                lab.collected_at = datetime.utcnow() - timedelta(hours=2)
                lab.processed_at = datetime.utcnow()
                lab.result = f"{random.randint(10, 100)} unit/L"
                
            session.add(lab)
            
        session.commit()
        print("Seeded Lab Requests successfully.")

if __name__ == "__main__":
    seed_lab_data()
