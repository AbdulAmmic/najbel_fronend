from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole
from app.models.inventory import InventoryItem, InventoryItemCreate, InventoryItemUpdate
from app.core.websockets import manager
from app.core.permissions import RoleChecker
from datetime import datetime, date

router = APIRouter()

@router.get("/inventory", response_model=List[InventoryItem])
def get_inventory(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    low_stock: bool = False,
    expiry_alert: bool = False
) -> Any:
    """
    Get all inventory items. 
    Optional filters for low stock or expiring soon.
    """
    query = select(InventoryItem)
    
    if low_stock:
        query = query.where(InventoryItem.quantity <= InventoryItem.reorder_level)
    
    # logic for expiry check can be added here if needed, or handled in frontend
    
    items = db.exec(query).all()
    return items

@router.post("/inventory", response_model=InventoryItem)
def create_item(
    item_in: InventoryItemCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(RoleChecker([UserRole.PHARMACIST, UserRole.STORE_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
) -> Any:
    """
    Add new medicine/item to inventory.
    """
    item = InventoryItem.from_orm(item_in)
    db.add(item)
    db.commit()
    db.refresh(item)
    
    background_tasks.add_task(manager.global_broadcast, f"pharmacy_update: item {item.name} added")
    
    return item

@router.put("/inventory/{item_id}", response_model=InventoryItem)
def update_item(
    item_id: int,
    item_in: InventoryItemUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    # Strict: Pharmacist or Store Officer
    _ = Depends(RoleChecker([UserRole.PHARMACIST, UserRole.STORE_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
) -> Any:
    """
    Update item details or stock level (Dispense/Restock).
    """
    item = db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = item_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(item, key):
            setattr(item, key, value)
            
    item.updated_at = datetime.utcnow()
    db.add(item)
    db.commit()
    db.refresh(item)
    
    background_tasks.add_task(manager.global_broadcast, f"pharmacy_update: item {item.name} updated")
    
    return item

@router.delete("/inventory/{item_id}")
def delete_item(
    item_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    # Strict: Pharmacist or Store Officer
    _ = Depends(RoleChecker([UserRole.PHARMACIST, UserRole.STORE_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
) -> Any:
    """
    Delete an inventory item.
    """
    item = db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    db.delete(item)
    db.commit()
    
    background_tasks.add_task(manager.global_broadcast, f"pharmacy_update: item {item_id} deleted")
    
    return {"message": "Item deleted"}


# ─── Patient-facing endpoints ───

@router.get("/search")
def search_drugs(
    q: str = "",
    category: str = "",
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Search inventory items by name or category. Only shows in-stock items."""
    query = select(InventoryItem).where(InventoryItem.quantity > 0)
    if q:
        query = query.where(InventoryItem.name.ilike(f"%{q}%"))
    if category:
        query = query.where(InventoryItem.category == category)
    items = db.exec(query).all()
    return items


@router.post("/orders")
def place_order(
    order_data: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Place a drug order. Expects:
    {
        "items": [{"inventory_item_id": 1, "quantity": 2}, ...],
        "delivery_address": "123 Main St",
        "delivery_phone": "08012345678",
        "delivery_note": "Leave at gate",
        "payment_method": "wallet"
    }
    """
    from app.models.drug_order import DrugOrder, DrugOrderItem
    from app.models.wallet import Wallet

    cart_items = order_data.get("items", [])
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Validate items and calculate total
    total = 0.0
    validated = []
    for ci in cart_items:
        item = db.get(InventoryItem, ci["inventory_item_id"])
        if not item:
            raise HTTPException(status_code=404, detail=f"Item {ci['inventory_item_id']} not found")
        if item.quantity < ci["quantity"]:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {item.name}")
        line_total = item.unit_price * ci["quantity"]
        total += line_total
        validated.append({"item": item, "qty": ci["quantity"], "price": item.unit_price})

    # Check wallet balance if paying by wallet
    if order_data.get("payment_method", "wallet") == "wallet":
        wallet = db.exec(select(Wallet).where(Wallet.user_id == current_user.id)).first()
        if not wallet or wallet.balance < total:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")
        wallet.balance -= total
        db.add(wallet)

    # Create order
    order = DrugOrder(
        patient_id=current_user.id,
        delivery_address=order_data.get("delivery_address", ""),
        delivery_phone=order_data.get("delivery_phone", ""),
        delivery_note=order_data.get("delivery_note", ""),
        total_amount=total,
        payment_method=order_data.get("payment_method", "wallet"),
        status="pending"
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Create order items and deduct stock
    for v in validated:
        oi = DrugOrderItem(
            order_id=order.id,
            inventory_item_id=v["item"].id,
            item_name=v["item"].name,
            quantity=v["qty"],
            unit_price=v["price"]
        )
        v["item"].quantity -= v["qty"]
        db.add(oi)
        db.add(v["item"])

    db.commit()

    return {"message": "Order placed", "order_id": order.id, "total": total}


@router.get("/orders/my")
def get_my_orders(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get current patient's drug orders."""
    from app.models.drug_order import DrugOrder, DrugOrderItem

    orders = db.exec(
        select(DrugOrder).where(DrugOrder.patient_id == current_user.id).order_by(DrugOrder.created_at.desc())
    ).all()

    result = []
    for o in orders:
        items = db.exec(select(DrugOrderItem).where(DrugOrderItem.order_id == o.id)).all()
        result.append({
            "id": o.id,
            "status": o.status,
            "total_amount": o.total_amount,
            "delivery_address": o.delivery_address,
            "delivery_phone": o.delivery_phone,
            "payment_method": o.payment_method,
            "created_at": o.created_at.isoformat(),
            "items": [{"name": i.item_name, "quantity": i.quantity, "unit_price": i.unit_price} for i in items]
        })

    return result

@router.get("/orders/all")
def get_all_orders(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _ = Depends(RoleChecker([UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
) -> Any:
    """Admin/Pharmacist: Get all drug orders in the system."""
    from app.models.drug_order import DrugOrder, DrugOrderItem
    from app.models.user import User as UserModel

    # Joint query to get user full_name
    statement = select(DrugOrder).order_by(DrugOrder.created_at.desc())
    orders = db.exec(statement).all()

    result = []
    for o in orders:
        items = db.exec(select(DrugOrderItem).where(DrugOrderItem.order_id == o.id)).all()
        # Find user name
        patient_user = db.get(UserModel, o.patient_id)
        result.append({
            "id": o.id,
            "patient_id": o.patient_id,
            "patient_name": patient_user.full_name if patient_user else "Unknown",
            "status": o.status,
            "total_amount": o.total_amount,
            "delivery_address": o.delivery_address,
            "delivery_phone": o.delivery_phone,
            "delivery_note": o.delivery_note,
            "payment_method": o.payment_method,
            "created_at": o.created_at.isoformat(),
            "items": [{"name": i.item_name, "quantity": i.quantity, "unit_price": i.unit_price} for i in items]
        })

    return result

@router.put("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    status: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    _ = Depends(RoleChecker([UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
) -> Any:
    """Update order status (e.g. pending -> dispatched -> delivered)."""
    from app.models.drug_order import DrugOrder
    
    order = db.get(DrugOrder, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order.status = status
    order.updated_at = datetime.utcnow()
    db.add(order)
    db.commit()
    
    background_tasks.add_task(manager.global_broadcast, f"pharmacy_update: order {order_id} status changed to {status}")
    
    return {"message": "Order status updated", "new_status": status}


# ─── Prescription Processing by Pharmacy ───────────────────────────────────────

@router.get("/prescriptions")
def get_all_prescriptions(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get all prescriptions for pharmacist to process."""
    from app.models.prescription import Prescription
    from app.models.user import Patient, Doctor, User as UserModel
    
    if current_user.role not in [UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR, UserRole.NURSE]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    prescriptions = db.exec(select(Prescription).order_by(Prescription.created_at.desc())).all()
    
    result = []
    for rx in prescriptions:
        patient = db.get(Patient, rx.patient_id)
        patient_user = db.get(UserModel, patient.user_id) if patient else None
        result.append({
            "id": rx.id,
            "medication": rx.medication,
            "dosage": rx.dosage,
            "frequency": rx.frequency,
            "duration": rx.duration,
            "instructions": rx.instructions,
            "status": rx.status,
            "created_at": rx.created_at.isoformat(),
            "patient_id": rx.patient_id,
            "patient_name": patient_user.full_name if patient_user else "Unknown",
        })
    return result


@router.post("/prescriptions/{prescription_id}/process")
async def process_prescription(
    prescription_id: int,
    process_data: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Pharmacy processes a prescription.
    Body:
    {
        "items": [
            {"medication": "Amoxicillin", "available": true, "unit_price": 500, "quantity": 14},
            {"medication": "Ibuprofen", "available": false}
        ]
    }
    Creates an invoice for available items automatically.
    """
    from app.models.prescription import Prescription
    from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus
    from app.models.user import Patient
    
    if current_user.role not in [UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Only pharmacists can process prescriptions")
    
    rx = db.get(Prescription, prescription_id)
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    items = process_data.get("items", [])
    if not items:
        raise HTTPException(status_code=400, detail="No items provided")
    
    available_items = [i for i in items if i.get("available")]
    
    if available_items:
        total = sum(
            float(i.get("unit_price", 0)) * int(i.get("quantity", 1))
            for i in available_items
        )
        inv_num = f"INV-RX-{rx.id}-{int(datetime.utcnow().timestamp())}"
        invoice = Invoice(
            invoice_number=inv_num,
            patient_id=rx.patient_id,
            amount=total,
            status=InvoiceStatus.PENDING,
            due_date=datetime.utcnow().replace(hour=23, minute=59),
        )
        db.add(invoice)
        db.commit()
        db.refresh(invoice)
        
        for item in available_items:
            line = float(item.get("unit_price", 0)) * int(item.get("quantity", 1))
            inv_item = InvoiceItem(
                invoice_id=invoice.id,
                description=f"{item['medication']} x{item.get('quantity', 1)} @ ₦{item.get('unit_price', 0)}",
                amount=line,
            )
            db.add(inv_item)
        
        db.commit()
    
    # Mark prescription as processed/pending payment
    if available_items:
        rx.status = "pending_payment"
    else:
        rx.status = "unavailable"
    db.add(rx)
    db.commit()
    
    background_tasks.add_task(
        manager.global_broadcast,
        f"pharmacy_update: prescription {prescription_id} processed"
    )
    
    unavailable = [i["medication"] for i in items if not i.get("available")]
    return {
        "message": "Prescription processed",
        "invoice_created": bool(available_items),
        "invoice_total": sum(float(i.get("unit_price", 0)) * int(i.get("quantity", 1)) for i in available_items) if available_items else 0,
        "unavailable_medications": unavailable,
    }
