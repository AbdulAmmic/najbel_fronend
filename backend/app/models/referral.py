from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from enum import Enum

class ReferralStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class ReferralUrgency(str, Enum):
    ROUTINE = "routine"
    URGENT = "urgent"
    EMERGENCY = "emergency"

class ReferralBase(SQLModel):
    from_doctor_id: int = Field(foreign_key="doctor.id")
    to_doctor_id: int = Field(foreign_key="doctor.id")
    patient_id: int = Field(foreign_key="patient.id")
    reason: str
    urgency: ReferralUrgency = Field(default=ReferralUrgency.ROUTINE)
    status: ReferralStatus = Field(default=ReferralStatus.PENDING)
    notes: Optional[str] = None

class Referral(ReferralBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    patient: "Patient" = Relationship(back_populates="referrals")


