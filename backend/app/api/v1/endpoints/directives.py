from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.api import deps
from app.models.directive import PhysicianDirective, DirectiveStatus
from app.models.user import User, UserRole
from app.schemas.directive import (
    PhysicianDirectiveCreate, 
    PhysicianDirectiveUpdate, 
    PhysicianDirectiveSchema
)
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=PhysicianDirectiveSchema)
def create_directive(
    *,
    db: Session = Depends(deps.get_db),
    directive_in: PhysicianDirectiveCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create a new physician directive for a nurse.
    """
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can issue clinical directives")
    
    db_obj = PhysicianDirective(
        **directive_in.dict(),
        doctor_id=current_user.id,
        status=DirectiveStatus.PENDING
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Audit trail
    from app.models.nurse_activity_log import NurseActivityLog, NurseActionType
    audit = NurseActivityLog(
        nurse_id=current_user.id, # Log the action initiator
        patient_id=directive_in.patient_id,
        action_type=NurseActionType.DIRECTIVE_ISSUED,
        details=f"Physician Directive Issued: {directive_in.instruction}"
    )
    db.add(audit)
    db.commit()
    
    return db_obj

@router.get("/patient/{patient_id}", response_model=List[PhysicianDirectiveSchema])
def get_patient_directives(
    patient_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get all directives for a patient.
    """
    if current_user.role not in [UserRole.NURSE, UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    statement = (
        select(PhysicianDirective, User.full_name)
        .join(User, PhysicianDirective.doctor_id == User.id)
        .where(PhysicianDirective.patient_id == patient_id)
        .order_by(PhysicianDirective.created_at.desc())
    )
    results = db.exec(statement).all()
    
    directives = []
    for directive, doc_name in results:
        d_dict = directive.dict()
        d_dict["doctor_name"] = f"Dr. {doc_name}"
        
        if directive.nurse_id:
            nurse = db.get(User, directive.nurse_id)
            if nurse:
                d_dict["nurse_name"] = nurse.full_name
        
        directives.append(d_dict)
        
    return directives

@router.patch("/{directive_id}", response_model=PhysicianDirectiveSchema)
def update_directive_status(
    directive_id: int,
    directive_in: PhysicianDirectiveUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update status of a directive (Acknowledge/Complete).
    """
    db_obj = db.get(PhysicianDirective, directive_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Directive not found")
        
    if current_user.role != UserRole.NURSE and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only nurses can acknowledge/complete directives")
    
    update_data = directive_in.dict(exclude_unset=True)
    
    if "status" in update_data:
        if update_data["status"] == DirectiveStatus.ACKNOWLEDGED:
            db_obj.acknowledged_at = datetime.utcnow()
            db_obj.nurse_id = current_user.id
        elif update_data["status"] == DirectiveStatus.COMPLETED:
            db_obj.completed_at = datetime.utcnow()
            db_obj.nurse_id = current_user.id
            
    # Audit trail
    from app.models.nurse_activity_log import NurseActivityLog, NurseActionType
    audit = NurseActivityLog(
        nurse_id=current_user.id,
        patient_id=db_obj.patient_id,
        action_type=NurseActionType.DIRECTIVE_COMPLETED,
        details=f"Directive {directive_id} marked as {update_data.get('status', 'updated')}"
    )
    db.add(audit)
    
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
