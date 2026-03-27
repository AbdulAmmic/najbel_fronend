from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime
from enum import Enum

class RoomStatus(str, Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"
    OUT_OF_SERVICE = "out_OF_service"

class RoomBase(SQLModel):
    room_number: str = Field(index=True, unique=True)
    ward_name: str
    description: Optional[str] = None
    status: RoomStatus = Field(default=RoomStatus.AVAILABLE)
    capacity: int = Field(default=1)

class Room(RoomBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
