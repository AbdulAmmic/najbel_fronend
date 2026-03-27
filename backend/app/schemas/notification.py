from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.notification import NotificationType

class NotificationBase(BaseModel):
    title: str
    message: str
    type: NotificationType = NotificationType.SYSTEM

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

class NotificationSchema(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
