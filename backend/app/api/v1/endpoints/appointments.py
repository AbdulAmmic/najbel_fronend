from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from datetime import datetime

from app.api import deps
from app.models.user import User, UserRole, Doctor, Patient
from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.schemas import AppointmentCreate, Appointment as AppointmentSchema, AppointmentUpdate
from app.core.websockets import manager
from app.core.email import send_email_background, generate_appointment_email, generate_wallet_alert_email
from app.models.wallet import Wallet
from app.models.invoice import Invoice, InvoiceStatus, InvoiceItem
from app.models.transaction import Transaction, TransactionType, TransactionStatus, PaymentMethod
from app.models.notification import Notification, NotificationType
from pydantic import BaseModel
import traceback
from app.core import security

class RescheduleRequest(BaseModel):
    new_time: datetime
    note: str

class CancelRequest(BaseModel):
    note: str

router = APIRouter()

@router.post("", response_model=AppointmentSchema)
async def create_appointment(
    *,
    db: Session = Depends(deps.get_db),
    appointment_in: AppointmentCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new appointment. 
    - Patients can book for themselves.
    - Receptionists/Admins can book for any patient (must provide patient_id).
    """
    patient_id = None
    
    if current_user.role == UserRole.PATIENT:
        # Patient booking for self
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient:
             raise HTTPException(status_code=404, detail="Patient profile not found")
        patient_id = patient.id
    elif current_user.role in [UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.NURSE]:
        # Staff booking for a patient
        if not appointment_in.patient_id:
             raise HTTPException(status_code=400, detail="patient_id is required when booking as staff")
        patient_id = appointment_in.patient_id
    else:
         raise HTTPException(status_code=403, detail="Not authorized to book appointments")
         
    # Verify doctor exists
    doctor = db.get(Doctor, appointment_in.doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    fee = doctor.consultation_fee if doctor.consultation_fee and doctor.consultation_fee > 0 else 20000.0
    
    # Financial Logic
    if current_user.role == UserRole.PATIENT:
        if not appointment_in.wallet_pin:
             raise HTTPException(status_code=400, detail="Wallet PIN is required to book an appointment")
             
        if not current_user.hashed_pin or not security.verify_password(appointment_in.wallet_pin, current_user.hashed_pin):
             raise HTTPException(status_code=400, detail="Invalid Wallet PIN")
             
        wallet = db.exec(select(Wallet).where(Wallet.patient_id == patient_id)).first()
        print(f"DIAGNOSTIC APPT: Patient={patient_id}, Wallet={wallet}, Fee={fee}")
        if wallet: print(f"DIAGNOSTIC APPT BAL: {wallet.balance} < {fee} == {wallet.balance < fee}")
        if not wallet or (wallet.balance < fee and not wallet.allow_overdraft):
             raise HTTPException(status_code=400, detail=f"Insufficient wallet balance. Have: {wallet.balance if wallet else '0'}, Need: {fee}")
             
        # Deduct wallet
        wallet.balance -= fee
        wallet.updated_at = datetime.utcnow()
        db.add(wallet)
        
        # Record transaction
        txn = Transaction(
            patient_id=patient_id,
            amount=fee,
            type=TransactionType.PAYMENT,
            payment_method=PaymentMethod.WALLET,
            status=TransactionStatus.COMPLETED,
            reference=f"TXN-APT-{int(datetime.utcnow().timestamp())}",
            cashier_name="System"
        )
        db.add(txn)
        
        # E-mail notification for debit
        if current_user.email:
            email_html = generate_wallet_alert_email(current_user.full_name, "debit", fee, wallet.balance, description="Appointment Consultation Fee")
            try:
                send_email_background(current_user.email, "Najbel Clinic Wallet Debit", email_html)
            except Exception as e:
                print("Failed to dispatch debit email", traceback.format_exc())
        initial_status = AppointmentStatus.PENDING

    else:
        # Admin/Staff booking
        initial_status = AppointmentStatus.PENDING

    appointment = Appointment(
        doctor_id=appointment_in.doctor_id,
        patient_id=patient_id,
        appointment_time=appointment_in.appointment_time,
        type=appointment_in.type,
        communication_preference=appointment_in.communication_preference,
        reason=appointment_in.reason,
        notes=appointment_in.notes,
        status=initial_status
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    
    # Generate Invoice for Admin bookings
    if current_user.role != UserRole.PATIENT:
        import uuid
        invoice = Invoice(
            invoice_number=f"INV-{uuid.uuid4().hex[:8].upper()}",
            patient_id=patient_id,
            amount=fee,
            status=InvoiceStatus.PENDING,
            due_date=datetime.utcnow()
        )
        db.add(invoice)
        db.commit()
        db.refresh(invoice)
        
        item = InvoiceItem(
            invoice_id=invoice.id,
            description="Consultation Fee",
            amount=fee
        )
        db.add(item)
        db.commit()

    # Generate meeting link for online appointments
    if appointment.type == AppointmentType.ONLINE:
        import uuid
        room_name = f"najbel-clinic-{appointment.id}-{uuid.uuid4().hex[:8]}"
        appointment.meeting_link = f"https://meet.jit.si/{room_name}"
        db.add(appointment)
        db.commit()
        db.refresh(appointment)
    
    # Eager load for return
    statement = select(Appointment).where(Appointment.id == appointment.id).options(selectinload(Appointment.patient))
    appointment = db.exec(statement).first()
    
    # Broadcast notification
    await manager.global_broadcast(f"New appointment booked for patient ID {patient_id}")
    
    return appointment

@router.get("/my-appointments", response_model=List[AppointmentSchema])
def read_appointments(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get appointments for current user (Doctor or Patient).
    """
    statement = select(Appointment).options(
        selectinload(Appointment.patient).selectinload(Patient.user), 
        selectinload(Appointment.doctor).selectinload(Doctor.user)
    )

    if current_user.role == UserRole.DOCTOR:
        doctor = db.exec(select(Doctor).where(Doctor.user_id == current_user.id)).first()
        if not doctor: return []
        statement = statement.where(Appointment.doctor_id == doctor.id)
    elif current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient: return []
        statement = statement.where(Appointment.patient_id == patient.id)
    else:
        # Admin sees all?
        pass # statement is already select all
        
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
    Update appointment. 
    Strict RBAC for status transitions:
    - Nurse: Can set READY_FOR_DOCTOR (Vitals taken)
    - Doctor: Can set IN_CONSULTATION, COMPLETED
    - Receptionist/Admin: CHECKED_IN, CONFIRMED
    - Patient: CANCELLED only
    """
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    # Status Transition Logic
    if appointment_in.status:
        new_status = appointment_in.status
        allow = False
        
        if current_user.role == UserRole.NURSE:
            if new_status == AppointmentStatus.READY_FOR_DOCTOR:
                allow = True
        elif current_user.role == UserRole.DOCTOR:
             # Doctors manage the consultation phase
             if new_status in [AppointmentStatus.IN_CONSULTATION, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.CONFIRMED]:
                 allow = True
        elif current_user.role in [UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
             # Front desk manages queue and booking
             allow = True 
        elif current_user.role == UserRole.PATIENT:
             # Patient can only cancel
             if new_status == AppointmentStatus.CANCELLED:
                 appointment.status = new_status # Direct update
                 allow = True
        
        if not allow and appointment.status != new_status:
             raise HTTPException(
                 status_code=403, 
                 detail=f"Role {current_user.role} cannot set status to {new_status}"
            )
        
        appointment.status = new_status

    # Other updates (Notes, Link)
    if appointment_in.meeting_link:
        # Only doctor or admin should set this generally
        if current_user.role in [UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECEPTIONIST]:
            appointment.meeting_link = appointment_in.meeting_link
            
    if appointment_in.notes:
        # Notes can be appended by Nurse or Doctor
        if current_user.role in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
             appointment.notes = appointment_in.notes
    
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    
    # Reload with relationships
    statement = select(Appointment).where(Appointment.id == appointment_id).options(
        selectinload(Appointment.patient).selectinload(Patient.user),
        selectinload(Appointment.doctor).selectinload(Doctor.user)
    )
    return db.exec(statement).first()

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
    statement = select(Appointment).where(Appointment.id == id).options(
        selectinload(Appointment.patient).selectinload(Patient.user),
        selectinload(Appointment.doctor).selectinload(Doctor.user)
    )
    appointment = db.exec(statement).first()

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

@router.post("/{appointment_id}/reschedule")
def reschedule_appointment(
    *,
    db: Session = Depends(deps.get_db),
    appointment_id: int,
    req: RescheduleRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECEPTIONIST]:
        raise HTTPException(status_code=403, detail="Not authorized to reschedule")
        
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    appointment.appointment_time = req.new_time
    appointment.status = AppointmentStatus.RESCHEDULED
    appointment.reschedule_note = req.note
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    
    # In-app + Email notification to patient
    patient_record = db.get(Patient, appointment.patient_id)
    doctor_record = db.get(Doctor, appointment.doctor_id)
    
    if patient_record and doctor_record:
        p_user = db.get(User, patient_record.user_id)
        d_user = db.get(User, doctor_record.user_id)
        
        if p_user:
            # In-app notification
            dt_str = req.new_time.strftime("%I:%M %p on %B %d, %Y")
            notif = Notification(
                user_id=p_user.id,
                title="Appointment Rescheduled",
                message=f"Dr. {d_user.full_name if d_user else 'Your doctor'} has rescheduled your appointment to {dt_str}. Note: {req.note}. Please review and accept.",
                type=NotificationType.APPOINTMENT
            )
            db.add(notif)
            db.commit()
            
            # Email notification
            if p_user.email and d_user:
                try:
                    email_html = generate_appointment_email(
                        patient_name=p_user.full_name,
                        doctor_name=d_user.full_name,
                        action="reschedule",
                        note=req.note,
                        doctor_phone=d_user.phone_number or "Not Provided",
                        new_date=dt_str
                    )
                    send_email_background(p_user.email, "Appointment Rescheduled - Action Required", email_html)
                except Exception as e:
                    print("Failed to dispatch reschedule email", traceback.format_exc())
                
    return {"message": "Appointment rescheduled successfully.", "status": appointment.status}


@router.post("/{appointment_id}/cancel")
def cancel_appointment(
    *,
    db: Session = Depends(deps.get_db),
    appointment_id: int,
    req: CancelRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # Patient can cancel their own, Doctor/Admin can cancel any
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if current_user.role == UserRole.PATIENT:
         if current_user.patient_profile and appointment.patient_id != current_user.patient_profile.id:
             raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECEPTIONIST]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    appointment.status = AppointmentStatus.CANCELLED
    db.add(appointment)
    db.commit()
    
    # In-app + Email notification
    patient_record = db.get(Patient, appointment.patient_id)
    doctor_record = db.get(Doctor, appointment.doctor_id)
    
    if patient_record and doctor_record:
        p_user = db.get(User, patient_record.user_id)
        d_user = db.get(User, doctor_record.user_id)
        
        if p_user:
            # In-app notification
            notif = Notification(
                user_id=p_user.id,
                title="Appointment Cancelled",
                message=f"Your appointment with Dr. {d_user.full_name if d_user else 'your doctor'} has been cancelled. Reason: {req.note}",
                type=NotificationType.APPOINTMENT
            )
            db.add(notif)
            db.commit()
            
            # Email notification
            if p_user.email and d_user:
                try:
                    email_html = generate_appointment_email(
                        patient_name=p_user.full_name,
                        doctor_name=d_user.full_name,
                        action="cancel",
                        note=req.note,
                        doctor_phone=d_user.phone_number or "Not Provided"
                    )
                    send_email_background(p_user.email, "Appointment Cancelled", email_html)
                except Exception as e:
                     print("Failed to dispatch cancel email", e)

    return {"message": "Appointment cancelled successfully.", "status": appointment.status}

@router.post("/{appointment_id}/confirm")
def confirm_appointment(
    *,
    db: Session = Depends(deps.get_db),
    appointment_id: int,
    req: CancelRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # Doctor/Admin/Staff can confirm
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECEPTIONIST]:
        raise HTTPException(status_code=403, detail="Not authorized to confirm appointments")
        
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
         
    appointment.status = AppointmentStatus.CONFIRMED
    db.add(appointment)
    db.commit()
    
    # In-app + Email notification
    patient_record = db.get(Patient, appointment.patient_id)
    doctor_record = db.get(Doctor, appointment.doctor_id)
    
    if patient_record and doctor_record:
        p_user = db.get(User, patient_record.user_id)
        d_user = db.get(User, doctor_record.user_id)
        
        if p_user:
            # In-app notification
            notif = Notification(
                user_id=p_user.id,
                title="Appointment Confirmed",
                message=f"Your appointment with Dr. {d_user.full_name if d_user else 'your doctor'} has been confirmed.",
                type=NotificationType.APPOINTMENT
            )
            db.add(notif)
            db.commit()
            
            # Email notification
            if p_user.email and d_user:
                try:
                    email_html = generate_appointment_email(
                        patient_name=p_user.full_name,
                        doctor_name=d_user.full_name,
                        action="confirm",
                        note=req.note,
                        doctor_phone=d_user.phone_number or "Not Provided"
                    )
                    send_email_background(p_user.email, "Appointment Confirmed", email_html)
                except Exception as e:
                    print("Failed to dispatch confirm email", e)
                
    return {"message": "Appointment confirmed successfully.", "status": appointment.status}


@router.post("/{appointment_id}/accept-reschedule")
def accept_reschedule(
    *,
    db: Session = Depends(deps.get_db),
    appointment_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Patient accepts a rescheduled appointment.
    Transitions from 'rescheduled' -> 'confirmed'.
    """
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Only patients can accept rescheduled appointments")
    
    appointment = db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Verify this patient owns the appointment
    patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
    if not patient or appointment.patient_id != patient.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if appointment.status != AppointmentStatus.RESCHEDULED:
        raise HTTPException(status_code=400, detail="Appointment is not in rescheduled state")
    
    appointment.status = AppointmentStatus.CONFIRMED
    appointment.reschedule_note = None  # Clear the note after acceptance
    db.add(appointment)
    db.commit()
    
    # Notify the doctor that patient accepted
    doctor_record = db.get(Doctor, appointment.doctor_id)
    if doctor_record:
        d_user = db.get(User, doctor_record.user_id)
        if d_user:
            notif = Notification(
                user_id=d_user.id,
                title="Reschedule Accepted",
                message=f"{current_user.full_name} has accepted the rescheduled appointment.",
                type=NotificationType.APPOINTMENT
            )
            db.add(notif)
            db.commit()
    
    return {"message": "Reschedule accepted. Appointment confirmed.", "status": appointment.status}
