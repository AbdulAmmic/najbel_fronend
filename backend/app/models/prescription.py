from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

if TYPE_CHECKING:
    from .user import Patient, Doctor
    from .consultation import Consultation
    from .invoice import Invoice

class PrescriptionBase(SQLModel):
    patient_id: int = Field(foreign_key="patient.id")
    doctor_id: int = Field(foreign_key="doctor.id")
    consultation_id: Optional[int] = Field(default=None, foreign_key="consultation.id")
    invoice_id: Optional[int] = Field(default=None, foreign_key="invoice.id")
    status: str = Field(default="pending_payment") 
    # pending_payment, paid, sent_to_pharmacy, dispensing, completed, partial, failed, cancelled
    
    # Generic notes for the whole prescription
    instructions: Optional[str] = None
    clinical_notes: Optional[str] = None

class Prescription(PrescriptionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    patient: "Patient" = Relationship()
    doctor: "Doctor" = Relationship()
    consultation: Optional["Consultation"] = Relationship(back_populates="prescriptions")
    invoice: Optional["Invoice"] = Relationship()
    items: List["PrescriptionItem"] = Relationship(back_populates="prescription", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class PrescriptionItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    prescription_id: int = Field(foreign_key="prescription.id")
    inventory_item_id: Optional[int] = Field(default=None, foreign_key="inventoryitem.id")
    
    drug_name: str
    dosage: str
    frequency: str
    duration: str
    quantity: int = Field(default=1)
    unit_price: float = Field(default=0.0)
    is_internal: bool = Field(default=False)
    
    status: str = Field(default="pending") # pending, dispensed, out_of_stock, cancelled
    
    # Relationships
    prescription: Optional["Prescription"] = Relationship(back_populates="items")
    inventory_item: Optional["InventoryItem"] = Relationship()

# End of file
