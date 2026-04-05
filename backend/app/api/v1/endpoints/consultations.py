from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole, Doctor, Patient
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.consultation import Consultation
from app.models.invoice import Invoice, InvoiceStatus
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

@router.post("/start/{appointment_id}")
def start_or_get_consultation(
    appointment_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Find or create a consultation record for a given appointment (Doctor only). Used for chat."""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can start consultations")

    doctor = db.exec(select(Doctor).where(Doctor.user_id == current_user.id)).first()
    if not doctor:
        raise HTTPException(status_code=403, detail="Doctor profile not found")

    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Return existing if already exists
    existing = db.exec(select(Consultation).where(Consultation.appointment_id == appointment_id)).first()
    if existing:
        return {"consultation_id": existing.id, "is_new": False}

    # Create a skeleton consultation for chat
    consultation = Consultation(
        appointment_id=appointment_id,
        patient_id=appointment.patient_id,
        doctor_id=doctor.id,
        symptoms="Pending",
        diagnosis="Pending",
        notes=None,
        is_admitted=False
    )
    db.add(consultation)

    # Update appointment to in-consultation
    appointment.status = AppointmentStatus.IN_CONSULTATION
    db.add(appointment)
    db.commit()
    db.refresh(consultation)

    return {"consultation_id": consultation.id, "is_new": True}

@router.get("/active-chat")
def get_active_chat_session(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get the active chat session for a patient, enforcing payment gating"""
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
    if not patient:
         return {"active_chat_id": None, "last_consultation_id": None, "reason": "no_profile"}
         
    # Find the most recent consultation
    consultation = db.exec(
        select(Consultation)
        .where(Consultation.patient_id == patient.id)
        .order_by(Consultation.created_at.desc())
    ).first()
    
    if not consultation:
        return {"active_chat_id": None, "last_consultation_id": None, "reason": "no_session"}

    # Logic to determine if "Paid":
    # 1. Check associated Appointment
    is_paid = False
    appointment = db.get(Appointment, consultation.appointment_id)
    
    if appointment:
        # If it's a wallet payment, we assume success IF it reached this stage (debit is mandatory for wallet appts)
        if appointment.type == AppointmentType.ONLINE and appointment.communication_preference == "in_app_chat":
            # For online/chat appts, we consider them paid if they were successfully booked by patient
            is_paid = True
            
    # 2. Check for Invoice (Staff-booked fallback)
    invoice = None
    if not is_paid:
        invoice = db.exec(
            select(Invoice)
            .where(
                (Invoice.consultation_id == consultation.id) |
                (Invoice.appointment_id == consultation.appointment_id)
            )
        ).first()

        if invoice and invoice.status == InvoiceStatus.PAID:
            is_paid = True
    
    if not is_paid and not (appointment and appointment.status in [AppointmentStatus.COMPLETED, AppointmentStatus.IN_CONSULTATION]):
        # If no payment record found and NOT explicitly approved by doctor (already consulting)
        return {
            "active_chat_id": None,
            "last_consultation_id": consultation.id,
            "reason": "payment_required",
            "invoice_id": invoice.id if invoice else None,
            "detail": "Consultation fee payment required to access chat."
        }
        
    return {
        "active_chat_id": consultation.id,
        "last_consultation_id": consultation.id,
        "reason": "active",
        "patient_name": current_user.full_name
    }

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
