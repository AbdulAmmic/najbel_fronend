from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole
from app.models.department import Department

router = APIRouter()

@router.get("/", response_model=List[Department])
def get_departments(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get all departments
    """
    return db.exec(select(Department)).all()

@router.post("/", response_model=Department)
def create_department(
    *,
    db: Session = Depends(deps.get_db),
    dept_in: Department,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create a new department (Admin/Doctor/HR)
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, "hr"]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    # Check uniqueness
    existing = db.exec(select(Department).where(Department.name == dept_in.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name already exists")
        
    db.add(dept_in)
    db.commit()
    db.refresh(dept_in)
    return dept_in

@router.put("/{dept_id}", response_model=Department)
def update_department(
    *,
    db: Session = Depends(deps.get_db),
    dept_id: int,
    dept_in: Department,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a department
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, "hr"]:
         raise HTTPException(status_code=403, detail="Not authorized")

    dept = db.get(Department, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    dept_data = dept_in.dict(exclude_unset=True)
    for key, value in dept_data.items():
        setattr(dept, key, value)
        
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@router.delete("/{dept_id}", response_model=Department)
def delete_department(
    *,
    db: Session = Depends(deps.get_db),
    dept_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Deactivate a department (Soft delete preferred usually, but simple delete here if no constraints)
    Or just set status to Inactive
    """
    if current_user.role != UserRole.ADMIN:
         raise HTTPException(status_code=403, detail="Not authorized")

    dept = db.get(Department, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Soft delete approach
    dept.status = "Inactive"
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept
