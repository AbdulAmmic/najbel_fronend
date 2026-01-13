from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.api import deps
from app.core import security
from app.models.user import User, Patient, Doctor, UserRole
from app.schemas import UserCreate, User as UserSchema

router = APIRouter()

@router.post("/", response_model=UserSchema)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    user = db.exec(select(User).where(User.email == user_in.email)).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Auto-create profile based on role
    if user.role == UserRole.PATIENT:
        patient_profile = Patient(user_id=user.id)
        db.add(patient_profile)
    elif user.role == UserRole.DOCTOR:
        doctor_profile = Doctor(user_id=user.id, specialization="General") # Default
        db.add(doctor_profile)
    
    db.commit()
    
    return user

@router.get("/me", response_model=UserSchema)
def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return current_user

from app.models.appointment import Appointment
@router.get("/patients/my", response_model=List[Any]) # Return simplified patient list
def get_my_patients(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get patients treated by the current doctor"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    doctor = db.exec(select(Doctor).where(Doctor.user_id == current_user.id)).first()
    if not doctor:
        return []
        
    # Get patients from appointments
    statement = select(Patient).join(Appointment).where(Appointment.doctor_id == doctor.id).distinct()
    patients = db.exec(statement).all()
    
    # Enrich with user info
    result = []
    for p in patients:
        # Assuming Patient model has relationship to User
        # We need to manually construct the response or use a specific schema
        # Let's return a dict aligned with what the frontend expects or similar
        # Frontend expects: id, name, age, gender, etc.
        user_info = p.user # Relationship check needed, usually p.user is available
        if user_info:
            result.append({
                "id": p.id,
                "name": user_info.full_name,
                "email": user_info.email,
                "gender": p.gender,
                # "age": calculated from dob
                "status": "Active", # Mock
                "phone": user_info.phone_number or "N/A"
            })
    return result

