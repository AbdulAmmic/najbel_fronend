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
    if current_user.role not in [UserRole.DOCTOR, UserRole.RECEPTIONIST, UserRole.NURSE]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db_obj = Vitals.from_orm(vitals_in)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
