from typing import Optional
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import Text
from datetime import datetime
from enum import Enum


class LabTestType(str, Enum):
    PAID = "PAID"
    FREE = "FREE"


class LabTestCatalog(SQLModel, table=True):
    """Lab test catalog with pricing and configurable result columns, managed by admin."""
    __tablename__ = "lab_test_catalog"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, description="Test name, e.g. Full Blood Count")
    category: str = Field(default="General", description="Hematology, Biochemistry, Microbiology, etc.")
    description: Optional[str] = None
    price: float = Field(default=0.0, description="Charge fee in NGN")
    turnaround_hours: Optional[int] = Field(default=24, description="Expected result turnaround in hours")
    sample_type: Optional[str] = Field(default="Blood", description="Blood, Urine, Stool, Swab, etc.")
    # JSON array stored as text: [{"name": "Hemoglobin", "unit": "g/dL", "ref_range": "12–16"}, ...]
    columns: Optional[str] = Field(
        default="[]",
        sa_column=Column(Text, nullable=True),
        description="JSON array of test parameter columns"
    )
    # PAID = patient must pay; FREE = patient uploads result themselves
    test_type: LabTestType = Field(default=LabTestType.PAID, description="PAID or FREE test")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
