from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class ConsultationBase(SQLModel):
    appointment_id: int = Field(foreign_key="appointment.id")
    doctor_id: int = Field(foreign_key="doctor.id")
    patient_id: int = Field(foreign_key="patient.id")
    symptoms: str
    diagnosis: str
    notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    is_admitted: bool = Field(default=False)

class Consultation(ConsultationBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    appointment: "Appointment" = Relationship()
    doctor: "Doctor" = Relationship()
    patient: "Patient" = Relationship()
    prescriptions: List["Prescription"] = Relationship(back_populates="consultation")
    lab_results: List["LabResult"] = Relationship(back_populates="consultation")

# Forward refs
from .appointment import Appointment
from .user import Doctor, Patient
from .prescription import Prescription
from .lab_result import LabResult
