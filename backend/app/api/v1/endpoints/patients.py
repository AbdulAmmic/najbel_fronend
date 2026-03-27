from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, Patient, UserRole

router = APIRouter()

@router.get("/", response_model=List[Any])
def get_all_patients(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Get all patients (Staff access)
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST, "hr"]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    patients = db.exec(select(Patient).offset(skip).limit(limit)).all()
    
    # Enrich with user info
    result = []
    for p in patients:
        user_info = p.user 
        if user_info:
            result.append({
                "id": p.id,
                "user_id": user_info.id,
                "full_name": user_info.full_name,
                "email": user_info.email,
                "unique_id": p.unique_id,
                "gender": p.gender,
                "date_of_birth": p.date_of_birth,
                "phone_number": user_info.phone_number,
                "blood_group": p.blood_group,
                "genotype": p.genotype,
                "insurance_provider": p.insurance_provider,
                "status": "Active" if user_info.is_active else "Inactive"
            })
    return result

@router.get("/{patient_id}", response_model=Any)
def get_patient(
    patient_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get specific patient details
    """
    patient = db.get(Patient, patient_id)
    if not patient:
         raise HTTPException(status_code=404, detail="Patient not found")
         
    # Access control: Staff or the patient themselves
    if current_user.id != patient.user_id and current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST]:
        raise HTTPException(status_code=403, detail="Not authorized")

    user_info = patient.user
    
    return {
        **patient.dict(),
        "full_name": user_info.full_name,
        "email": user_info.email,
        "phone_number": user_info.phone_number,
        "address": user_info.address
    }

@router.put("/{patient_id}", response_model=Any)
def update_patient(
    patient_id: int,
    patient_in: dict, # Using dict for flexibility with patches
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update patient details (Medical info, Next of Kin, etc.)
    """
    patient = db.get(Patient, patient_id)
    if not patient:
         raise HTTPException(status_code=404, detail="Patient not found")

    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE, UserRole.RECEPTIONIST]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Update fields
    for key, value in patient_in.items():
        if hasattr(patient, key):
            setattr(patient, key, value)
            
    # If user-level fields are passed (e.g. phone), update User model too
    user = patient.user
    if "phone_number" in patient_in:
        user.phone_number = patient_in["phone_number"]
    if "address" in patient_in:
        user.address = patient_in["address"]
        
    db.add(patient)
    db.add(user)
    db.commit()
    db.refresh(patient)
    
    return {
        **patient.dict(),
        "full_name": user.full_name,
        "phone_number": user.phone_number
    }
