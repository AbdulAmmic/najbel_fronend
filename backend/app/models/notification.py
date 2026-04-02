from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from enum import Enum

class NotificationType(str, Enum):
    APPOINTMENT = "appointment"
    BILLING = "billing"
    MEDICAL = "medical"
    SYSTEM = "system"
    ALARM = "alarm"
    CHAT = "chat"

class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    title: str
    message: str
    type: NotificationType = Field(default=NotificationType.SYSTEM)
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional["User"] = Relationship(back_populates="notifications")

from .user import User
