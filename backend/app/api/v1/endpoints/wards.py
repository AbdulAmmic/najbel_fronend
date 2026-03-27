from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole
from app.models.ward import Ward, WardStatus

router = APIRouter()

@router.get("/", response_model=List[Ward])
def get_wards(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    return db.exec(select(Ward)).all()

@router.post("/", response_model=Ward)
def create_ward(
    *,
    db: Session = Depends(deps.get_db),
    ward_in: Ward,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
        raise HTTPException(status_code=403, detail="Not authorized")

    existing = db.exec(select(Ward).where(Ward.name == ward_in.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ward with this name already exists")

    db.add(ward_in)
    db.commit()
    db.refresh(ward_in)
    return ward_in

@router.put("/{ward_id}", response_model=Ward)
def update_ward(
    *,
    db: Session = Depends(deps.get_db),
    ward_id: int,
    ward_in: Ward,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR]:
        raise HTTPException(status_code=403, detail="Not authorized")

    ward = db.get(Ward, ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    ward_data = ward_in.dict(exclude_unset=True)
    for key, value in ward_data.items():
        setattr(ward, key, value)

    db.add(ward)
    db.commit()
    db.refresh(ward)
    return ward

@router.delete("/{ward_id}")
def delete_ward(
    *,
    db: Session = Depends(deps.get_db),
    ward_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    ward = db.get(Ward, ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    db.delete(ward)
    db.commit()
    return {"message": "Ward deleted successfully"}
