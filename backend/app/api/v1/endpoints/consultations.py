from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole, Doctor, Patient
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.consultation import Consultation
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=Consultation)
def create_consultation(
    *,
    db: Session = Depends(deps.get_db),
    consultation_in: Consultation, # Using model as schema for speed
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Start/Save a consultation"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can consult")

    # Verify Appointment Link
    appointment = db.get(Appointment, consultation_in.appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    # Verify Doctor
    doctor = db.exec(select(Doctor).where(Doctor.user_id == current_user.id)).first()
    if not doctor or doctor.id != consultation_in.doctor_id:
         # Auto-fix doctor_id if valid doctor
         if doctor:
             consultation_in.doctor_id = doctor.id
         else:
             raise HTTPException(status_code=403, detail="Doctor profile not found")

    db.add(consultation_in)
    
    # Update appointment status
    appointment.status = AppointmentStatus.COMPLETED # or IN_PROGRESS if we track that
    db.add(appointment)
    
    db.commit()
    db.refresh(consultation_in)
    return consultation_in

@router.get("/{id}", response_model=Consultation)
def get_consultation(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    consultation = db.get(Consultation, id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
        
    # Access control: Doctor, Admin, or the Patient themselves
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient or consultation.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not authorized")
            
    return consultation

@router.get("/appointment/{appointment_id}", response_model=Consultation)
def get_consultation_by_appointment(
    *,
    db: Session = Depends(deps.get_db),
    appointment_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get consultation details for a specific appointment"""
    consultation = db.exec(select(Consultation).where(Consultation.appointment_id == appointment_id)).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not started yet")
    return consultation

@router.get("/history/my", response_model=List[Consultation])
def get_my_consultations(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get all consultations for the current patient"""
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
    if not patient:
         return []
         
    return db.exec(select(Consultation).where(Consultation.patient_id == patient.id)).all()

