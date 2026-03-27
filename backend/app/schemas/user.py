from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None
    role: UserRole = "patient"

class UserCreate(UserBase):
    email: EmailStr
    password: Optional[str] = None
    full_name: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    profile_picture: Optional[str] = None
    pin: Optional[str] = None
    is_active: Optional[bool] = None

class UserInDBBase(UserBase):
    id: Optional[int] = None
    has_wallet_pin: bool = False

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
    unique_id: Optional[str] = None
    blood_group: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    
    class Config:
        orm_mode = True
