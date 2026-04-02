from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole, Doctor, Patient
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.consultation import Consultation
from app.core.websockets import manager
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=Consultation)
def create_consultation(
    consultation_in: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Start/Save a consultation"""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can consult")

    # Verify Doctor Profile
    doctor = db.exec(select(Doctor).where(Doctor.user_id == current_user.id)).first()
    if not doctor:
         raise HTTPException(status_code=403, detail="Doctor profile not found")

    # 1. Create Consultation
    consultation = Consultation(
        appointment_id=consultation_in.get("appointment_id"),
        patient_id=consultation_in.get("patient_id"),
        doctor_id=doctor.id,
        symptoms=consultation_in.get("symptoms"),
        diagnosis=consultation_in.get("diagnosis"),
        notes=consultation_in.get("notes"),
        is_admitted=consultation_in.get("is_admitted", False)
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    
    # 2. Update Appointment Status
    appointment = db.get(Appointment, consultation.appointment_id)
    if appointment:
        appointment.status = AppointmentStatus.COMPLETED
        db.add(appointment)
        
    # 3. Handle Referral (Optional)
    if consultation_in.get("referral_needed") and consultation_in.get("referral_specialty"):
        from app.models.referral import Referral
        referral = Referral(
            patient_id=consultation.patient_id,
            doctor_id=consultation.doctor_id,
            consultation_id=consultation.id,
            referred_to_specialty=consultation_in.get("referral_specialty"),
            referred_to_hospital=consultation_in.get("referral_hospital"),
            reason=consultation_in.get("referral_reason"),
            priority=consultation_in.get("referral_priority", "routine")
        )
        db.add(referral)

    db.commit()
    db.refresh(consultation)
    
    background_tasks.add_task(manager.global_broadcast, f"consultation_update: completed for patient {consultation.patient_id}")
    
    return consultation

@router.get("/active-chat-id", response_model=int)
def get_active_chat_id(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get the active chat consultation ID based on Care Team rules"""
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
    if not patient:
         raise HTTPException(status_code=404, detail="Patient profile not found")
         
    # 1. Check for most recent accepted referral
    from app.models.referral import Referral, ReferralStatus
    referral = db.exec(
        select(Referral)
        .where(Referral.patient_id == patient.id)
        .where(Referral.status == ReferralStatus.ACCEPTED)
        .order_by(Referral.created_at.desc())
    ).first()
    
    if referral:
        # Find if a consultation already exists for this specialist-patient pair
        spec_consult = db.exec(
            select(Consultation)
            .where(Consultation.patient_id == patient.id)
            .where(Consultation.doctor_id == referral.to_doctor_id)
            .order_by(Consultation.created_at.desc())
        ).first()
        
        if spec_consult:
            return spec_consult.id
        else:
            # Auto-create a coordination room for the specialist
            new_room = Consultation(
                appointment_id=0, # Placeholder or link to original if needed
                patient_id=patient.id,
                doctor_id=referral.to_doctor_id,
                symptoms="Referral Handover",
                diagnosis="Pending Specialist Review",
                notes="Coordination channel initialized via specialist referral."
            )
            db.add(new_room)
            db.commit()
            db.refresh(new_room)
            return new_room.id

    # 2. Check for latest primary appointment
    latest_app = db.exec(
        select(Appointment)
        .where(Appointment.patient_id == patient.id)
        .order_by(Appointment.created_at.desc())
    ).first()
    
    if latest_app:
        # Find if a consultation already exists
        main_consult = db.exec(
            select(Consultation)
            .where(Consultation.appointment_id == latest_app.id)
            .order_by(Consultation.created_at.asc())
        ).first()
        
        if main_consult:
            return main_consult.id
        else:
            # Check one more time before creating to avoid race conditions
            existing = db.exec(
                select(Consultation)
                .where(Consultation.patient_id == patient.id)
                .where(Consultation.appointment_id == latest_app.id)
                .order_by(Consultation.created_at.asc())
            ).first()
            if existing: return existing.id

            # Auto-create a coordination room for the primary doctor
            new_room = Consultation(
                appointment_id=latest_app.id,
                patient_id=patient.id,
                doctor_id=latest_app.doctor_id,
                symptoms="New Coordination",
                diagnosis="Pending Consultation",
                notes="Coordination channel initialized for primary clinician."
            )
            db.add(new_room)
            db.commit()
            db.refresh(new_room)
            return new_room.id
            
    # 3. Last Fallback (Singleton room)
    return 1

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
