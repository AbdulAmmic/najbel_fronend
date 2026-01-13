from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class LabResultBase(BaseModel):
    patient_id: int
    test_name: str
    result: str
    units: Optional[str] = None
    reference_range: Optional[str] = None
    notes: Optional[str] = None
    status: str = "completed"

class LabResultCreate(LabResultBase):
    pass

class LabResultUpdate(BaseModel):
    result: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    units: Optional[str] = None
    reference_range: Optional[str] = None

class LabResult(LabResultBase):
    id: int
    recorded_at: datetime

    class Config:
        orm_mode = True
