from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from enum import Enum

class AppointmentType(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"

class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class CommunicationPreference(str, Enum):
    IN_APP_CHAT = "in_app_chat"
    VIDEO_WHATSAPP = "video_whatsapp"

class AppointmentBase(SQLModel):
    doctor_id: int = Field(foreign_key="doctor.id")
    patient_id: int = Field(foreign_key="patient.id")
    appointment_time: datetime
    type: AppointmentType = Field(default=AppointmentType.OFFLINE)
    status: AppointmentStatus = Field(default=AppointmentStatus.PENDING)
    communication_preference: CommunicationPreference = Field(default=CommunicationPreference.IN_APP_CHAT)
    reason: Optional[str] = None
    meeting_link: Optional[str] = None  # For online appointments
    notes: Optional[str] = None

class Appointment(AppointmentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    doctor: "Doctor" = Relationship(back_populates="appointments")
    patient: "Patient" = Relationship(back_populates="appointments")

from .user import Doctor, Patient
