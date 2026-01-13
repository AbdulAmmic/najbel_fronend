from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.models.appointment import AppointmentType, AppointmentStatus, CommunicationPreference
from .user import DoctorInfo, PatientInfo

class AppointmentBase(BaseModel):
    doctor_id: int
    appointment_time: datetime
    type: Optional[AppointmentType] = AppointmentType.OFFLINE
    communication_preference: Optional[CommunicationPreference] = CommunicationPreference.IN_APP_CHAT
    reason: Optional[str] = None
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    status: Optional[AppointmentStatus] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None
    appointment_time: Optional[datetime] = None

class Appointment(AppointmentBase):
    id: int
    patient_id: int
    status: AppointmentStatus
    meeting_link: Optional[str] = None
    created_at: datetime
    
    doctor: Optional[DoctorInfo] = None
    patient: Optional[PatientInfo] = None

    class Config:
        orm_mode = True
