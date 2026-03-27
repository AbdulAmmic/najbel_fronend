from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class VitalsBase(BaseModel):
    patient_id: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    blood_pressure: Optional[str] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    oxygen_saturation: Optional[int] = None

class VitalsCreate(VitalsBase):
    pass

class Vitals(VitalsBase):
    id: int
    recorded_at: datetime
    is_verified: bool

    class Config:
        orm_mode = True
