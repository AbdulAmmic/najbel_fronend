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
    is_ai_assisted: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship (optional but good for mapper)
    # Note: consultation_id might be a Patient ID in the Unified Chat Model
    # so we keep this relationship loose or purely for the mapper's registry.
