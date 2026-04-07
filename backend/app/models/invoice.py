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
    FAILED = "failed"


class InvoiceType(str, Enum):
    CONSULTATION_FEE = "consultation_fee"
    LAB_TEST = "lab_test"
    MEDICATION = "medication"
    COMPOSITE = "composite"  # Multiple item types


class InvoiceItemType(str, Enum):
    CONSULTATION_FEE = "consultation_fee"
    LAB_TEST = "lab_test"
    MEDICATION = "medication"


class Invoice(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_number: str = Field(index=True, unique=True)
    patient_id: int = Field(foreign_key="patient.id")
    appointment_id: Optional[int] = Field(default=None, foreign_key="appointment.id")
    consultation_id: Optional[int] = Field(default=None, foreign_key="consultation.id")
    amount: float
    status: InvoiceStatus = Field(default=InvoiceStatus.PENDING)
    due_date: datetime
    
    # NEW: invoice type for filtering
    invoice_type: InvoiceType = Field(default=InvoiceType.COMPOSITE)

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
    quantity: int = Field(default=1)
    
    # NEW: item categorisation for reporting
    item_type: InvoiceItemType = Field(default=InvoiceItemType.CONSULTATION_FEE)
    # NEW: reference to the actual entity (lab_result.id, prescriptionitem.id, etc.)
    reference_id: Optional[int] = Field(default=None)
    
    # Relationships
    invoice: "Invoice" = Relationship(back_populates="items")
