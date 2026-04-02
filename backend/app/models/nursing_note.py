from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from enum import Enum

if TYPE_CHECKING:
    from .user import Patient, User

class NoteCategory(str, Enum):
    ROUTINE = "routine"
    EMERGENCY = "emergency"
    HANDOVER = "handover"
    OBSERVATION = "observation"
    PROCEDURE = "procedure"

class NursingNoteBase(SQLModel):
    patient_id: int = Field(foreign_key="patient.id")
    nurse_id: int = Field(foreign_key="user.id")
    content: str
    category: NoteCategory = Field(default=NoteCategory.ROUTINE)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class NursingNote(NursingNoteBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    patient: "Patient" = Relationship()
    nurse: "User" = Relationship()
