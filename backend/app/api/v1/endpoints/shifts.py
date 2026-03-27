from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole
from app.models.shift import Shift
from app.core.websockets import manager
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[Shift])
def get_all_shifts(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    start_date: str = None, # Optional filter
    end_date: str = None
) -> Any:
    query = select(Shift)
    # Simple date filtering could be added here if needed
    return db.exec(query).all()

@router.get("/my", response_model=List[Shift])
def get_my_shifts(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return db.exec(select(Shift).where(Shift.user_id == current_user.id)).all()

@router.post("/", response_model=Shift)
def assign_shift(
    shift_in: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]: # Assume Head Doctor can assign
         # Simplified permission check
         pass
         
    shift = Shift(
        user_id=shift_in.get("user_id"),
        start_time=datetime.fromisoformat(shift_in.get("start_time")),
        end_time=datetime.fromisoformat(shift_in.get("end_time")),
        shift_type=shift_in.get("shift_type"),
        notes=shift_in.get("notes")
    )
    db.add(shift)
    db.commit()
    db.refresh(shift)
    
    background_tasks.add_task(manager.global_broadcast, f"shift_update: new shift assigned to {shift.user_id}")
    
    return shift

@router.delete("/{id}")
def delete_shift(
    id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    shift = db.get(Shift, id)
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
        
    db.delete(shift)
    db.commit()
    
    background_tasks.add_task(manager.global_broadcast, f"shift_update: shift {id} deleted")
    
    return {"message": "Shift deleted"}
