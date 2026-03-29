from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    DOCTOR = "doctor"
    PATIENT = "patient"
    RECEPTIONIST = "receptionist"
    NURSE = "nurse"
    PHARMACIST = "pharmacist"
    ACCOUNTANT = "accountant"
    LAB_TECH = "lab_tech"
    RADIOLOGIST = "radiologist"
    STORE_OFFICER = "store_officer"

class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    full_name: str = Field(index=True)
    role: UserRole = Field(default=UserRole.PATIENT)
    is_active: bool = Field(default=True)
    phone_number: Optional[str] = None
    address: Optional[str] = None
    profile_picture: Optional[str] = None
    hashed_pin: Optional[str] = None

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    @property
    def has_wallet_pin(self) -> bool:
        return self.hashed_pin is not None
    doctor_profile: Optional["Doctor"] = Relationship(back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    patient_profile: Optional["Patient"] = Relationship(back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    attendance_logs: List["AttendanceLog"] = Relationship(back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    shifts: List["Shift"] = Relationship(back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    notifications: List["Notification"] = Relationship(back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    drug_orders: List["DrugOrder"] = Relationship(back_populates="patient", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class Doctor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    specialization: str
    bio: Optional[str] = None
    department: Optional[str] = None
    consultation_fee: float = Field(default=0.0)
    
    user: User = Relationship(back_populates="doctor_profile")
    appointments: List["Appointment"] = Relationship(back_populates="doctor", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    lab_results: List["LabResult"] = Relationship(back_populates="doctor", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class Patient(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    
    # Core Identity
    unique_id: Optional[str] = Field(default=None, index=True, unique=True) # e.g. NJB-2024-001
    
    # Demographics
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    genotype: Optional[str] = None
    allergies: Optional[str] = None # Comma separated or Text
    medical_history_summary: Optional[str] = None
    is_admitted: bool = Field(default=False)
    
    bed: Optional["Bed"] = Relationship(back_populates="patient")

    # Next of Kin
    next_of_kin_name: Optional[str] = None
    next_of_kin_phone: Optional[str] = None
    next_of_kin_relation: Optional[str] = None
    
    # Insurance / HMO
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    
    user: User = Relationship(back_populates="patient_profile")
    appointments: List["Appointment"] = Relationship(back_populates="patient", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    vitals: List["Vitals"] = Relationship(back_populates="patient", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    lab_results: List["LabResult"] = Relationship(back_populates="patient", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    wallet: Optional["Wallet"] = Relationship(back_populates="patient", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    invoices: List["Invoice"] = Relationship(back_populates="patient", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    transactions: List["Transaction"] = Relationship(back_populates="patient", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    scans: List["RadiologyScan"] = Relationship(back_populates="patient", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    prescriptions: List["Prescription"] = Relationship(back_populates="patient", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    medical_records: List["MedicalRecord"] = Relationship(back_populates="patient", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    referrals: List["Referral"] = Relationship(back_populates="patient", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

if TYPE_CHECKING:
    from .attendance import AttendanceLog
    from .appointment import Appointment
    from .vitals import Vitals
    from .lab_result import LabResult
    from .wallet import Wallet
    from .invoice import Invoice
    from .transaction import Transaction
    from .bed import Bed
    from .shift import Shift
    from .radiology import RadiologyScan
    from .notification import Notification
    from .drug_order import DrugOrder
    from .prescription import Prescription
    from .medical_record import MedicalRecord
    from .referral import Referral

class PasswordReset(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    otp_code: str
    expires_at: datetime
