from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole, Patient
from app.models.medical_record import MedicalRecord
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordUpdate, MedicalRecord as MedicalRecordSchema
from app.core.websockets import manager

router = APIRouter()

@router.get("/", response_model=List[MedicalRecordSchema])
def get_medical_records(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get all medical records. Patients see only theirs, doctors see all.
    """
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient:
            return []
        records = db.exec(select(MedicalRecord).where(MedicalRecord.patient_id == patient.id)).all()
    elif current_user.role in [UserRole.DOCTOR, UserRole.ADMIN]:
        records = db.exec(select(MedicalRecord)).all()
    else:
        # Nurse/Receptionist/etc might need specific access, but for now restrict default "ALL" view
        records = []
    return records

@router.post("/", response_model=MedicalRecordSchema)
async def create_medical_record(
    *,
    db: Session = Depends(deps.get_db),
    record_in: MedicalRecordCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create a new medical record (Doctor only).
    """
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db_obj = MedicalRecord.from_orm(record_in)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Broadcast notification
    await manager.broadcast(f"New medical record created for patient ID {db_obj.patient_id}")
    
    return db_obj

@router.get("/{id}", response_model=MedicalRecordSchema)
def get_medical_record(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get a medical record by ID.
    """
    record = db.get(MedicalRecord, id)
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient or record.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
            
    return record
