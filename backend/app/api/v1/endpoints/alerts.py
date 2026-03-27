from typing import Any, List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole, Doctor
from app.models.vitals import Vitals
from app.models.lab_result import LabResult

router = APIRouter()

@router.get("/", response_model=List[Any])
def get_dashboard_alerts(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get clinical alerts (Abnormal vitals, Critical labs)
    """
    if current_user.role != UserRole.DOCTOR:
        return []
    
    alerts = []
    
    # Check for recent abnormal vitals (last 24h ideally, simplified here)
    # Mock logic: systolic > 140 or temp > 38
    recent_vitals = db.exec(select(Vitals).order_by(Vitals.measured_at.desc()).limit(20)).all()
    for v in recent_vitals:
        patient = v.patient
        patient_name = patient.user.full_name if patient and patient.user else "Unknown"
        
        if v.blood_pressure:
            try:
                sys = int(v.blood_pressure.split('/')[0])
                if sys > 140:
                    alerts.append({
                        "type": "vital",
                        "severity": "high",
                        "title": f"High BP: {v.blood_pressure}",
                        "patient": patient_name,
                        "time": v.measured_at,
                        "id": v.id
                    })
            except:
                pass
                
        if v.temperature and v.temperature > 38.0:
             alerts.append({
                "type": "vital",
                "severity": "medium",
                "title": f"High Fever: {v.temperature}°C",
                "patient": patient_name,
                "time": v.measured_at,
                 "id": v.id
            })

    # Check for completed lab results not yet reviewed (mock status logic)
    # Assuming we add 'is_reviewed' later, for now just show completed
    # labs = db.exec(select(LabResult).where(LabResult.status == "completed").limit(5)).all()
    # for lab in labs:
    #     alerts.append({...})

    return alerts
