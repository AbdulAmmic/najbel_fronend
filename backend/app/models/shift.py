from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from enum import Enum

class ShiftType(str, Enum):
    MORNING = "Morning"
    AFTERNOON = "Afternoon"
    NIGHT = "Night"
    ON_CALL = "On Call"

class Shift(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    
    start_time: datetime
    end_time: datetime
    shift_type: ShiftType
    
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: "User" = Relationship(back_populates="shifts")

from .user import User
