from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class MedicalRecordBase(SQLModel):
    patient_id: int = Field(foreign_key="patient.id")
    doctor_id: int = Field(foreign_key="doctor.id")
    visit_date: datetime = Field(default_factory=datetime.utcnow)
    diagnosis: str
    symptoms: str
    treatment: str
    notes: Optional[str] = None

class MedicalRecord(MedicalRecordBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    patient: "Patient" = Relationship()
    doctor: "Doctor" = Relationship()

from .user import Patient, Doctor
