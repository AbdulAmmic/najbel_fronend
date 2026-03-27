from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Bank(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    bank_name: str
    account_name: str
    account_number: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
