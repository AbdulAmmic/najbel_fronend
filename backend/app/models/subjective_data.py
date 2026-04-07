"""
Phase 1 — Subjective Data (Patient-reported during consultation)
Each field is stored as a JSON array of structured entries.
Entry shape: {"value": "...", "timestamp": "...", "note": "..."}
"""
from typing import Optional
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import Text
from datetime import datetime


class SubjectiveData(SQLModel, table=True):
    __tablename__ = "subjectivedata"

    id: Optional[int] = Field(default=None, primary_key=True)
    consultation_id: int = Field(foreign_key="consultation.id", unique=True, index=True)

    # Pre-filled from appointment reason; editable by doctor
    chief_complaint: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))

    # JSON arrays — each is a list of {"value": str, "timestamp": str, "note": str}
    past_medical_history: Optional[str] = Field(
        default="[]", sa_column=Column(Text, nullable=True)
    )
    medications_used: Optional[str] = Field(
        default="[]", sa_column=Column(Text, nullable=True)
    )
    drug_allergies: Optional[str] = Field(
        default="[]", sa_column=Column(Text, nullable=True)
    )
    family_history: Optional[str] = Field(
        default="[]", sa_column=Column(Text, nullable=True)
    )
    hospitals_visited: Optional[str] = Field(
        default="[]", sa_column=Column(Text, nullable=True)
    )
    social_habits: Optional[str] = Field(
        default="[]", sa_column=Column(Text, nullable=True)
    )

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
