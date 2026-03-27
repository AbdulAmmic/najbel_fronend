from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole
from app.models.room import Room, RoomStatus

router = APIRouter()

@router.get("/", response_model=List[Room])
def get_rooms(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return db.exec(select(Room)).all()

@router.post("/", response_model=Room)
def create_room(
    *,
    db: Session = Depends(deps.get_db),
    room_in: Room,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.add(room_in)
    db.commit()
    db.refresh(room_in)
    return room_in

@router.put("/{room_id}", response_model=Room)
def update_room(
    *,
    db: Session = Depends(deps.get_db),
    room_id: int,
    room_in: Room,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    room = db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    room_data = room_in.dict(exclude_unset=True)
    for key, value in room_data.items():
        setattr(room, key, value)
        
    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.delete("/{room_id}")
def delete_room(
    *,
    db: Session = Depends(deps.get_db),
    room_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    room = db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    db.delete(room)
    db.commit()
    return {"message": "Room deleted successfully"}
