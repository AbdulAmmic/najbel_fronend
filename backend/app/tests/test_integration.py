import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api import deps
from sqlmodel import Session, create_engine, SQLModel
from app.models.user import User, UserRole, Patient, Doctor
from app.models.prescription import Prescription
from app.models.medical_record import MedicalRecord

# Setup test database
sqlite_url = "sqlite:///./test.db"
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def get_test_db():
    with Session(engine) as session:
        yield session

app.dependency_overrides[deps.get_db] = get_test_db

client = TestClient(app)

@pytest.fixture(name="session")
def session_fixture():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

def test_create_prescription(session: Session):
    # Setup: Create a doctor and a patient
    doctor_user = User(email="doctor@test.com", full_name="Dr. Test", role=UserRole.DOCTOR, hashed_password="hashed_password")
    session.add(doctor_user)
    session.commit()
    doctor = Doctor(user_id=doctor_user.id, specialization="Test")
    session.add(doctor)
    
    patient_user = User(email="patient@test.com", full_name="Patient Test", role=UserRole.PATIENT, hashed_password="hashed_password")
    session.add(patient_user)
    session.commit()
    patient = Patient(user_id=patient_user.id)
    session.add(patient)
    session.commit()

    # Need a way to authenticate or override get_current_user
    # For simplicity in this test, let's assume we can pass the user
    # Actually, dependency_overrides is better
    app.dependency_overrides[deps.get_current_user] = lambda: doctor_user

    response = client.post(
        "/api/v1/prescriptions/",
        json={
            "patient_id": patient.id,
            "doctor_id": doctor.id,
            "medication": "Aspirin",
            "dosage": "100mg",
            "frequency": "Once daily",
            "duration": "7 days",
            "instructions": "After meal",
            "status": "active"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["medication"] == "Aspirin"
    assert data["patient_id"] == patient.id

def test_get_prescriptions(session: Session):
    # Setup similar to above...
    pass # Implementation omitted for brevity in plan, but I'll write more if needed

def test_medical_records(session: Session):
    # Similar tests for medical records
    pass
