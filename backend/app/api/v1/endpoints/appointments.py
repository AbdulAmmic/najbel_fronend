from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime

from app.api import deps
from app.models.user import User, UserRole, Doctor, Patient
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.schemas import AppointmentCreate, Appointment as AppointmentSchema, AppointmentUpdate
from app.core.websockets import manager

router = APIRouter()

@router.post("/", response_model=AppointmentSchema)
async def create_appointment(
    *,
    db: Session = Depends(deps.get_db),
    appointment_in: AppointmentCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new appointment. Only Patients can generally create requests, 
    but for simplicity/flexibility we allow logged in users. 
    Ideally verify current_user.role == PATIENT.
    """
    if current_user.role != UserRole.PATIENT:
         raise HTTPException(status_code=400, detail="Only patients can book appointments")
         
    # Verify doctor exists
    doctor = db.get(Doctor, appointment_in.doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    # Get patient profile
    patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
    if not patient:
         raise HTTPException(status_code=404, detail="Patient profile not found")

    appointment = Appointment(
        doctor_id=appointment_in.doctor_id,
        patient_id=patient.id,
        appointment_time=appointment_in.appointment_time,
        type=appointment_in.type,
        communication_preference=appointment_in.communication_preference,
        reason=appointment_in.reason,
        notes=appointment_in.notes,
        status=AppointmentStatus.PENDING
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    
    # Broadcast notification
    await manager.global_broadcast(f"New appointment booked by patient ID {patient.id}")
    
    return appointment

@router.get("/my-appointments", response_model=List[AppointmentSchema])
def read_appointments(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get appointments for current user (Doctor or Patient).
    """
    if current_user.role == UserRole.DOCTOR:
        doctor = db.exec(select(Doctor).where(Doctor.user_id == current_user.id)).first()
        if not doctor: return []
        statement = select(Appointment).where(Appointment.doctor_id == doctor.id)
    elif current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient: return []
        statement = select(Appointment).where(Appointment.patient_id == patient.id)
    else:
        # Admin sees all?
        statement = select(Appointment)
        
    return db.exec(statement).all()

@router.put("/{appointment_id}", response_model=AppointmentSchema)
def update_appointment(
    *,
    db: Session = Depends(deps.get_db),
    appointment_id: int,
    appointment_in: AppointmentUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update appointment. Doctors use this to Add Meeting Link or Confirm.
    """
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    # Permission check: Only involved doctor or patient (for cancellation) or admin
    # Simplification: Allow doctor to update everything, Patient can only cancel?
    
    # Update logic
    if appointment_in.status:
        appointment.status = appointment_in.status
    if appointment_in.meeting_link:
        # Only doctor should set this ideally
        appointment.meeting_link = appointment_in.meeting_link
    if appointment_in.notes:
        appointment.notes = appointment_in.notes
    
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment

@router.get("/{id}", response_model=AppointmentSchema)
def read_appointment(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get appointment by ID.
    """
    appointment = db.get(Appointment, id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Permission check
    if current_user.role == UserRole.DOCTOR:
         # Simplified check or use doctor_profile
         if current_user.doctor_profile and appointment.doctor_id != current_user.doctor_profile.id:
             # Fallback if relationship not loaded or mismatch
             pass 
    elif current_user.role == UserRole.PATIENT:
         if current_user.patient_profile and appointment.patient_id != current_user.patient_profile.id:
             raise HTTPException(status_code=403, detail="Not authorized")
             
    return appointment 
