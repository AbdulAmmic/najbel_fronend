from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from enum import Enum

if TYPE_CHECKING:
    from .user import Patient, User
    from .prescription import PrescriptionItem

class AdministrationStatus(str, Enum):
    ADMINISTERED = "administered"
    MISSED = "missed"
    DELAYED = "delayed"
    REFUSED = "refused"

class MedicationAdministrationBase(SQLModel):
    prescription_item_id: int = Field(foreign_key="prescriptionitem.id")
    patient_id: int = Field(foreign_key="patient.id")
    nurse_id: int = Field(foreign_key="user.id")
    administered_at: datetime = Field(default_factory=datetime.utcnow)
    status: AdministrationStatus = Field(default=AdministrationStatus.ADMINISTERED)
    remarks: Optional[str] = None

class MedicationAdministration(MedicationAdministrationBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    patient: "Patient" = Relationship()
    nurse: "User" = Relationship()
    prescription_item: "PrescriptionItem" = Relationship()
