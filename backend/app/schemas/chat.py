from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ChatMessageBase(BaseModel):
    consultation_id: int
    sender_name: str
    sender_role: str
    message: str
    audio_url: Optional[str] = None
    image_url: Optional[str] = None
    is_ai: bool = False
    is_ai_assisted: bool = False

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessage(ChatMessageBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
