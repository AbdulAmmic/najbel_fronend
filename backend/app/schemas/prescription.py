from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class PrescriptionBase(BaseModel):
    patient_id: int
    doctor_id: int
    medication: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None
    status: Optional[str] = "active"

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionUpdate(BaseModel):
    medication: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None
    status: Optional[str] = None

class Prescription(PrescriptionBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
