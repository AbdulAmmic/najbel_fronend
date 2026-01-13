from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class Wallet(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="patient.id", unique=True)
    balance: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    patient: "Patient" = Relationship(back_populates="wallet")
