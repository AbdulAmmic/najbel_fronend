from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class GafiapayLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    payload: str = Field(description="The full JSON payload received from Gafiapay")
    status: str = Field(default="received", description="Processing status: received, success, error, unmapped")
    account_received: Optional[str] = Field(default=None, description="The account number extracted from the payload")
    error_message: Optional[str] = Field(default=None, description="Any error details if processing failed")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
