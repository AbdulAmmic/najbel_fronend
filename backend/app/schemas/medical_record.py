from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class MedicalRecordBase(BaseModel):
    patient_id: int
    doctor_id: int
    visit_date: Optional[datetime] = None
    diagnosis: str
    symptoms: str
    treatment: str
    notes: Optional[str] = None

class MedicalRecordCreate(MedicalRecordBase):
    pass

class MedicalRecordUpdate(BaseModel):
    diagnosis: Optional[str] = None
    symptoms: Optional[str] = None
    treatment: Optional[str] = None
    notes: Optional[str] = None

class MedicalRecord(MedicalRecordBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
