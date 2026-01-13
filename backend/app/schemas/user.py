from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    full_name: Optional[str] = None
    role: UserRole = "patient"

class UserCreate(UserBase):
    email: EmailStr
    password: str
    full_name: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: Optional[int] = None

    class Config:
        orm_mode = True

class User(UserInDBBase):
    patient_profile: Optional["PatientInfo"] = None
    doctor_profile: Optional["DoctorInfo"] = None

# For nested responses
class UserInfo(BaseModel):
    full_name: str
    email: str
    class Config:
        orm_mode = True


class DoctorInfo(BaseModel):
    id: int
    specialization: str
    user: UserInfo
    class Config:
        orm_mode = True

class PatientInfo(BaseModel):
    id: int
    user: UserInfo
    blood_group: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    
    class Config:
        orm_mode = True
