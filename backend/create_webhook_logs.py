from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Session
from app.db.session import engine

class GafiapayLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    payload: str = Field(description="The full JSON payload received from Gafiapay")
    status: str = Field(default="received", description="Processing status: received, success, error, unmapped")
    account_received: Optional[str] = Field(default=None, description="The account number extracted from the payload")
    error_message: Optional[str] = Field(default=None, description="Any error details if processing failed")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

def create_log_table():
    print("Creating GafiapayLog table in the live database...")
    SQLModel.metadata.create_all(engine)
    print("GafiapayLog table created successfully!")

if __name__ == "__main__":
    create_log_table()
