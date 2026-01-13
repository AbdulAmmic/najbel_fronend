from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class AttendanceLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    check_in_time: datetime = Field(default_factory=datetime.utcnow)
    check_out_time: Optional[datetime] = None
    date: str = Field(index=True) # YYYY-MM-DD for easy querying
    status: str = Field(default="present") # present, late, absent, etc.

    user: "User" = Relationship(back_populates="attendance_logs")

from .user import User
