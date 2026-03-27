from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class RadiologyScanBase(SQLModel):
    patient_id: int = Field(foreign_key="patient.id")
    doctor_id: Optional[int] = Field(default=None, foreign_key="doctor.id")
    
    scan_type: str # X-Ray, MRI, CT, Ultrasound
    body_part: str # Chest, Knee, Brain
    reason: Optional[str] = None
    
    image_url: Optional[str] = None
    findings: Optional[str] = None
    status: str = Field(default="requested") # requested, completed
    
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class RadiologyScan(RadiologyScanBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    patient: "Patient" = Relationship(back_populates="scans")
    
from .user import Patient
