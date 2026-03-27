from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import date, datetime

class InventoryItemBase(SQLModel):
    name: str = Field(index=True)
    category: str = Field(default="General") # e.g., Antibiotic, Analgesic
    batch_number: str = Field(index=True)
    expiry_date: date
    quantity: int = Field(default=0)
    unit_price: float = Field(default=0.0)
    reorder_level: int = Field(default=10) # Low stock alert threshold
    location: Optional[str] = None # e.g., Shelf A1
    supplier: Optional[str] = None
    description: Optional[str] = None

class InventoryItem(InventoryItemBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
