from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole
from app.models.prescription import Prescription
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate, Prescription as PrescriptionSchema
from app.core.websockets import manager

router = APIRouter()

@router.get("/", response_model=List[PrescriptionSchema])
def get_prescriptions(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get all prescriptions. Patients see only theirs, doctors see all.
    """
    if current_user.role == UserRole.PATIENT:
        # Need to get patient record for the user
        from app.models.user import Patient
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient:
            return []
        prescriptions = db.exec(select(Prescription).where(Prescription.patient_id == patient.id)).all()
    else:
        prescriptions = db.exec(select(Prescription)).all()
    return prescriptions

@router.post("/", response_model=PrescriptionSchema)
async def create_prescription(
    *,
    db: Session = Depends(deps.get_db),
    prescription_in: PrescriptionCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create a new prescription (Doctor only).
    """
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db_obj = Prescription.from_orm(prescription_in)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Broadcast notification
    await manager.broadcast(f"New prescription created for patient ID {db_obj.patient_id}")
    
    return db_obj

@router.get("/{id}", response_model=PrescriptionSchema)
def get_prescription(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get a prescription by ID.
    """
    prescription = db.get(Prescription, id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    if current_user.role == UserRole.PATIENT:
        from app.models.user import Patient
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient or prescription.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
            
    return prescription
