from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from app.api import deps
from app.models.user import User, UserRole, Patient, Doctor
from app.models.lab_result import LabResult
from app.schemas.lab_result import LabResultCreate, LabResultUpdate, LabResult as LabResultSchema
from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus, InvoiceType, InvoiceItemType
from app.models.lab_test_catalog import LabTestCatalog
from app.models.notification import NotificationType
from app.services.notification_service import create_notification
from app.core.email import (
    send_email_background,
    generate_lab_tech_notification_email,
    generate_lab_payment_request_email
)
import uuid
import os
import random
import string
import json
from datetime import timedelta

LAB_TEMPLATES = {
    "CBC": [
        {"parameter": "White Blood Cells (WBC)", "result": "Pending", "unit": "10^9/L", "reference": "4.0 - 11.0"},
        {"parameter": "Red Blood Cells (RBC)", "result": "Pending", "unit": "10^12/L", "reference": "4.5 - 5.5"},
        {"parameter": "Hemoglobin (HGB)", "result": "Pending", "unit": "g/dL", "reference": "13.0 - 17.0"},
        {"parameter": "Hematocrit (HCT)", "result": "Pending", "unit": "%", "reference": "40 - 50"},
        {"parameter": "Mean Corpuscular Vol (MCV)", "result": "Pending", "unit": "fL", "reference": "80 - 100"},
        {"parameter": "Platelets (PLT)", "result": "Pending", "unit": "10^9/L", "reference": "150 - 450"},
    ],
    "FBC": [
        {"parameter": "White Blood Cells (WBC)", "result": "Pending", "unit": "10^9/L", "reference": "4.0 - 11.0"},
        {"parameter": "Red Blood Cells (RBC)", "result": "Pending", "unit": "10^12/L", "reference": "4.5 - 5.5"},
        {"parameter": "Hemoglobin (HGB)", "result": "Pending", "unit": "g/dL", "reference": "13.0 - 17.0"},
        {"parameter": "Hematocrit (HCT)", "result": "Pending", "unit": "%", "reference": "40 - 50"},
        {"parameter": "Platelets (PLT)", "result": "Pending", "unit": "10^9/L", "reference": "150 - 450"},
    ],
    "Lipid Profile": [
        {"parameter": "Total Cholesterol", "result": "Pending", "unit": "mg/dL", "reference": "< 200"},
        {"parameter": "Triglycerides", "result": "Pending", "unit": "mg/dL", "reference": "< 150"},
        {"parameter": "HDL Cholesterol", "result": "Pending", "unit": "mg/dL", "reference": "> 40"},
        {"parameter": "LDL Cholesterol", "result": "Pending", "unit": "mg/dL", "reference": "< 130"},
    ],
    "Urinalysis": [
        {"parameter": "Color", "result": "Pending", "unit": "", "reference": "Pale Yellow"},
        {"parameter": "Appearance", "result": "Pending", "unit": "", "reference": "Clear"},
        {"parameter": "Specific Gravity", "result": "Pending", "unit": "", "reference": "1.005 - 1.030"},
        {"parameter": "pH", "result": "Pending", "unit": "", "reference": "5.0 - 8.0"},
        {"parameter": "Protein", "result": "Pending", "unit": "", "reference": "Negative"},
        {"parameter": "Glucose", "result": "Pending", "unit": "", "reference": "Negative"},
    ],
    "Malaria MP": [
        {"parameter": "Parasite seen", "result": "Pending", "unit": "", "reference": "Negative"},
        {"parameter": "Density", "result": "Pending", "unit": "per ul", "reference": "-"},
    ],
    "Widal": [
        {"parameter": "Salmonella Typhi O", "result": "Pending", "unit": "Titre", "reference": "< 1:80"},
        {"parameter": "Salmonella Typhi H", "result": "Pending", "unit": "Titre", "reference": "< 1:80"},
    ],
    "FBS": [
        {"parameter": "Fasting Blood Sugar (FBS)", "result": "Pending", "unit": "mmol/L", "reference": "3.9 - 6.1"},
    ],
    "Sugar": [
        {"parameter": "Random Blood Sugar", "result": "Pending", "unit": "mmol/L", "reference": "3.9 - 11.0"},
    ]
}

router = APIRouter()

@router.get("/", response_model=List[LabResultSchema])
def get_lab_results(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    patient_id: Optional[int] = None,
) -> Any:
    statement = select(LabResult).options(
        selectinload(LabResult.patient).selectinload(Patient.user),
        selectinload(LabResult.invoice),
        selectinload(LabResult.validator),
        selectinload(LabResult.doctor).selectinload(Doctor.user)
    )

    if patient_id:
        statement = statement.where(LabResult.patient_id == patient_id)
    elif current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient:
            return []
        statement = statement.where(LabResult.patient_id == patient.id)
    
    results = db.exec(statement).all()
    return results

@router.post("/", response_model=LabResultSchema)
def create_lab_result(
    *,
    db: Session = Depends(deps.get_db),
    lab_result_in: LabResultCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    print(f"DEBUG: Creating lab result for patient {lab_result_in.patient_id} by user {current_user.id}")
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN, UserRole.LAB_TECH, UserRole.RECEPTIONIST, UserRole.NURSE]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # 1. Create Lab Result (Request)
    """
    Create a new lab result and an associated invoice.
    """
    def generate_short_id():
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))

    # Ensure unique short_id
    short_id = generate_short_id()
    while db.exec(select(LabResult).where(LabResult.short_id == short_id)).first():
        short_id = generate_short_id()

    lab_result_in.status = "requested"
    db_obj = LabResult.from_orm(lab_result_in)
    db_obj.short_id = short_id
    
    # Pre-populate result_data from template if available
    test_upper = lab_result_in.test_name.upper()
    template_key = next((k for k in LAB_TEMPLATES if k in test_upper), None)
    if template_key:
        db_obj.result_data = json.dumps(LAB_TEMPLATES[template_key])
        db_obj.result = "See details"
    else:
        db_obj.result = "Pending"
    
    # Correct doctor ID (use doctor.id, not user.id)
    if current_user.role == UserRole.DOCTOR and current_user.doctor_profile:
        db_obj.doctor_id = current_user.doctor_profile.id
    
    db.add(db_obj)
    # Don't commit yet

    # 2. Look up price from catalog (case-insensitive match)
    from app.models.lab_test_catalog import LabTestCatalog
    catalog_entry = db.exec(
        select(LabTestCatalog)
        .where(LabTestCatalog.is_active == True)
        .where(LabTestCatalog.name.ilike(f"%{lab_result_in.test_name}%"))
    ).first()
    lab_price = float(catalog_entry.price) if catalog_entry else 5000.0

    inv_num = f"INV-{uuid.uuid4().hex[:8].upper()}"
    invoice = Invoice(
        invoice_number=inv_num,
        patient_id=lab_result_in.patient_id,
        amount=lab_price,
        status=InvoiceStatus.PENDING,
        due_date=datetime.utcnow() + timedelta(days=1),
        created_at=datetime.utcnow()
    )
    db.add(invoice)

    # Use relationship to add item (handles ID assignment automatically)
    invoice.items.append(InvoiceItem(
        description=f"Lab Test: {lab_result_in.test_name}",
        amount=lab_price
    ))

    # Link invoice to lab result
    print("DEBUG: Linking invoice to lab result")
    db_obj.invoice = invoice # Link using relationship
    db.add(db_obj)
    print("DEBUG: Final commit start")
    db.commit() # FINAL COMMIT
    print("DEBUG: Final commit end")
    db.refresh(db_obj)

    # --- Notifications ---
    patient = db.get(Patient, db_obj.patient_id)
    if patient:
        patient_user = db.get(User, patient.user_id)
        # 1. Notify Lab Technicians
        techs = db.exec(select(User).where(User.role == UserRole.LAB_TECH, User.is_active == True)).all()
        for tech in techs:
            if tech.email:
                email_html = generate_lab_tech_notification_email(
                    tech.full_name,
                    patient_user.full_name if patient_user else f"Patient #{patient.id}",
                    db_obj.test_name,
                    db_obj.short_id,
                    db_obj.priority
                )
                send_email_background(tech.email, f"New Lab Request: {db_obj.short_id}", email_html)

        # 2. Notify Patient for payment
        if patient_user and patient_user.email:
            payment_email_html = generate_lab_payment_request_email(
                patient_user.full_name,
                db_obj.test_name,
                db_obj.short_id,
                invoice.amount
            )
            send_email_background(patient_user.email, f"Lab Payment Required: {db_obj.short_id}", payment_email_html)

    return db_obj

@router.put("/{id}", response_model=LabResultSchema)
def update_lab_result(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    lab_result_in: LabResultUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN, UserRole.LAB_TECH]: 
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    lab_result = db.get(LabResult, id)
    if not lab_result:
        raise HTTPException(status_code=404, detail="Lab result not found")
        
    update_data = lab_result_in.dict(exclude_unset=True)
    
    # Smart timestamp updates and business logic based on status change
    if "status" in update_data:
        new_status = update_data["status"]
        old_status = lab_result.status

        # 1. Doctor Cancellation
        if new_status == "cancelled":
            if old_status != "requested":
                raise HTTPException(status_code=400, detail="Cannot cancel a lab request that is already being processed.")
            # Note: Permissions check for DOCTOR/ADMIN is already done at top of function
        
        # 2. Payment Enforcement for Technician Acceptance
        elif new_status in ["sample_collected", "processing"] and old_status == "requested":
            # If current_user is LAB_TECH, ensure invoice is paid
            if current_user.role == UserRole.LAB_TECH:
                if lab_result.invoice_id:
                    invoice = db.get(Invoice, lab_result.invoice_id)
                    if invoice and invoice.status != InvoiceStatus.PAID:
                        raise HTTPException(
                            status_code=400, 
                            detail="Lab test has not been paid for yet. Please direct the patient to the billing department."
                        )

        if new_status == "sample_collected" and not lab_result.collected_at:
            lab_result.collected_at = datetime.utcnow()
        elif new_status == "completed" and not lab_result.processed_at:
            lab_result.processed_at = datetime.utcnow()
        elif new_status == "validated" and not lab_result.validated_at:
            lab_result.validated_at = datetime.utcnow()
            lab_result.validated_by = current_user.id
            
    for key, value in update_data.items():
        setattr(lab_result, key, value)
        
    db.add(lab_result)
    db.commit()
    db.refresh(lab_result)
    return lab_result


# ─── NEW: Doctor requests lab test from consultation (PAID / FREE logic) ──────

@router.post("/request")
def request_lab_test(
    data: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Doctor requests a lab test during consultation.
    - FREE test: patient notified to upload result in-app (no payment)
    - PAID test: creates/updates consultation invoice, patient must pay
    """
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can request lab tests")

    doctor = db.exec(select(Doctor).where(Doctor.user_id == current_user.id)).first()
    if not doctor:
        raise HTTPException(status_code=403, detail="Doctor profile not found")

    consultation_id = data.get("consultation_id")
    catalog_id = data.get("catalog_id")
    priority = data.get("priority", "normal")

    if not consultation_id or not catalog_id:
        raise HTTPException(status_code=422, detail="consultation_id and catalog_id are required")

    from app.models.consultation import Consultation, ConsultationStatus
    consultation = db.get(Consultation, consultation_id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    if consultation.status == ConsultationStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Consultation is locked")

    catalog = db.get(LabTestCatalog, catalog_id)
    if not catalog:
        raise HTTPException(status_code=404, detail="Lab test not found in catalog")

    test_type = catalog.test_type if hasattr(catalog, 'test_type') else 'PAID'
    is_free = str(test_type).upper() == "FREE"

    # Generate short_id
    def _short():
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    short_id = _short()
    while db.exec(select(LabResult).where(LabResult.short_id == short_id)).first():
        short_id = _short()

    # Pre-populate result_data from template if available
    result_data = None
    test_upper = catalog.name.upper()
    template_key = next((k for k in LAB_TEMPLATES if k.upper() in test_upper), None)
    if template_key:
        result_data = json.dumps(LAB_TEMPLATES[template_key])

    lab_result = LabResult(
        patient_id=consultation.patient_id,
        doctor_id=doctor.id,
        consultation_id=consultation_id,
        test_name=catalog.name,
        test_type="FREE" if is_free else "PAID",
        payment_status="not_required" if is_free else "pending",
        status="requested",
        priority=priority,
        short_id=short_id,
        result="See details" if result_data else "Pending",
        result_data=result_data,
    )
    db.add(lab_result)
    db.flush()

    # Resolve patient user for notifications
    patient = db.get(Patient, consultation.patient_id)
    patient_user = db.get(User, patient.user_id) if patient else None

    if is_free:
        # FREE: notify patient to upload result
        if patient_user:
            create_notification(
                db, patient_user.id,
                "Upload Lab Result Required",
                f"Your doctor has requested a {catalog.name} test. Please upload your result in the app.",
                NotificationType.RESULT_UPLOAD_REQUIRED,
            )
        db.commit()
        db.refresh(lab_result)
        return {
            "lab_result_id": lab_result.id,
            "test_type": "FREE",
            "message": "Patient notified to upload result",
        }
    else:
        # PAID: add to consultation invoice or create new invoice
        from app.models.consultation import Consultation
        inv_num = f"INV-{uuid.uuid4().hex[:8].upper()}"
        invoice = Invoice(
            invoice_number=inv_num,
            patient_id=consultation.patient_id,
            consultation_id=consultation_id,
            amount=catalog.price,
            status=InvoiceStatus.PENDING,
            invoice_type=InvoiceType.LAB_TEST,
            due_date=datetime.utcnow() + timedelta(hours=48),
        )
        db.add(invoice)
        db.flush()

        item = InvoiceItem(
            invoice_id=invoice.id,
            description=f"Lab Test: {catalog.name}",
            amount=catalog.price,
            quantity=1,
            item_type=InvoiceItemType.LAB_TEST,
            reference_id=lab_result.id,
        )
        db.add(item)
        lab_result.invoice_id = invoice.id
        db.add(lab_result)
        db.commit()
        db.refresh(lab_result)

        # Notify patient
        if patient_user:
            create_notification(
                db, patient_user.id,
                "Lab Test Payment Required",
                f"Pay ₦{catalog.price:,.0f} for {catalog.name} test. After payment, proceed to hospital for sample.",
                NotificationType.PAYMENT_REQUIRED,
            )

        return {
            "lab_result_id": lab_result.id,
            "invoice_id": invoice.id,
            "invoice_number": inv_num,
            "amount": catalog.price,
            "test_type": "PAID",
            "message": "Invoice created. Patient must pay to proceed.",
        }


# ─── NEW: Patient uploads lab result file (FREE tests — local disk) ───────────

@router.post("/{id}/upload-result")
async def upload_lab_result_file(
    id: int,
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Patient uploads result file for FREE lab tests."""
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Only patients can upload results")

    lab_result = db.get(LabResult, id)
    if not lab_result:
        raise HTTPException(status_code=404, detail="Lab result not found")

    patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
    if not patient or lab_result.patient_id != patient.id:
        raise HTTPException(status_code=403, detail="Not your lab result")

    if str(lab_result.test_type).upper() != "FREE":
        raise HTTPException(status_code=400, detail="This test requires in-app payment, not file upload")

    # Save file locally
    upload_dir = "/tmp/uploads/lab_results"
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(file.filename or "result")[-1] or ".pdf"
    filename = f"lab_{id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(upload_dir, filename)

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    with open(filepath, "wb") as f:
        f.write(contents)

    lab_result.patient_file_url = filepath
    lab_result.status = "completed"
    db.add(lab_result)
    db.commit()

    return {"message": "Result uploaded successfully", "file_path": filepath, "lab_result_id": id}


# ─── NEW: Patient's pending lab actions ───────────────────────────────────────

@router.get("/my-pending")
def get_my_pending_labs(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Patient sees all pending lab actions (unpaid PAID tests + unuploaded FREE tests)."""
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Not authorized")

    patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
    if not patient:
        return {"pending_payment": [], "pending_upload": []}

    pending_payment = db.exec(
        select(LabResult)
        .where(LabResult.patient_id == patient.id)
        .where(LabResult.test_type == "PAID")
        .where(LabResult.payment_status == "pending")
    ).all()

    pending_upload = db.exec(
        select(LabResult)
        .where(LabResult.patient_id == patient.id)
        .where(LabResult.test_type == "FREE")
        .where(LabResult.patient_file_url == None)
    ).all()

    return {
        "pending_payment": [
            {"lab_result_id": lr.id, "test_name": lr.test_name, "invoice_id": lr.invoice_id}
            for lr in pending_payment
        ],
        "pending_upload": [
            {"lab_result_id": lr.id, "test_name": lr.test_name}
            for lr in pending_upload
        ],
    }
