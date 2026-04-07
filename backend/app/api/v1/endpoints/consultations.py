"""
Consultation Module API — Full state machine with in-app payment gate.

Endpoints:
  POST /consultations/book            — Patient books + creates fee invoice
  GET  /consultations/active-chat     — Patient checks access (payment gate)
  POST /consultations/start/{appt_id} — Doctor activates consultation
  GET  /consultations/{id}            — Get full consultation record
  PUT  /consultations/{id}/save-draft — Doctor saves draft progress  
  POST /consultations/{id}/complete   — Doctor completes + locks
  GET  /consultations/history/my      — Patient/Doctor history list
  GET  /consultations/pending-actions — Patient sees pending payments/uploads
"""
import uuid
import re
from typing import Any, List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select

from app.api import deps
from app.models.user import User, UserRole, Doctor, Patient
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.consultation import Consultation, ConsultationStatus
from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus, InvoiceType, InvoiceItemType
from app.models.notification import NotificationType
from app.models.wallet import Wallet
from app.core.websockets import manager
from app.services.notification_service import create_notification

router = APIRouter()


def _gen_invoice_number() -> str:
    return f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


def _gen_meet_link() -> str:
    """Generate a Google Meet link. In production this would use the Google Calendar API.
    For now we generate a reproducible random room code in Meet URL format."""
    code = uuid.uuid4().hex
    # Google Meet room codes are xxx-yyyy-zzz format
    room = f"{code[:3]}-{code[3:7]}-{code[7:10]}"
    return f"https://meet.google.com/{room}"


# ─── PATIENT: Book consultation ──────────────────────────────────────────────

@router.post("/book")
def book_consultation(
    data: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Patient books a consultation for an existing appointment.
    Creates a DRAFT consultation + a PENDING invoice for the consultation fee.
    No access to chat/video until fee is paid.
    """
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Only patients can book consultations")

    patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    appointment_id = data.get("appointment_id")
    if not appointment_id:
        raise HTTPException(status_code=422, detail="appointment_id is required")

    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appointment.patient_id != patient.id:
        raise HTTPException(status_code=403, detail="Not your appointment")

    # Prevent double-booking
    existing = db.exec(
        select(Consultation).where(Consultation.appointment_id == appointment_id)
    ).first()
    if existing:
        return {
            "consultation_id": existing.id,
            "invoice_id": existing.consultation_fee_invoice_id,
            "status": existing.status,
            "meet_link": existing.meet_link,
            "message": "Consultation already exists",
        }

    # Get doctor's fee
    doctor = db.get(Doctor, appointment.doctor_id)
    fee = doctor.consultation_fee if doctor else 0.0

    # Generate Google Meet link
    meet_link = _gen_meet_link()

    # Create DRAFT consultation
    consultation = Consultation(
        appointment_id=appointment_id,
        patient_id=patient.id,
        doctor_id=appointment.doctor_id,
        symptoms=appointment.reason or "Pending",
        diagnosis="Pending",
        status=ConsultationStatus.DRAFT,
        consultation_fee=fee,
        meet_link=meet_link,
    )
    db.add(consultation)
    db.flush()  # get id before committing

    # Create fee invoice
    invoice = Invoice(
        invoice_number=_gen_invoice_number(),
        patient_id=patient.id,
        appointment_id=appointment_id,
        consultation_id=consultation.id,
        amount=fee,
        status=InvoiceStatus.PENDING,
        invoice_type=InvoiceType.CONSULTATION_FEE,
        due_date=datetime.utcnow() + timedelta(hours=24),
    )
    db.add(invoice)
    db.flush()

    # Add line item
    item = InvoiceItem(
        invoice_id=invoice.id,
        description=f"Consultation fee — Dr. {doctor.user.full_name if doctor and doctor.user else 'Doctor'}",
        amount=fee,
        quantity=1,
        item_type=InvoiceItemType.CONSULTATION_FEE,
    )
    db.add(item)

    # Link invoice back to consultation
    consultation.consultation_fee_invoice_id = invoice.id
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    db.refresh(invoice)

    # Notify patient
    create_notification(
        db, current_user.id,
        "Consultation Booked",
        f"Pay ₦{fee:,.0f} to activate your consultation with "
        f"Dr. {doctor.user.full_name if doctor and doctor.user else 'your doctor'}.",
        NotificationType.INVOICE_CREATED,
    )

    return {
        "consultation_id": consultation.id,
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "amount": fee,
        "status": consultation.status,
        "meet_link": meet_link,
        "message": "Consultation created. Please pay the consultation fee to proceed.",
    }


# ─── PATIENT: Check active chat / payment gate ───────────────────────────────

@router.get("/active-chat")
def get_active_chat_session(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get the active chat session for a patient, enforcing payment gating."""
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Not authorized")

    patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
    if not patient:
        return {"active_chat_id": None, "reason": "no_profile"}

    # Most recent consultation
    consultation = db.exec(
        select(Consultation)
        .where(Consultation.patient_id == patient.id)
        .order_by(Consultation.created_at.desc())
    ).first()

    if not consultation:
        return {"active_chat_id": None, "reason": "no_session"}

    if consultation.status == ConsultationStatus.COMPLETED:
        return {
            "active_chat_id": None,
            "last_consultation_id": consultation.id,
            "reason": "completed",
            "detail": "Consultation has been completed.",
        }

    if consultation.status == ConsultationStatus.ACTIVE:
        return {
            "active_chat_id": consultation.id,
            "last_consultation_id": consultation.id,
            "reason": "active",
            "meet_link": consultation.meet_link,
            "patient_name": current_user.full_name,
        }

    # DRAFT — check if fee invoice is paid
    invoice = None
    if consultation.consultation_fee_invoice_id:
        invoice = db.get(Invoice, consultation.consultation_fee_invoice_id)

    if invoice and invoice.status == InvoiceStatus.PAID:
        # Edge case: payment done but status not yet updated — fix it here
        consultation.status = ConsultationStatus.ACTIVE
        db.add(consultation)
        db.commit()
        return {
            "active_chat_id": consultation.id,
            "last_consultation_id": consultation.id,
            "reason": "active",
            "meet_link": consultation.meet_link,
            "patient_name": current_user.full_name,
        }

    return {
        "active_chat_id": None,
        "last_consultation_id": consultation.id,
        "reason": "payment_required",
        "invoice_id": invoice.id if invoice else None,
        "amount": invoice.amount if invoice else consultation.consultation_fee,
        "detail": "Consultation fee payment required to access chat and video.",
    }


# ─── DOCTOR: Start / activate consultation ───────────────────────────────────

@router.post("/start/{appointment_id}")
def start_or_get_consultation(
    appointment_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Doctor starts consultation — finds existing or creates new (ACTIVE immediately for walk-in)."""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can start consultations")

    doctor = db.exec(select(Doctor).where(Doctor.user_id == current_user.id)).first()
    if not doctor:
        raise HTTPException(status_code=403, detail="Doctor profile not found")

    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    existing = db.exec(
        select(Consultation).where(Consultation.appointment_id == appointment_id)
    ).first()

    if existing:
        # Activate if fee is paid or it's a walk-in (offline)
        if existing.status == ConsultationStatus.DRAFT:
            fee_paid = False
            if existing.consultation_fee_invoice_id:
                inv = db.get(Invoice, existing.consultation_fee_invoice_id)
                fee_paid = inv and inv.status == InvoiceStatus.PAID
            if fee_paid or appointment.type == AppointmentType.OFFLINE:
                existing.status = ConsultationStatus.ACTIVE
                existing.updated_at = datetime.utcnow()
                db.add(existing)
                appointment.status = AppointmentStatus.IN_CONSULTATION
                db.add(appointment)
                db.commit()
        return {"consultation_id": existing.id, "is_new": False, "status": existing.status, "meet_link": existing.meet_link}

    # Create new active consultation (walk-in / doctor-initiated)
    meet_link = _gen_meet_link()
    consultation = Consultation(
        appointment_id=appointment_id,
        patient_id=appointment.patient_id,
        doctor_id=doctor.id,
        symptoms=appointment.reason or "Pending",
        diagnosis="Pending",
        status=ConsultationStatus.ACTIVE,
        meet_link=meet_link,
    )
    db.add(consultation)
    appointment.status = AppointmentStatus.IN_CONSULTATION
    db.add(appointment)
    db.commit()
    db.refresh(consultation)

    # Notify patient
    patient_user = db.exec(
        select(User).where(User.id == (
            select(Patient.user_id).where(Patient.id == appointment.patient_id).scalar_subquery()
        ))
    ).first()
    if patient_user:
        create_notification(
            db, patient_user.id,
            "Consultation Started",
            "Your doctor is ready. Join the consultation now.",
            NotificationType.CONSULTATION_ACTIVE,
        )

    return {"consultation_id": consultation.id, "is_new": True, "status": consultation.status, "meet_link": meet_link}


# ─── GET: Full consultation detail ───────────────────────────────────────────

@router.get("/{id}")
def get_consultation(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    from app.models.subjective_data import SubjectiveData
    from app.models.objective_data import ObjectiveData
    from app.models.lab_result import LabResult
    from app.models.prescription import Prescription, PrescriptionItem

    consultation = db.get(Consultation, id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    # Access control
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient or consultation.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == UserRole.DOCTOR:
        doctor = db.exec(select(Doctor).where(Doctor.user_id == current_user.id)).first()
        if not doctor or consultation.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    subjective = db.exec(select(SubjectiveData).where(SubjectiveData.consultation_id == id)).first()
    objective = db.exec(select(ObjectiveData).where(ObjectiveData.consultation_id == id)).first()
    lab_results = db.exec(select(LabResult).where(LabResult.consultation_id == id)).all()
    prescriptions = db.exec(select(Prescription).where(Prescription.consultation_id == id)).all()

    # Gather invoices
    invoices = db.exec(select(Invoice).where(Invoice.consultation_id == id)).all()

    def _s(obj):
        if obj is None:
            return None
        return {k: v for k, v in obj.__dict__.items() if not k.startswith("_")}

    return {
        "consultation": _s(consultation),
        "subjective": _s(subjective),
        "objective": _s(objective),
        "lab_results": [_s(l) for l in lab_results],
        "prescriptions": [_s(p) for p in prescriptions],
        "invoices": [_s(i) for i in invoices],
    }


# ─── DOCTOR: Save draft ───────────────────────────────────────────────────────

@router.put("/{id}/save-draft")
def save_draft(
    id: int,
    data: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Doctor saves draft — updates diagnosis/notes without locking."""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can save drafts")

    consultation = db.get(Consultation, id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Not found")
    if consultation.status == ConsultationStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Consultation is locked (completed)")

    if "symptoms" in data:
        consultation.symptoms = data["symptoms"]
    if "diagnosis" in data:
        consultation.diagnosis = data["diagnosis"]
    if "notes" in data:
        consultation.notes = data["notes"]
    consultation.updated_at = datetime.utcnow()
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    return {"message": "Draft saved", "consultation_id": id, "updated_at": consultation.updated_at}


# ─── DOCTOR: Set / update Meet link ──────────────────────────────────────────

@router.put("/{id}/meet-link")
def update_meet_link(
    id: int,
    data: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Doctor pastes a custom Google Meet URL. Saved to consultation record and
    broadcast to the patient via notification so they can join immediately."""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can set the meeting link")

    consultation = db.get(Consultation, id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    if consultation.status == ConsultationStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Consultation is completed — cannot update link")

    meet_link = data.get("meet_link", "").strip()
    if not meet_link:
        raise HTTPException(status_code=422, detail="meet_link is required")

    # Basic validation — must look like a URL
    if not meet_link.startswith("http"):
        raise HTTPException(status_code=422, detail="meet_link must be a valid URL (http/https)")

    consultation.meet_link = meet_link
    consultation.updated_at = datetime.utcnow()
    db.add(consultation)
    db.commit()
    db.refresh(consultation)

    # Notify the patient that a meeting link is now available
    patient_user = db.exec(
        select(User).where(User.id == (
            select(Patient.user_id).where(Patient.id == consultation.patient_id).scalar_subquery()
        ))
    ).first()
    if patient_user:
        create_notification(
            db, patient_user.id,
            "Meeting Link Ready",
            "Your doctor has set up the meeting link. You can now join the consultation.",
            NotificationType.CONSULTATION_ACTIVE,
        )

    return {
        "message": "Meet link updated",
        "consultation_id": id,
        "meet_link": meet_link,
    }


# ─── DOCTOR: Complete consultation (lock) ────────────────────────────────────

@router.post("/{id}/complete")
def complete_consultation(
    id: int,
    data: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Doctor marks consultation COMPLETED — locks the record permanently."""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can complete consultations")

    consultation = db.get(Consultation, id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Not found")
    if consultation.status == ConsultationStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Already completed")

    # Apply final updates
    if "diagnosis" in data:
        consultation.diagnosis = data["diagnosis"]
    if "notes" in data:
        consultation.notes = data["notes"]
    if "follow_up_date" in data and data["follow_up_date"]:
        consultation.follow_up_date = datetime.fromisoformat(data["follow_up_date"])

    consultation.status = ConsultationStatus.COMPLETED
    consultation.locked_at = datetime.utcnow()
    consultation.updated_at = datetime.utcnow()
    db.add(consultation)

    # Update appointment
    appointment = db.get(Appointment, consultation.appointment_id)
    if appointment:
        appointment.status = AppointmentStatus.COMPLETED
        db.add(appointment)

    db.commit()

    # Notify patient
    patient_user = db.exec(
        select(User).where(User.id == (
            select(Patient.user_id).where(Patient.id == consultation.patient_id).scalar_subquery()
        ))
    ).first()
    if patient_user:
        create_notification(
            db, patient_user.id,
            "Consultation Completed",
            "Your consultation has been completed. You can view your records in the app.",
            NotificationType.CONSULTATION_COMPLETED,
        )

    background_tasks.add_task(
        manager.global_broadcast,
        f"consultation_update:completed:{consultation.patient_id}",
    )

    return {"message": "Consultation completed and locked", "consultation_id": id}


# ─── HISTORY: Both roles ──────────────────────────────────────────────────────

@router.get("/history/my")
def get_my_consultations(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get all consultations for the current patient or doctor."""
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient:
            return []
        return db.exec(
            select(Consultation)
            .where(Consultation.patient_id == patient.id)
            .order_by(Consultation.created_at.desc())
        ).all()

    if current_user.role == UserRole.DOCTOR:
        doctor = db.exec(select(Doctor).where(Doctor.user_id == current_user.id)).first()
        if not doctor:
            return []
        return db.exec(
            select(Consultation)
            .where(Consultation.doctor_id == doctor.id)
            .order_by(Consultation.created_at.desc())
        ).all()

    raise HTTPException(status_code=403, detail="Not authorized")


# ─── PATIENT: Pending actions dashboard ──────────────────────────────────────

@router.get("/pending-actions")
def get_pending_actions(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Patient sees all pending actions: payments + lab result uploads."""
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Not authorized")

    from app.models.lab_result import LabResult

    patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
    if not patient:
        return {"payments": [], "uploads": []}

    # Pending invoices
    pending_invoices = db.exec(
        select(Invoice)
        .where(Invoice.patient_id == patient.id)
        .where(Invoice.status == InvoiceStatus.PENDING)
    ).all()

    # Lab results awaiting patient upload (FREE tests)
    pending_uploads = db.exec(
        select(LabResult)
        .where(LabResult.patient_id == patient.id)
        .where(LabResult.test_type == "FREE")
        .where(LabResult.patient_file_url == None)
        .where(LabResult.status == "requested")
    ).all()

    return {
        "payments": [
            {
                "invoice_id": inv.id,
                "invoice_number": inv.invoice_number,
                "amount": inv.amount,
                "invoice_type": inv.invoice_type,
                "consultation_id": inv.consultation_id,
                "due_date": inv.due_date,
            }
            for inv in pending_invoices
        ],
        "uploads": [
            {
                "lab_result_id": lr.id,
                "test_name": lr.test_name,
                "consultation_id": lr.consultation_id,
                "status": lr.status,
            }
            for lr in pending_uploads
        ],
    }
