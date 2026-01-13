from enum import Enum
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

class TransactionType(str, Enum):
    PAYMENT = "payment"
    REFUND = "refund"
    TOPUP = "topup"

class PaymentMethod(str, Enum):
    CASH = "cash"
    TRANSFER = "transfer"
    WALLET = "wallet"
    CARD = "card"

class TransactionStatus(str, Enum):
    COMPLETED = "completed"
    PENDING = "pending"
    FAILED = "failed"

class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_id: Optional[int] = Field(default=None, foreign_key="invoice.id")
    patient_id: int = Field(foreign_key="patient.id")
    amount: float
    type: TransactionType
    payment_method: PaymentMethod
    status: TransactionStatus = Field(default=TransactionStatus.COMPLETED)
    reference: str = Field(unique=True)
    cashier_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    invoice: Optional["Invoice"] = Relationship(back_populates="transactions")
    patient: "Patient" = Relationship(back_populates="transactions")
