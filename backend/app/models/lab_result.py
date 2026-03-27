from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class LabResultBase(SQLModel):
    patient_id: int = Field(foreign_key="patient.id")
    test_name: str
    result: Optional[str] = None
    units: Optional[str] = None
    reference_range: Optional[str] = None
    notes: Optional[str] = None
    status: str = Field(default="requested") # requested, sample_collected, processing, completed, validated
    priority: str = Field(default="normal") # normal, urgent
    sample_id: Optional[str] = None
    
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    collected_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    validated_at: Optional[datetime] = None
    validated_by: Optional[int] = None # ID of pathologist/verifier
    
    doctor_id: Optional[int] = Field(default=None, foreign_key="doctor.id")
    consultation_id: Optional[int] = Field(default=None, foreign_key="consultation.id")

class LabResult(LabResultBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    patient: "Patient" = Relationship(back_populates="lab_results")
    consultation: Optional["Consultation"] = Relationship(back_populates="lab_results")

from .user import Patient
from .consultation import Consultation

