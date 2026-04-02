from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from enum import Enum

if TYPE_CHECKING:
    from .user import Patient, User

class DirectiveStatus(str, Enum):
    PENDING = "pending"
    ACKNOWLEDGED = "acknowledged"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class DirectiveUrgency(str, Enum):
    ROUTINE = "routine"
    URGENT = "urgent"
    STAT = "stat"

class PhysicianDirectiveBase(SQLModel):
    patient_id: int = Field(foreign_key="patient.id")
    doctor_id: int = Field(foreign_key="user.id")
    nurse_id: Optional[int] = Field(default=None, foreign_key="user.id") # Optional specific assignment
    
    instruction: str
    urgency: DirectiveUrgency = Field(default=DirectiveUrgency.ROUTINE)
    status: DirectiveStatus = Field(default=DirectiveStatus.PENDING)
    
    doctor_notes: Optional[str] = None
    nurse_comment: Optional[str] = None
    
    acknowledged_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PhysicianDirective(PhysicianDirectiveBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    patient: "Patient" = Relationship()
    doctor: "User" = Relationship(sa_relationship_kwargs={"primaryjoin": "PhysicianDirective.doctor_id == User.id"})
    nurse: Optional["User"] = Relationship(sa_relationship_kwargs={"primaryjoin": "PhysicianDirective.nurse_id == User.id"})
