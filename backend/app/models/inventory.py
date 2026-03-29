from typing import Optional, Any
from pydantic import ConfigDict
from sqlmodel import SQLModel, Field
from datetime import date, datetime

class InventoryItemBase(SQLModel):
    model_config = ConfigDict(extra='ignore')
    name: str = Field(index=True)
    category: str = Field(default="General") # e.g., Antibiotic, Analgesic
    batch_number: Optional[str] = Field(default=None, index=True)
    expiry_date: Optional[date] = None
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

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(SQLModel):
    model_config = ConfigDict(extra='ignore', arbitrary_types_allowed=True)
    name: Optional[str] = None
    category: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None
    quantity: Optional[int] = None
    unit_price: Optional[float] = None
    reorder_level: Optional[int] = None
    location: Optional[str] = None
    supplier: Optional[str] = None
    description: Optional[str] = None
