from typing import Any, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from app.api import deps
from app.models.user import User, UserRole, Patient
from app.models.lab_result import LabResult
from app.schemas.lab_result import LabResultCreate, LabResultUpdate, LabResult as LabResultSchema
from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus
import uuid
from datetime import timedelta

router = APIRouter()

@router.get("/", response_model=List[LabResultSchema])
def get_lab_results(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    statement = select(LabResult).options(selectinload(LabResult.patient).selectinload(Patient.user))
    
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient:
            return []
        statement = statement.where(LabResult.patient_id == patient.id)
    else:
        # Doctor/Admin/LabTech sees all or filtered logic
        pass

    results = db.exec(statement).all()
    return results

@router.post("/", response_model=LabResultSchema)
def create_lab_result(
    *,
    db: Session = Depends(deps.get_db),
    lab_result_in: LabResultCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN, UserRole.LAB_TECH, UserRole.RECEPTIONIST, UserRole.NURSE]: 
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # 1. Create Lab Result (Request)
    lab_result_in.status = "requested"
    db_obj = LabResult.from_orm(lab_result_in)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

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
    db.commit()
    db.refresh(invoice)

    item = InvoiceItem(
        invoice_id=invoice.id,
        description=f"Lab Test: {lab_result_in.test_name}",
        amount=lab_price
    )
    db.add(item)
    db.commit()

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
    
    # Smart timestamp updates based on status change
    if "status" in update_data:
        new_status = update_data["status"]
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
