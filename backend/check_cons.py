import os
from sqlalchemy import create_engine, text
from app.core.config import settings

def check_consultation():
    print(f"Connecting to: {settings.DATABASE_URL[:30]}...")
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            print(f"\n--- CHECKING CONSULTATION #1 ---")
            query = text("SELECT id, patient_id, doctor_id, status FROM consultation WHERE id = 1")
            result = conn.execute(query).fetchone()
            
            if result:
                print(f"Found Consultation #1: PatientID={result[1]}, DoctorID={result[2]}, Status={result[3]}")
            else:
                print("Consultation #1 NOT FOUND in database!")
                
                print("\nListing first 5 consultations:")
                query_all = text("SELECT id, status FROM consultations LIMIT 5")
                all_results = conn.execute(query_all).fetchall()
                for r in all_results:
                    print(f" - ID: {r[0]}, Status: {r[1]}")
                    
        except Exception as e:
            print(f"Error checking consultation: {e}")

if __name__ == "__main__":
    check_consultation()
