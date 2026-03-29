from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole
from app.models.bed import Bed, BedStatus
from app.models.user import Patient as PatientModel
from app.core.websockets import manager

router = APIRouter()

@router.get("/", response_model=List[Bed])
def get_beds(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # Any authenticated staff should see beds
    return db.exec(select(Bed)).all()

@router.post("/", response_model=Bed)
def create_bed(
    *,
    db: Session = Depends(deps.get_db),
    bed_in: Bed,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Create new bed (Admin/Doctor)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.add(bed_in)
    db.commit()
    db.refresh(bed_in)
    
    background_tasks.add_task(manager.global_broadcast, f"bed_update: new bed {bed_in.bed_number}")
    
    return bed_in

@router.post("/{bed_id}/admit", response_model=Bed)
def admit_patient(
    *,
    db: Session = Depends(deps.get_db),
    bed_id: int,
    patient_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Admit a patient to a bed"""
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN, "nurse"]: # String check for nurse if enum not updated yet
         raise HTTPException(status_code=403, detail="Not authorized")
         
    bed = db.get(Bed, bed_id)
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    
    if bed.status != BedStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Bed not available")
        
    # Check if patient exists
    patient = db.get(PatientModel, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    bed.patient_id = patient_id
    bed.status = BedStatus.OCCUPIED
    
    # NEW: Update patient status
    patient.is_admitted = True
    db.add(patient)
    
    db.add(bed)
    db.commit()
    db.refresh(bed)
    
    background_tasks.add_task(manager.global_broadcast, f"bed_update: patient admitted to bed {bed.bed_number}")
    
    return bed

@router.post("/{bed_id}/discharge", response_model=Bed)
def discharge_patient(
    *,
    db: Session = Depends(deps.get_db),
    bed_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Discharge patient from bed"""
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN, "nurse"]:
         raise HTTPException(status_code=403, detail="Not authorized")

    bed = db.get(Bed, bed_id)
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
        
    if bed.patient_id:
        patient = db.get(PatientModel, bed.patient_id)
        if patient:
            patient.is_admitted = False
            db.add(patient)

    bed.patient_id = None
    bed.status = BedStatus.AVAILABLE
    db.add(bed)
    db.commit()
    db.refresh(bed)
    
    background_tasks.add_task(manager.global_broadcast, f"bed_update: patient discharged from bed {bed.bed_number}")
    
    return bed

@router.put("/{bed_id}/status", response_model=Bed)
def update_bed_status(
    *,
    db: Session = Depends(deps.get_db),
    bed_id: int,
    status: BedStatus,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Update bed status (e.g. to MAINTENANCE or AVAILABLE)"""
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN, "nurse"]:
         raise HTTPException(status_code=403, detail="Not authorized")

    bed = db.get(Bed, bed_id)
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
        
    # Validation logic can be added here (e.g. can't set occupied if empty)
    bed.status = status
    if status == BedStatus.AVAILABLE and bed.patient_id:
        # Implicit discharge
        patient = db.get(PatientModel, bed.patient_id)
        if patient:
            patient.is_admitted = False
            db.add(patient)
        bed.patient_id = None
        
    db.add(bed)
    db.commit()
    db.refresh(bed)
    
    background_tasks.add_task(manager.global_broadcast, f"bed_update: status changed for bed {bed.bed_number}")
    
    return bed
