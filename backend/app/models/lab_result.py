from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class LabResultBase(SQLModel):
    patient_id: int = Field(foreign_key="patient.id")
    test_name: str
    result: Optional[str] = Field(default=None, nullable=True)
    units: Optional[str] = Field(default=None, nullable=True)
    reference_range: Optional[str] = Field(default=None, nullable=True)
    result_data: Optional[str] = Field(default=None, nullable=True) # JSON string for multi-parameter results
    notes: Optional[str] = Field(default=None, nullable=True)
    status: str = Field(default="requested") # requested, sample_collected, processing, completed, validated
    priority: str = Field(default="normal") # normal, urgent
    sample_id: Optional[str] = None
    
    # NEW: test type from catalog
    test_type: str = Field(default="PAID")  # PAID or FREE
    # NEW: patient uploaded file path (local disk) for FREE tests
    patient_file_url: Optional[str] = Field(default=None, nullable=True)
    # NEW: payment status for PAID tests
    payment_status: str = Field(default="pending")  # pending, paid, not_required
    
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    collected_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    validated_at: Optional[datetime] = None
    validated_by: Optional[int] = Field(default=None, foreign_key="user.id")
    
    doctor_id: Optional[int] = Field(default=None, foreign_key="doctor.id")
    consultation_id: Optional[int] = Field(default=None, foreign_key="consultation.id")
    invoice_id: Optional[int] = Field(default=None, foreign_key="invoice.id")
    short_id: Optional[str] = Field(default=None, index=True, unique=True)
    doctor_comments: Optional[str] = Field(default=None, nullable=True)

class LabResult(LabResultBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    patient: "Patient" = Relationship(back_populates="lab_results")
    consultation: Optional["Consultation"] = Relationship(back_populates="lab_results")
    invoice: Optional["Invoice"] = Relationship()
    doctor: Optional["Doctor"] = Relationship(back_populates="lab_results")
    validator: Optional["User"] = Relationship()

if TYPE_CHECKING:
    from .user import Patient, User, Doctor
    from .consultation import Consultation
    from .invoice import Invoice

