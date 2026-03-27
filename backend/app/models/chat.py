from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime

class ChatMessage(SQLModel, table=True):
    __tablename__ = "chat_messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    consultation_id: int = Field(index=True)
    sender_name: str
    sender_role: str # patient, doctor, ai
    message: str
    audio_url: Optional[str] = Field(default=None)
    image_url: Optional[str] = Field(default=None)
    is_ai: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
