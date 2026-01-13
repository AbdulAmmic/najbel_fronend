from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from enum import Enum

class BedStatus(str, Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"

class BedBase(SQLModel):
    ward_name: str
    bed_number: str
    status: BedStatus = Field(default=BedStatus.AVAILABLE)
    patient_id: Optional[int] = Field(default=None, foreign_key="patient.id", nullable=True)

class Bed(BedBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    patient: Optional["Patient"] = Relationship()

from .user import Patient
