from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole, Patient
from app.models.vitals import Vitals
from app.schemas.vitals import VitalsCreate, Vitals as VitalsSchema

router = APIRouter()

@router.get("/", response_model=List[VitalsSchema])
def get_vitals(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient:
            return []
        vitals = db.exec(select(Vitals).where(Vitals.patient_id == patient.id)).all()
    else:
        vitals = db.exec(select(Vitals)).all()
    return vitals

@router.post("/", response_model=VitalsSchema)
def create_vitals(
    *,
    db: Session = Depends(deps.get_db),
    vitals_in: VitalsCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role not in [UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.NURSE, UserRole.PATIENT]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # If patient, ensure they are recording for themselves
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient:
            raise HTTPException(status_code=400, detail="Patient profile not found")
        
        # If patient_id was not provided, use the current user's patient_id
        if not vitals_in.patient_id:
            vitals_in.patient_id = patient.id
            
        if patient.id != vitals_in.patient_id:
             raise HTTPException(status_code=400, detail="Patients can only record vitals for themselves")
    
    db_obj = Vitals.from_orm(vitals_in)

    # Set verification status
    if current_user.role in [UserRole.DOCTOR, UserRole.NURSE]:
        db_obj.is_verified = True
    elif current_user.role == UserRole.PATIENT:
        db_obj.is_verified = False
    else:
        # Default for receptionist/others? Usually receptionists don't take vitals, 
        # but if they do, maybe we trust them or keep it unverified until doctor sees.
        # Let's say any staff is verified for now, or just doctor/nurse.
        db_obj.is_verified = True

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
