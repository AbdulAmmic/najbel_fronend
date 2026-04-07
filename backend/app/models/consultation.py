from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from enum import Enum


class ConsultationStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"


class ConsultationBase(SQLModel):
    appointment_id: int = Field(foreign_key="appointment.id")
    doctor_id: int = Field(foreign_key="doctor.id")
    patient_id: int = Field(foreign_key="patient.id")
    symptoms: str = Field(default="Pending")
    diagnosis: str = Field(default="Pending")
    notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    is_admitted: bool = Field(default=False)

    # New fields — state machine
    status: ConsultationStatus = Field(default=ConsultationStatus.DRAFT)
    consultation_fee: float = Field(default=0.0)
    consultation_fee_invoice_id: Optional[int] = Field(default=None, foreign_key="invoice.id")
    locked_at: Optional[datetime] = Field(default=None)

    # Google Meet link generated at booking
    meet_link: Optional[str] = Field(default=None)


class Consultation(ConsultationBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    appointment: "Appointment" = Relationship()
    doctor: "Doctor" = Relationship()
    patient: "Patient" = Relationship()
    prescriptions: List["Prescription"] = Relationship(back_populates="consultation")
    lab_results: List["LabResult"] = Relationship(back_populates="consultation")

# End of file
