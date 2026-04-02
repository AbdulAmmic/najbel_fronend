from sqlmodel import Session, select, create_engine, SQLModel
from app.db.session import engine
import os

# Set environment variable to backend for consistency
os.environ["PYTHONPATH"] = "c:/Users/IMLUX/Documents/works/najbel/najbel_clinic/backend"

def check_schema():
    from app.models.user import Patient, User
    from app.models.prescription import Prescription
    from app.models.vitals import Vitals
    from app.models.bed import Bed
    
    print("Checking database columns...")
    try:
        with Session(engine) as session:
            # Try some basic queries
            patients = session.exec(select(Patient).limit(1)).first()
            if patients:
                print(f"Sample Patient: {patients.unique_id}")
            else:
                print("No patients found.")
                
            prescriptions = session.exec(select(Prescription).limit(1)).first()
            if prescriptions:
                print(f"Sample Prescription Status: {prescriptions.status}")
                
            vitals = session.exec(select(Vitals).limit(1)).first()
            if vitals:
                print(f"Sample Vitals BP: {vitals.blood_pressure}")
                
            beds = session.exec(select(Bed).limit(1)).first()
            if beds:
                print(f"Sample Bed Ward: {beds.ward_name}")
                
    except Exception as e:
        print(f"Schema Error detected: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_schema()
