from typing import Any, List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, Patient, UserRole
from app.schemas import PatientInfo

router = APIRouter()

@router.get("/patients", response_model=List[Any])
def get_patients(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get all patients (for doctors/admin).
    """
    if current_user.role == UserRole.PATIENT:
         # Patient can only see themselves ideally, or return empty
         return []
         
    # Fetch all patients with user details
    patients = db.exec(select(Patient)).all()
    
    # Construct response manually or via schema if complicated
    result = []
    from datetime import date
    
    for p in patients:
        # User might be lazy loaded
        user = db.get(User, p.user_id)
        if user:
            age = 0
            if p.date_of_birth:
                try:
                    dob = date.fromisoformat(p.date_of_birth)
                    today = date.today()
                    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                except ValueError:
                    age = 30 # Default if format is wrong
            
            result.append({
                "id": p.id,
                "name": user.full_name,
                "email": user.email,
                "role": user.role,
                "date_of_birth": p.date_of_birth,
                "blood_group": p.blood_group,
                "age": age or 30,
                "gender": p.gender or "Unknown",
                "phone": user.phone_number or "+234 000 0000",
                "lastVisit": "2024-01-01", # Still mock, but better
                "status": "Active" if user.is_active else "Inactive"
            })
            
    return result
