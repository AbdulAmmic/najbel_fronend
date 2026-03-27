from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole
from app.models.lab_test_catalog import LabTestCatalog
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=List[LabTestCatalog])
def get_all_lab_tests(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    active_only: bool = True,
) -> Any:
    """Get all lab tests in the catalog."""
    query = select(LabTestCatalog)
    if active_only:
        query = query.where(LabTestCatalog.is_active == True)
    return db.exec(query.order_by(LabTestCatalog.category, LabTestCatalog.name)).all()


@router.post("/", response_model=LabTestCatalog)
def create_lab_test(
    lab_in: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Admin: Create a new lab test with pricing."""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.LAB_TECH]:
        raise HTTPException(status_code=403, detail="Not authorized")
    obj = LabTestCatalog(**{k: v for k, v in lab_in.items() if hasattr(LabTestCatalog, k)})
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{id}", response_model=LabTestCatalog)
def update_lab_test(
    id: int,
    lab_in: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Admin: Update a lab test (name, price, status, etc.)."""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.LAB_TECH]:
        raise HTTPException(status_code=403, detail="Not authorized")
    obj = db.get(LabTestCatalog, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Lab test not found")
    for k, v in lab_in.items():
        if hasattr(obj, k) and k not in ("id", "created_at"):
            setattr(obj, k, v)
    obj.updated_at = datetime.utcnow()
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{id}")
def delete_lab_test(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Admin: Soft-delete (deactivate) a lab test."""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    obj = db.get(LabTestCatalog, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    obj.is_active = False
    obj.updated_at = datetime.utcnow()
    db.add(obj)
    db.commit()
    return {"message": "Lab test deactivated"}
