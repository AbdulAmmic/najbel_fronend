from sqlmodel import Session, create_engine, select
from app.models.radiology import RadiologyScan
from app.models.user import Patient
from datetime import datetime, timedelta
import random

def seed_radiology_data():
    db_file = "najbel.db"
    engine = create_engine(f"sqlite:///{db_file}")
    
    with Session(engine) as session:
        # Get a patient
        patient = session.exec(select(Patient)).first()
        if not patient:
            print("No patient found. Run direct_seed.py first.")
            return

        print(f"Seeding radiology for Patient ID: {patient.id}")

        scans = [
            ("X-Ray", "Chest", "Cough and difficulty breathing"),
            ("MRI", "Brain", "Frequent headaches"),
            ("CT", "Abdomen", "Pain in lower right quadrant")
        ]
        
        mock_urls = {
            "X-Ray": "https://prod-images-static.radiopaedia.org/images/1301049/0b2866946051772186842790938448_jumbo.jpeg",
            "MRI": "https://prod-images-static.radiopaedia.org/images/52672464/20b4105267b1479873d63503164993_jumbo.jpeg",
            "CT": "https://prod-images-static.radiopaedia.org/images/2946289/6e43621421f92419bc9a6869b7f575_jumbo.jpeg"
        }

        for scan_type, body_part, reason in scans:
            scan = RadiologyScan(
                patient_id=patient.id,
                scan_type=scan_type,
                body_part=body_part,
                reason=reason,
                status="completed",
                image_url=mock_urls.get(scan_type),
                requested_at=datetime.utcnow() - timedelta(days=random.randint(1, 10))
            )
            session.add(scan)
            
        session.commit()
        print("Seeded Radiology Scans successfully.")

if __name__ == "__main__":
    seed_radiology_data()
