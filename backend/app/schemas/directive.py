from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.models.directive import DirectiveUrgency, DirectiveStatus

class PhysicianDirectiveBase(BaseModel):
    patient_id: int
    instruction: str
    urgency: DirectiveUrgency = DirectiveUrgency.ROUTINE
    doctor_notes: Optional[str] = None
    nurse_id: Optional[int] = None

class PhysicianDirectiveCreate(PhysicianDirectiveBase):
    pass

class PhysicianDirectiveUpdate(BaseModel):
    status: Optional[DirectiveStatus] = None
    nurse_comment: Optional[str] = None

class PhysicianDirectiveSchema(PhysicianDirectiveBase):
    id: int
    doctor_id: int
    status: DirectiveStatus
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    doctor_name: Optional[str] = None
    nurse_name: Optional[str] = None
    
    class ConfigDict:
        from_attributes = True
