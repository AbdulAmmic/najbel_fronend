import sys
import os
sys.path.append(os.getcwd())
from sqlmodel import Session, create_engine, select
from app.models import LabResult, Patient, User, Doctor, Consultation, Invoice # Import all to register in metadata
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
with Session(engine) as session:
    results = session.exec(select(LabResult)).all()
    count = len(results)
    for r in results:
        session.delete(r)
    session.commit()
    print(f"Deleted {count} lab results")
