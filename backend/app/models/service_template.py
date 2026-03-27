from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime

class ServiceTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str
    amount: float
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
