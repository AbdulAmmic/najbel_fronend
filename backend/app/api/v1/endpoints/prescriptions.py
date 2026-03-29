from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate, Prescription as PrescriptionSchema
from app.models.prescription import Prescription, PrescriptionItem
from app.models.invoice import Invoice, InvoiceStatus, InvoiceItem
from app.core.websockets import manager
from app.models.inventory import InventoryItem
import uuid
from datetime import datetime, timedelta

router = APIRouter()

from sqlalchemy.orm import selectinload

@router.get("/pharmacy/queue", response_model=List[PrescriptionSchema])
def get_pharmacy_queue(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get prescriptions ready for dispensing.
    """
    from app.models.user import Patient, Doctor, User as UserModel

    if current_user.role not in [UserRole.PHARMACIST, UserRole.ADMIN, UserRole.DOCTOR]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    prescriptions = db.exec(
        select(Prescription)
        .options(
            selectinload(Prescription.items),
            selectinload(Prescription.patient).selectinload(Patient.user),
            selectinload(Prescription.doctor).selectinload(Doctor.user)
        )
        .where(Prescription.status.in_(["paid", "sent_to_pharmacy", "dispensing"]))
        .order_by(Prescription.created_at.desc())
    ).all()

    # Map names to the schema
    results = []
    for rx in prescriptions:
        rx_data = rx.dict()
        rx_data["items"] = rx.items
        rx_data["patient_name"] = rx.patient.user.full_name if rx.patient and rx.patient.user else "Unknown"
        rx_data["is_admitted"] = rx.patient.is_admitted if rx.patient else False
        rx_data["doctor_name"] = rx.doctor.user.full_name if rx.doctor and rx.doctor.user else "Unknown"
        rx_data["clinical_notes"] = rx.clinical_notes
        results.append(rx_data)
        
    return results

@router.get("/pharmacy/history", response_model=List[PrescriptionSchema])
def get_pharmacy_history(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get dispensed prescription history.
    """
    from app.models.user import Patient, Doctor
    
    if current_user.role not in [UserRole.PHARMACIST, UserRole.ADMIN, UserRole.DOCTOR]:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    prescriptions = db.exec(
        select(Prescription)
        .options(
            selectinload(Prescription.items),
            selectinload(Prescription.patient).selectinload(Patient.user),
            selectinload(Prescription.doctor).selectinload(Doctor.user)
        )
        .where(Prescription.status.in_(["completed", "failed", "partial"]))
        .order_by(Prescription.updated_at.desc())
        .limit(100)
    ).all()

    # Map names to the schema
    results = []
    for rx in prescriptions:
        rx_data = rx.dict()
        rx_data["items"] = rx.items
        rx_data["patient_name"] = rx.patient.user.full_name if rx.patient and rx.patient.user else "Unknown"
        rx_data["is_admitted"] = rx.patient.is_admitted if rx.patient else False
        rx_data["doctor_name"] = rx.doctor.user.full_name if rx.doctor and rx.doctor.user else "Unknown"
        rx_data["clinical_notes"] = rx.clinical_notes
        results.append(rx_data)
        
    return results

@router.get("/", response_model=List[PrescriptionSchema])
def get_prescriptions(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get all prescriptions. Patients see only theirs, doctors see all.
    """
    from app.models.user import Patient, Doctor, User as UserModel
    
    statement = select(Prescription).options(
        selectinload(Prescription.items),
        selectinload(Prescription.patient).selectinload(Patient.user),
        selectinload(Prescription.doctor).selectinload(Doctor.user)
    )
    
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient:
            return []
        statement = statement.where(Prescription.patient_id == patient.id)
    
    prescriptions = db.exec(statement).all()
    
    # Map names to the schema
    results = []
    for rx in prescriptions:
        rx_data = rx.dict()
        rx_data["items"] = rx.items
        rx_data["patient_name"] = rx.patient.user.full_name if rx.patient and rx.patient.user else "Unknown"
        rx_data["is_admitted"] = rx.patient.is_admitted if rx.patient else False
        rx_data["doctor_name"] = rx.doctor.user.full_name if rx.doctor and rx.doctor.user else "Unknown"
        rx_data["clinical_notes"] = rx.clinical_notes
        results.append(rx_data)
        
    return results

@router.post("/", response_model=PrescriptionSchema)
async def create_prescription(
    *,
    db: Session = Depends(deps.get_db),
    prescription_in: PrescriptionCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create a new prescription (Doctor only).
    """
    # 1. Create Prescription record
    db_obj = Prescription(
        patient_id=prescription_in.patient_id,
        doctor_id=current_user.id,
        consultation_id=prescription_in.consultation_id,
        instructions=prescription_in.instructions,
        clinical_notes=prescription_in.clinical_notes,
        status="pending_payment"
    )
    db.add(db_obj)
    db.flush() # Get ID

    # 2. Add Items & Calculate Internal Total
    internal_items = []
    for item_in in prescription_in.items:
        # Fetch current price from inventory if it's an internal item
        current_price = item_in.unit_price
        if item_in.is_internal and item_in.inventory_item_id:
            inv_item = db.get(InventoryItem, item_in.inventory_item_id)
            if inv_item:
                current_price = inv_item.unit_price
        
        p_item = PrescriptionItem(
            prescription_id=db_obj.id,
            **item_in.dict(exclude={"unit_price"}),
            unit_price=current_price
        )
        db.add(p_item)
        if p_item.is_internal:
            internal_items.append(p_item)

    # 3. Handle Invoicing for internal items
    if internal_items:
        total_price = sum(item.unit_price * item.quantity for item in internal_items)
        inv_num = f"INV-RX-{uuid.uuid4().hex[:8].upper()}"
        
        invoice = Invoice(
            invoice_number=inv_num,
            patient_id=db_obj.patient_id,
            amount=total_price,
            status=InvoiceStatus.PENDING,
            due_date=datetime.utcnow() + timedelta(days=3)
        )
        db.add(invoice)
        db.flush() # Get ID
        
        # Add Invoice Items
        for p_item in internal_items:
            inv_item = InvoiceItem(
                invoice_id=invoice.id,
                description=f"Medication: {p_item.drug_name}",
                amount=p_item.unit_price * p_item.quantity
            )
            db.add(inv_item)
        
        db_obj.invoice_id = invoice.id
    else:
        # No internal items to pay for? Move straight to pharmacy queue or active
        db_obj.status = "sent_to_pharmacy"

    db.commit()
    db.refresh(db_obj)
    
    # Broadcast notification
    await manager.global_broadcast(f"prescription_new: {db_obj.id}")
    
    return db_obj

@router.get("/{id}", response_model=PrescriptionSchema)
def get_prescription(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get a prescription by ID.
    """
    prescription = db.get(Prescription, id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    if current_user.role == UserRole.PATIENT:
        from app.models.user import Patient
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient or prescription.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
            
    return prescription

@router.patch("/{id}", response_model=PrescriptionSchema)
async def update_prescription(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    prescription_in: PrescriptionUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a prescription (e.g. mark as dispensed).
    """
    prescription = db.get(Prescription, id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
        
    # Permission check: Pharmacist, Doctor, or Admin can update status
    if current_user.role not in [UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_data = prescription_in.dict(exclude_unset=True)
    status = update_data.get("status")
    
    if status in ["completed", "dispensing", "dispensed"]:
        if prescription.invoice_id:
            invoice = db.get(Invoice, prescription.invoice_id)
            if invoice and invoice.status != InvoiceStatus.PAID:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Prescription {prescription.id} has not been paid for yet. Please direct the patient to the billing department."
                )

    for key, value in update_data.items():
        setattr(prescription, key, value)

    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    
    # Broadcast notification
    await manager.global_broadcast(f"prescription_update: {prescription.id}")
    
    return prescription

@router.delete("/{id}")
async def delete_prescription(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Cancel a prescription (Doctor only).
    """
    prescription = db.get(Prescription, id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
        
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only doctors can cancel prescriptions")
        
    # Mark as cancelled
    prescription.status = "cancelled"
    db.add(prescription)
    
    # Also cancel associated invoice if it exists and is unpaid
    if prescription.invoice_id:
        invoice = db.get(Invoice, prescription.invoice_id)
        if invoice and invoice.status == InvoiceStatus.PENDING:
            invoice.status = "cancelled"
            db.add(invoice)
            
    # Mark all items as cancelled
    items = db.exec(select(PrescriptionItem).where(PrescriptionItem.prescription_id == prescription.id)).all()
    for item in items:
        item.status = "cancelled"
        db.add(item)
        
    db.commit()
    
    await manager.global_broadcast(f"prescription_update: {prescription.id}")
    return {"status": "success", "message": "Prescription cancelled"}

@router.patch("/items/{item_id}/status")
async def update_item_status(
    item_id: int,
    status: str, # dispensed, out_of_stock, cancelled
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update status of a specific prescription item.
    """
    if current_user.role not in [UserRole.PHARMACIST, UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not permitted")

    item = db.get(PrescriptionItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.status = status
    db.add(item)
    
    # Check if we should update the overall prescription status
    prescription = db.get(Prescription, item.prescription_id)
    if prescription:
        # NEW: Payment enforcement and stock deduction for dispensing
        if status == "dispensed":
            if prescription.invoice_id:
                invoice = db.get(Invoice, prescription.invoice_id)
                if invoice and invoice.status != InvoiceStatus.PAID:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Prescription {prescription.id} has not been paid for yet. Please direct the patient to the billing department."
                    )
            
            # Deduct stock if internal
            if item.is_internal and item.inventory_item_id:
                inv_item = db.get(InventoryItem, item.inventory_item_id)
                if inv_item:
                    if inv_item.quantity < item.quantity:
                        raise HTTPException(status_code=400, detail=f"Insufficient stock for {item.drug_name}. Available: {inv_item.quantity}")
                    inv_item.quantity -= item.quantity
                    db.add(inv_item)
        
        # If any item is marked, we are at least 'dispensing'
        if prescription.status in ["paid", "sent_to_pharmacy"]:
            prescription.status = "dispensing"
        
        # Check if all items are processed
        items = db.exec(select(PrescriptionItem).where(PrescriptionItem.prescription_id == prescription.id)).all()
        processed_count = sum(1 for i in items if i.status in ["dispensed", "out_of_stock", "cancelled"])
        
        if processed_count == len(items):
            # All items handled. Determine if fully completed, partial, failed, or cancelled.
            dispensed_count = sum(1 for i in items if i.status == "dispensed")
            cancelled_count = sum(1 for i in items if i.status == "cancelled")
            
            if dispensed_count == len(items):
                prescription.status = "completed"
            elif cancelled_count == len(items):
                prescription.status = "cancelled"
            elif dispensed_count > 0:
                prescription.status = "partial"
            else:
                prescription.status = "failed"
        
        db.add(prescription)

    db.commit()
    db.refresh(item)
    
    await manager.global_broadcast(f"prescription_update: {item.prescription_id}")
    return item
