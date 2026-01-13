from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.models.invoice import InvoiceStatus
from app.models.transaction import TransactionType, PaymentMethod, TransactionStatus

# Invoice Schemas
class InvoiceItemBase(BaseModel):
    description: str
    amount: float

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItem(InvoiceItemBase):
    id: int
    invoice_id: int

    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    patient_id: int
    amount: float
    due_date: datetime

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate]

class InvoiceUpdate(BaseModel):
    status: Optional[InvoiceStatus] = None

class Invoice(InvoiceBase):
    id: int
    invoice_number: str
    status: InvoiceStatus
    created_at: datetime
    items: List[InvoiceItem]

    class Config:
        from_attributes = True

# Wallet Schemas
class WalletBase(BaseModel):
    patient_id: int
    balance: float

class Wallet(WalletBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WalletTopup(BaseModel):
    amount: float
    payment_method: PaymentMethod
    reference: str

# Transaction Schemas
class TransactionBase(BaseModel):
    patient_id: int
    amount: float
    type: TransactionType
    payment_method: PaymentMethod
    reference: str
    invoice_id: Optional[int] = None
    cashier_name: Optional[str] = None

class Transaction(TransactionBase):
    id: int
    status: TransactionStatus
    created_at: datetime

    class Config:
        from_attributes = True
