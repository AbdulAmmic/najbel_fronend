from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class VitalsBase(SQLModel):
    patient_id: int = Field(foreign_key="patient.id")
    weight: Optional[float] = None
    height: Optional[float] = None
    blood_pressure: Optional[str] = None # e.g. "120/80"
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    oxygen_saturation: Optional[int] = None
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

class Vitals(VitalsBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    patient: "Patient" = Relationship(back_populates="vitals")

from .user import Patient
