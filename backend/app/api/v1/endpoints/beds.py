from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole
from app.models.bed import Bed, BedStatus
from app.models.user import Patient as PatientModel # Renamed to avoid name clash if needed, but simple import is fine

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
    bed_in: Bed,  # We can use Bed schema directly for simplicity or create BedCreate
    current_user: User = Depends(deps.get_current_active_superuser),
) -> Any:
    """Create new bed (Admin only)"""
    db.add(bed_in)
    db.commit()
    db.refresh(bed_in)
    return bed_in

@router.post("/{bed_id}/admit", response_model=Bed)
def admit_patient(
    *,
    db: Session = Depends(deps.get_db),
    bed_id: int,
    patient_id: int,
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
    db.add(bed)
    db.commit()
    db.refresh(bed)
    return bed

@router.post("/{bed_id}/discharge", response_model=Bed)
def discharge_patient(
    *,
    db: Session = Depends(deps.get_db),
    bed_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Discharge patient from bed"""
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN, "nurse"]:
         raise HTTPException(status_code=403, detail="Not authorized")

    bed = db.get(Bed, bed_id)
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
        
    bed.patient_id = None
    bed.status = BedStatus.AVAILABLE
    db.add(bed)
    db.commit()
    db.refresh(bed)
    return bed
