from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class DepartmentBase(SQLModel):
    name: str = Field(index=True, unique=True)
    description: Optional[str] = None
    location: Optional[str] = None
    head_of_department_id: Optional[int] = Field(default=None, foreign_key="doctor.id", nullable=True)
    status: str = Field(default="Active") # Active, Inactive

class Department(DepartmentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Future relationships can be added here
    # e.g., doctors: List["Doctor"] = Relationship(back_populates="department_rel") 
