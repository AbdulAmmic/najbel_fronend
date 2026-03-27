from enum import Enum
from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class InvoiceStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    PARTIAL = "partial"

class Invoice(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_number: str = Field(index=True, unique=True)
    patient_id: int = Field(foreign_key="patient.id")
    amount: float
    status: InvoiceStatus = Field(default=InvoiceStatus.PENDING)
    due_date: datetime
    
    payment_method: Optional[str] = None # cash, card, wallet, insurance
    insurance_provider: Optional[str] = None
    policy_number: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    patient: "Patient" = Relationship(back_populates="invoices")
    items: List["InvoiceItem"] = Relationship(back_populates="invoice", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    transactions: List["Transaction"] = Relationship(back_populates="invoice", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class InvoiceItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_id: int = Field(foreign_key="invoice.id")
    description: str
    amount: float
    
    # Relationships
    invoice: "Invoice" = Relationship(back_populates="items")
