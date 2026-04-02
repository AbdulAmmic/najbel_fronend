from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func, or_
from app.api import deps
from app.models import (
    User, UserRole, Patient, Vitals, Prescription, PrescriptionItem,
    NursingNote, MedicationAdministration, NurseActivityLog, 
    NurseActionType, Bed, Ward
)
from app.schemas.nurse import (
    NursingNoteCreate, NursingNote as NursingNoteSchema,
    MedicationAdministrationCreate, MedicationAdministration as MedAdminSchema,
    NurseActivityLogCreate, NurseActivityLog as ActivityLogSchema,
    NurseDashboardPatient
)
from app.schemas.medical_record import MedicalRecord as MedicalRecordSchema
from datetime import datetime

router = APIRouter()

@router.get("/patients", response_model=List[NurseDashboardPatient])
def get_nurse_dashboard_patients(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    ward: Optional[str] = None,
    admitted_only: bool = False
) -> Any:
    """
    Get all patients with their ward/bed info and clinical status.
    Filterable by name/ID, ward, and admission status.
    """
    if current_user.role not in [UserRole.NURSE, UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

    query = select(Patient).join(User, Patient.user_id == User.id)
    
    if search:
        search_filter = or_(
            User.full_name.ilike(f"%{search}%"),
            Patient.unique_id.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
    
    if admitted_only:
        query = query.where(Patient.is_admitted == True)
        
    patients = db.exec(query.offset(skip).limit(limit)).all()
    
    result = []
    for p in patients:
        # Get ward/bed info
        bed = db.exec(select(Bed).where(Bed.patient_id == p.id)).first()
        
        # Get last vitals
        last_vitals = db.exec(
            select(Vitals)
            .where(Vitals.patient_id == p.id)
            .order_by(Vitals.recorded_at.desc())
        ).first()
        
        # Count active prescriptions
        active_prescriptions = db.exec(
            select(func.count(Prescription.id))
            .where(Prescription.patient_id == p.id)
            .where(Prescription.status.in_(["dispensing", "partial", "sent_to_pharmacy"]))
        ).one()
        
        result.append(NurseDashboardPatient(
            id=p.id,
            full_name=p.user.full_name,
            unique_id=p.unique_id,
            gender=p.gender,
            date_of_birth=p.date_of_birth,
            is_admitted=p.is_admitted,
            ward_name=bed.ward_name if bed else None,
            bed_number=bed.bed_number if bed else None,
            last_vitals=last_vitals.dict() if last_vitals else None,
            active_prescriptions_count=active_prescriptions
        ))
    
    return result

@router.post("/notes", response_model=NursingNoteSchema)
def create_nursing_note(
    *,
    db: Session = Depends(deps.get_db),
    note_in: NursingNoteCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.NURSE:
         raise HTTPException(status_code=403, detail="Only nurses can create clinical notes")
    
    db_obj = NursingNote(
        **note_in.dict(),
        nurse_id=current_user.id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Audit Log
    audit = NurseActivityLog(
        nurse_id=current_user.id,
        patient_id=note_in.patient_id,
        action_type=NurseActionType.NOTE_ADDED,
        id_reference=db_obj.id,
        details=f"Category: {note_in.category} | Content: {note_in.content}"
    )
    db.add(audit)
    db.commit()
    
    return db_obj

@router.post("/medication-logs", response_model=MedAdminSchema)
def create_medication_log(
    *,
    db: Session = Depends(deps.get_db),
    log_in: MedicationAdministrationCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.NURSE:
         raise HTTPException(status_code=403, detail="Only nurses can log medication administration")
    
    db_obj = MedicationAdministration(
        **log_in.dict(),
        nurse_id=current_user.id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Audit Log
    item = db.get(PrescriptionItem, log_in.prescription_item_id)
    audit = NurseActivityLog(
        nurse_id=current_user.id,
        patient_id=log_in.patient_id,
        action_type=NurseActionType.MEDICATION_ADMINISTERED,
        id_reference=db_obj.id,
        details=f"Medication: {item.drug_name if item else 'Unknown'}, Status: {log_in.status}"
    )
    db.add(audit)
    db.commit()
    
    return db_obj

@router.post("/escalate", response_model=ActivityLogSchema)
def escalate_patient(
    *,
    db: Session = Depends(deps.get_db),
    patient_id: int = Query(...),
    reason: str = Query(...),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role != UserRole.NURSE:
         raise HTTPException(status_code=403, detail="Only nurses can escalate patients")
    
    # Audit Log
    audit = NurseActivityLog(
        nurse_id=current_user.id,
        patient_id=patient_id,
        action_type=NurseActionType.PATIENT_ESCALATED,
        details=f"Reason: {reason}"
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)

    # Create Notifications for all doctors
    from app.models.notification import Notification, NotificationType
    doctors = db.exec(select(User).where(User.role == UserRole.DOCTOR)).all()
    patient = db.get(Patient, patient_id)
    
    for doc in doctors:
        notif = Notification(
            user_id=doc.id,
            title="CRITICAL: Patient Escalation",
            message=f"Nurse {current_user.full_name} escalated patient {patient.user.full_name if patient else patient_id}. Reason: {reason}",
            type=NotificationType.ALARM,
            link=f"/dashboard/Doctor/patients/{patient_id}"
        )
        db.add(notif)
    
    db.commit()
    return audit

@router.get("/activity-logs/{patient_id}", response_model=List[ActivityLogSchema])
def get_patient_activity_logs(
    patient_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role not in [UserRole.NURSE, UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    logs = db.exec(
        select(NurseActivityLog, User.full_name, NursingNote.content)
        .join(User, NurseActivityLog.nurse_id == User.id)
        .join(NursingNote, NurseActivityLog.id_reference == NursingNote.id, isouter=True)
        .where(NurseActivityLog.patient_id == patient_id)
        .order_by(NurseActivityLog.timestamp.desc())
    ).all()
    
    result = []
    for log, name, content in logs:
        log_dict = log.dict()
        log_dict["nurse_name"] = name
        if content:
            log_dict["note_content"] = content
        result.append(log_dict)
    return result

@router.get("/consultations/{patient_id}", response_model=List[MedicalRecordSchema])
def get_patient_consultations(
    patient_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Allow nurses to see doctor's consultations/commands for a patient.
    """
    if current_user.role not in [UserRole.NURSE, UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    from app.models.medical_record import MedicalRecord
    
    records = db.exec(
        select(MedicalRecord, User.full_name)
        .join(User, MedicalRecord.doctor_id == User.id)
        .where(MedicalRecord.patient_id == patient_id)
        .order_by(MedicalRecord.visit_date.desc())
    ).all()
    
    result = []
    for rec, name in records:
        rec_dict = rec.dict()
        rec_dict["doctor_name"] = f"Dr. {name}"
        result.append(rec_dict)
    return result
