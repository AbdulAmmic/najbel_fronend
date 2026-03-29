from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.api import deps
from app.core import security
from app.models.user import User, Patient, Doctor, UserRole
from app.schemas import UserCreate, User as UserSchema, UserUpdate
from app.core.email import send_email_background, generate_welcome_email
import secrets
import string

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
    
    # Handle password generation
    plain_password = user_in.password
    if not plain_password:
        alphabet = string.ascii_letters + string.digits
        plain_password = ''.join(secrets.choice(alphabet) for i in range(10))

    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(plain_password),
        full_name=user_in.full_name,
        role=user_in.role,
        phone_number=user_in.phone_number,
        address=user_in.address
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Send Welcome Email
    email_html = generate_welcome_email(
        full_name=user.full_name,
        email=user.email,
        password=plain_password,
        role=user.role
    )
    send_email_background(user.email, "Welcome to Najbel Clinic - Your Credentials", email_html)

    # Auto-create profile based on role
    if user.role == UserRole.PATIENT:
        # Generate Unique ID
        import datetime
        year = datetime.datetime.now().year
        count = db.exec(select(Patient)).all()
        unique_id = f"NJB-{year}-{len(count) + 1:04d}"

        patient_profile = Patient(
            user_id=user.id,
            unique_id=unique_id,
            date_of_birth=user_in.date_of_birth,
            gender=user_in.gender,
            blood_group=user_in.blood_group,
            next_of_kin_name=user_in.emergency_contact
        )
        db.add(patient_profile)
    elif user.role == UserRole.DOCTOR:
        doctor_profile = Doctor(user_id=user.id, specialization="General") # Default
        db.add(doctor_profile)
    
    db.commit()
    
    return user

@router.get("/", response_model=List[UserSchema])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve users.
    """
    users = db.exec(select(User).offset(skip).limit(limit)).all()
    return users

@router.get("/me", response_model=UserSchema)
def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return current_user

@router.put("/me", response_model=UserSchema)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update own user.
    """
    if user_in.password:
        current_user.hashed_password = security.get_password_hash(user_in.password)
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    if user_in.email is not None:
        current_user.email = user_in.email
    if user_in.profile_picture is not None:
        current_user.profile_picture = user_in.profile_picture
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

from pydantic import BaseModel

class PinUpdate(BaseModel):
    pin: str

@router.put("/me/pin")
def update_user_pin(
    *,
    db: Session = Depends(deps.get_db),
    pin_data: PinUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update/Set transaction PIN.
    """
    pin = pin_data.pin
    if not pin.isdigit() or len(pin) != 4:
        raise HTTPException(status_code=400, detail="PIN must be 4 digits")
        
    current_user.hashed_pin = security.get_password_hash(pin) # Reuse password hash for simplicity
    db.add(current_user)
    db.commit()
    return {"message": "PIN updated successfully"}

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
                "phone": user_info.phone_number or "N/A",
                "is_admitted": p.is_admitted,
                "ward_name": p.bed.ward_name if p.is_admitted and p.bed else None,
                "bed_number": p.bed.bed_number if p.is_admitted and p.bed else None,
                "room_number": p.bed.room_number if p.is_admitted and p.bed else None,
            })
    return result


@router.get("/doctors", response_model=List[Any])
def get_doctors(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get all doctors with their specialization.
    """
    statement = select(Doctor, User).join(User).where(User.role == UserRole.DOCTOR)
    results = db.exec(statement).all()
    
    doctors_list = []
    for doctor, user in results:
        doctors_list.append({
            "id": doctor.id,
            "name": f"Dr. {user.full_name}",
            "specialty": doctor.specialization or "General",
            "email": user.email
        })
        
    return doctors_list

@router.get("/{user_id}", response_model=UserSchema)
def read_user_by_id(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get a specific user by id.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserSchema)
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a user.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_in.password:
        user.hashed_password = security.get_password_hash(user_in.password)
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.email is not None:
        user.email = user_in.email
    if user_in.profile_picture is not None:
        user.profile_picture = user_in.profile_picture
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete a user.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

