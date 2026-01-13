from typing import Any
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from datetime import datetime, date

from app.api import deps
from app.models.user import User, UserRole, Doctor, Patient
from app.models.appointment import Appointment, AppointmentStatus

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get dashboard statistics for the current user.
    """
    
    # Defaults
    stats = {
        "appointments_today": 0,
        "appointments_delta": 0,
        "active_patients": 0,
        "patients_delta": 0,
        "pending_labs": 0,
        "labs_delta": 0,
        "available_beds": 12, # Hardcoded for now until Beds module
        "beds_delta": 0
    }
    
    today = date.today()
    
    # 1. Appointments Today
    # Filter by doctor if doctor
    query = select(func.count(Appointment.id)).where(func.date(Appointment.appointment_time) == today)
    if current_user.role == UserRole.DOCTOR:
        doctor = db.exec(select(Doctor).where(Doctor.user_id == current_user.id)).first()
        if doctor:
            query = query.where(Appointment.doctor_id == doctor.id)
    
    count_today = db.exec(query).one()
    stats["appointments_today"] = count_today
    
    # 2. Total Patients (Active) - Simplified: Count all patients
    # Ideally should be 'patients assigned to this doctor' or just all patients for now
    patient_count = db.exec(select(func.count(Patient.id))).one()
    stats["active_patients"] = patient_count
    
    return stats
