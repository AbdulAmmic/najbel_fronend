from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from .user import UserBase, PatientInfo, DoctorInfo

class LabResultBase(BaseModel):
    patient_id: int
    test_name: str
    result: Optional[str] = None
    units: Optional[str] = None
    reference_range: Optional[str] = None
    notes: Optional[str] = None
    status: str = "requested"
    priority: str = "normal"
    urgency: Optional[str] = "routine"
    sample_id: Optional[str] = None
    invoice_id: Optional[int] = None
    short_id: Optional[str] = None
    result_data: Optional[str] = None
    doctor_comments: Optional[str] = None

class LabResultCreate(LabResultBase):
    pass

class LabResultUpdate(BaseModel):
    result: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    units: Optional[str] = None
    reference_range: Optional[str] = None
    sample_id: Optional[str] = None
    priority: Optional[str] = None
    urgency: Optional[str] = None
    doctor_comments: Optional[str] = None
    result_data: Optional[str] = None

class LabResult(LabResultBase):
    id: int
    recorded_at: datetime
    collected_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    validated_at: Optional[datetime] = None
    validated_by: Optional[int] = None
    validator: Optional[UserBase] = None
    patient: Optional[PatientInfo] = None
    doctor: Optional["DoctorInfo"] = None

    class Config:
        orm_mode = True

LabResult.update_forward_refs()
