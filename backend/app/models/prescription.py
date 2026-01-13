from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class PrescriptionBase(SQLModel):
    patient_id: int = Field(foreign_key="patient.id")
    doctor_id: int = Field(foreign_key="doctor.id")
    medication: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None
    status: str = Field(default="active") # active, completed, cancelled
    consultation_id: Optional[int] = Field(default=None, foreign_key="consultation.id")

class Prescription(PrescriptionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    patient: "Patient" = Relationship()
    doctor: "Doctor" = Relationship()
    consultation: Optional["Consultation"] = Relationship(back_populates="prescriptions")

from .user import Patient, Doctor
# Consultation imported at runtime to avoid circular imports? 
# Or use string forward reference, which we did.
from .consultation import Consultation
