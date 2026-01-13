from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    PATIENT = "patient"
    RECEPTIONIST = "receptionist"
    NURSE = "nurse"
    PHARMACIST = "pharmacist"
    ACCOUNTANT = "accountant"
    LAB_TECH = "lab_tech"

class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    full_name: str = Field(index=True)
    role: UserRole = Field(default=UserRole.PATIENT)
    is_active: bool = Field(default=True)
    phone_number: Optional[str] = None
    address: Optional[str] = None

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    doctor_profile: Optional["Doctor"] = Relationship(back_populates="user")
    patient_profile: Optional["Patient"] = Relationship(back_populates="user")
    attendance_logs: List["AttendanceLog"] = Relationship(back_populates="user")

class Doctor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    specialization: str
    bio: Optional[str] = None
    department: Optional[str] = None
    consultation_fee: float = Field(default=0.0)
    
    user: User = Relationship(back_populates="doctor_profile")
    appointments: List["Appointment"] = Relationship(back_populates="doctor")

class Patient(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    
    user: User = Relationship(back_populates="patient_profile")
    appointments: List["Appointment"] = Relationship(back_populates="patient")
    vitals: List["Vitals"] = Relationship(back_populates="patient")
    lab_results: List["LabResult"] = Relationship(back_populates="patient")
    wallet: Optional["Wallet"] = Relationship(back_populates="patient")
    invoices: List["Invoice"] = Relationship(back_populates="patient")
    transactions: List["Transaction"] = Relationship(back_populates="patient")

# Forward references for relationships
from .attendance import AttendanceLog
from .appointment import Appointment
from .vitals import Vitals
from .lab_result import LabResult
from .wallet import Wallet
from .invoice import Invoice
from .transaction import Transaction
