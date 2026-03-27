from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime
from enum import Enum

class WardType(str, Enum):
    GENERAL = "general"
    SURGICAL = "surgical"
    MATERNITY = "maternity"
    PEDIATRIC = "pediatric"
    ICU = "icu"
    EMERGENCY = "emergency"
    PSYCHIATRIC = "psychiatric"
    ONCOLOGY = "oncology"
    ORTHOPEDIC = "orthopedic"
    ISOLATION = "isolation"

class WardStatus(str, Enum):
    ACTIVE = "active"
    FULL = "full"
    MAINTENANCE = "maintenance"
    INACTIVE = "inactive"

class WardBase(SQLModel):
    name: str = Field(index=True, unique=True)
    ward_type: WardType = Field(default=WardType.GENERAL)
    department_id: Optional[int] = Field(default=None, foreign_key="department.id", nullable=True)
    floor: Optional[str] = None
    total_beds: int = Field(default=0)
    description: Optional[str] = None
    status: WardStatus = Field(default=WardStatus.ACTIVE)
    nurse_station: Optional[str] = None

class Ward(WardBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
