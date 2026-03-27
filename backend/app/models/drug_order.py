from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from enum import Enum


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    DISPATCHED = "dispatched"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class DrugOrderBase(SQLModel):
    delivery_address: str
    delivery_phone: str
    delivery_note: Optional[str] = None
    total_amount: float = Field(default=0.0)
    payment_method: str = Field(default="wallet")  # wallet, card
    status: str = Field(default=OrderStatus.PENDING)


class DrugOrder(DrugOrderBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    patient: "User" = Relationship(back_populates="drug_orders")

from .user import User


class DrugOrderItemBase(SQLModel):
    quantity: int = Field(default=1)
    unit_price: float = Field(default=0.0)
    item_name: str = Field(default="")


class DrugOrderItem(DrugOrderItemBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="drugorder.id")
    inventory_item_id: int = Field(foreign_key="inventoryitem.id")
