from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime

from app.api import deps
from app.models.user import User, UserRole
from app.models.attendance import AttendanceLog

router = APIRouter()

@router.post("/check-in", response_model=AttendanceLog)
def check_in(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # Check if already checked in today?
    today = datetime.utcnow().strftime("%Y-%m-%d")
    existing = db.exec(select(AttendanceLog).where(
        AttendanceLog.user_id == current_user.id,
        AttendanceLog.date == today
    )).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already checked in today")

    log = AttendanceLog(
        user_id=current_user.id,
        date=today,
        status="present"
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.post("/check-out", response_model=AttendanceLog)
def check_out(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    today = datetime.utcnow().strftime("%Y-%m-%d")
    existing = db.exec(select(AttendanceLog).where(
        AttendanceLog.user_id == current_user.id,
        AttendanceLog.date == today
    )).first()

    if not existing:
        raise HTTPException(status_code=400, detail="No check-in record found for today")
    
    if existing.check_out_time:
         raise HTTPException(status_code=400, detail="Already checked out")

    existing.check_out_time = datetime.utcnow()
    db.add(existing)
    db.commit()
    db.refresh(existing)
    return existing

@router.get("/my-history", response_model=List[AttendanceLog])
def read_attendance_history(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return db.exec(select(AttendanceLog).where(AttendanceLog.user_id == current_user.id)).all()
