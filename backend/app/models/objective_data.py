"""
Phase 2 — Objective Data (Measured during consultation)
BMI is automatically calculated by the backend (never manually entered).
"""
from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime


class ObjectiveData(SQLModel, table=True):
    __tablename__ = "objectivedata"

    id: Optional[int] = Field(default=None, primary_key=True)
    consultation_id: int = Field(foreign_key="consultation.id", unique=True, index=True)

    # Anthropometrics
    height_cm: Optional[float] = Field(default=None, description="Height in centimetres")
    weight_kg: Optional[float] = Field(default=None, description="Weight in kilograms")
    bmi: Optional[float] = Field(
        default=None,
        description="Auto-calculated: weight_kg / (height_m ** 2). Never set manually."
    )

    # Cardiovascular
    blood_pressure_systolic: Optional[int] = Field(default=None, description="mmHg")
    blood_pressure_diastolic: Optional[int] = Field(default=None, description="mmHg")

    # Blood sugar
    fbs: Optional[float] = Field(default=None, description="Fasting Blood Sugar mmol/L")
    rbs: Optional[float] = Field(default=None, description="Random Blood Sugar mmol/L")

    # Full Blood Count — stored as descriptive text or JSON string
    fbc: Optional[str] = Field(default=None, description="Full Blood Count summary")

    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
