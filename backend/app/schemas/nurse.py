from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.models.nursing_note import NoteCategory
from app.models.medication_administration import AdministrationStatus
from app.models.nurse_activity_log import NurseActionType

# Nursing Note Schemas
class NursingNoteBase(BaseModel):
    patient_id: int
    content: str
    category: NoteCategory = NoteCategory.ROUTINE

class NursingNoteCreate(NursingNoteBase):
    pass

class NursingNote(NursingNoteBase):
    id: int
    nurse_id: int
    nurse_name: Optional[str] = None
    timestamp: datetime
    created_at: datetime

    class Config:
        orm_mode = True

# Medication Administration Schemas
class MedicationAdministrationBase(BaseModel):
    prescription_item_id: int
    patient_id: int
    status: AdministrationStatus = AdministrationStatus.ADMINISTERED
    remarks: Optional[str] = None

class MedicationAdministrationCreate(MedicationAdministrationBase):
    pass

class MedicationAdministration(MedicationAdministrationBase):
    id: int
    nurse_id: int
    nurse_name: Optional[str] = None
    administered_at: datetime
    created_at: datetime

    class Config:
        orm_mode = True

# Nurse Activity Log Schemas
class NurseActivityLogBase(BaseModel):
    patient_id: int
    action_type: NurseActionType
    details: Optional[str] = None
    id_reference: Optional[int] = None

class NurseActivityLogCreate(NurseActivityLogBase):
    pass

class NurseActivityLog(NurseActivityLogBase):
    id: int
    nurse_id: int
    nurse_name: Optional[str] = None
    timestamp: datetime
    created_at: datetime

    class Config:
        orm_mode = True

# Helper schema for Nurse Dashboard Patient List
class NurseDashboardPatient(BaseModel):
    id: int
    full_name: str
    unique_id: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    is_admitted: bool
    ward_name: Optional[str] = None
    bed_number: Optional[str] = None
    last_vitals: Optional[dict] = None
    active_prescriptions_count: int = 0
