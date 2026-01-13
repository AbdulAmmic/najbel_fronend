from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole, Doctor
from app.models.referral import Referral, ReferralStatus
from app.core.websockets import manager

router = APIRouter()

@router.post("/", response_model=Referral)
async def create_referral(
    *,
    db: Session = Depends(deps.get_db),
    referral_in: Referral, # Minimal schema would be better but using Model for speed
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Doctor refers patient to another doctor"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can refer")
    
    # Verify sender is the logged in doctor logic? 
    # For now assume FE sends correct from_doctor_id or we override it:
    
    # Get current doctor profile
    sender_profile = db.exec(select(Doctor).where(Doctor.user_id == current_user.id)).first()
    if not sender_profile:
         raise HTTPException(status_code=400, detail="Doctor profile not found")
         
    referral_in.from_doctor_id = sender_profile.id
    referral_in.status = ReferralStatus.PENDING
    
    db.add(referral_in)
    db.commit()
    db.refresh(referral_in)
    
    # Broadcast notification to the receiving doctor (optimize to target specific user later)
    # Ideally we should send to specific user ID of the to_doctor
    to_doctor = db.get(Doctor, referral_in.to_doctor_id)
    if to_doctor:
        await manager.broadcast(f"REFERRAL:{to_doctor.user_id}:New referral from Dr. {current_user.full_name}")
    
    return referral_in

@router.get("/received", response_model=List[Referral])
def get_received_referrals(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get referrals sent TO the current doctor"""
    doctor = db.exec(select(Doctor).where(Doctor.user_id == current_user.id)).first()
    if not doctor:
        return []
        
    return db.exec(select(Referral).where(Referral.to_doctor_id == doctor.id)).all()

@router.post("/{id}/accept", response_model=Referral)
async def accept_referral(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    referral = db.get(Referral, id)
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
        
    # Check if current user is the target doctor
    doctor = db.exec(select(Doctor).where(Doctor.user_id == current_user.id)).first()
    if not doctor or referral.to_doctor_id != doctor.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    referral.status = ReferralStatus.ACCEPTED
    db.add(referral)
    db.commit()
    db.refresh(referral)
    
    # Notify sender
    # sender_user_id lookup omitted for brevity
    
    return referral

@router.post("/{id}/reject", response_model=Referral)
def reject_referral(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    referral = db.get(Referral, id)
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")

    doctor = db.exec(select(Doctor).where(Doctor.user_id == current_user.id)).first()
    if not doctor or referral.to_doctor_id != doctor.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    referral.status = ReferralStatus.REJECTED
    db.add(referral)
    db.commit()
    db.refresh(referral)
    return referral
