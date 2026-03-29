from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

# --- Prescription Item Schemas ---

class PrescriptionItemBase(BaseModel):
    inventory_item_id: Optional[int] = None
    drug_name: str
    dosage: str
    frequency: str
    duration: str
    quantity: int = 1
    unit_price: float = 0.0
    is_internal: bool = False
    status: Optional[str] = "pending"

class PrescriptionItemCreate(PrescriptionItemBase):
    pass

class PrescriptionItem(PrescriptionItemBase):
    id: int
    prescription_id: int

    class Config:
        orm_mode = True

# --- Prescription Schemas ---

class PrescriptionBase(BaseModel):
    patient_id: int
    doctor_id: int
    consultation_id: Optional[int] = None
    invoice_id: Optional[int] = None
    status: Optional[str] = "pending_payment"
    instructions: Optional[str] = None
    clinical_notes: Optional[str] = None

class PrescriptionCreate(PrescriptionBase):
    items: List[PrescriptionItemCreate]

class PrescriptionUpdate(BaseModel):
    status: Optional[str] = None
    instructions: Optional[str] = None
    clinical_notes: Optional[str] = None

class Prescription(PrescriptionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    items: List[PrescriptionItem] = []
    
    # Enhanced display fields
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None

    class Config:
        orm_mode = True
