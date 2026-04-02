from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from enum import Enum

if TYPE_CHECKING:
    from .user import Patient, User

class NurseActionType(str, Enum):
    VITALS_RECORDED = "vitals_recorded"
    NOTE_ADDED = "note_added"
    MEDICATION_ADMINISTERED = "medication_administered"
    PATIENT_ESCALATED = "patient_escalated"
    HANDOVER = "handover"
    DIRECTIVE_ISSUED = "directive_issued"
    DIRECTIVE_COMPLETED = "directive_completed"

class NurseActivityLogBase(SQLModel):
    nurse_id: int = Field(foreign_key="user.id")
    patient_id: int = Field(foreign_key="patient.id")
    action_type: NurseActionType
    details: Optional[str] = None # JSON string or plain text
    id_reference: Optional[int] = None # Reference to the created record (vitals id, note id, etc)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class NurseActivityLog(NurseActivityLogBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    nurse: "User" = Relationship()
    patient: "Patient" = Relationship()
