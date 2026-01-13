from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole, Patient
from app.models.lab_result import LabResult
from app.schemas.lab_result import LabResultCreate, LabResultUpdate, LabResult as LabResultSchema

router = APIRouter()

@router.get("/", response_model=List[LabResultSchema])
def get_lab_results(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient:
            return []
        results = db.exec(select(LabResult).where(LabResult.patient_id == patient.id)).all()
    else:
        results = db.exec(select(LabResult)).all()
    return results

@router.post("/", response_model=LabResultSchema)
def create_lab_result(
    *,
    db: Session = Depends(deps.get_db),
    lab_result_in: LabResultCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN, UserRole.LAB_TECH]: 
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db_obj = LabResult.from_orm(lab_result_in)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{id}", response_model=LabResultSchema)
def update_lab_result(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    lab_result_in: LabResultUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN, UserRole.LAB_TECH]: 
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    lab_result = db.get(LabResult, id)
    if not lab_result:
        raise HTTPException(status_code=404, detail="Lab result not found")
        
    update_data = lab_result_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(lab_result, key, value)
        
    db.add(lab_result)
    db.commit()
    db.refresh(lab_result)
    return lab_result
