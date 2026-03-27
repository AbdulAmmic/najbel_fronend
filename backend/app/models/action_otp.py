from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class ActionOTP(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    otp_code: str
    action_type: str # e.g., "enable_overdraft"
    target_id: str # e.g., patient_id
    expires_at: datetime
