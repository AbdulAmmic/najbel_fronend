from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User, UserRole, Patient
from app.models.radiology import RadiologyScan
from app.core.websockets import manager
from app.core.permissions import RoleChecker
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[RadiologyScan])
def get_radiology_scans(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient:
            return []
        return db.exec(select(RadiologyScan).where(RadiologyScan.patient_id == patient.id)).all()
    
    # Radiology staff, Doctors, Admin can see all
    # Might want to restrict further but this is acceptable for now
    return db.exec(select(RadiologyScan)).all()

@router.post("/", response_model=RadiologyScan)
def create_scan_request(
    scan_in: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(RoleChecker([UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
) -> Any:
    # Basic validation
    scan = RadiologyScan(
        patient_id=scan_in.get("patient_id"),
        doctor_id=current_user.id if current_user.role == UserRole.DOCTOR else None,
        scan_type=scan_in.get("scan_type"),
        body_part=scan_in.get("body_part"),
        reason=scan_in.get("reason"),
        status="requested"
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    
    background_tasks.add_task(manager.global_broadcast, f"radiology_update: new request for patient {scan.patient_id}")
    
    return scan

@router.post("/{id}/upload")
def upload_scan_image(
    id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), # Mock handle
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    # Strict: Radiologists only (and Admin)
    _ = Depends(RoleChecker([UserRole.RADIOLOGIST, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
) -> Any:
    scan = db.get(RadiologyScan, id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan request not found")
        
    # In a real app, upload to S3/Cloudinary here.
    # For now, we return a mock URL or base64 if needed, 
    # but let's just use a placeholder based on type for demo visual
    
    mock_urls = {
        "X-Ray": "https://prod-images-static.radiopaedia.org/images/1301049/0b2866946051772186842790938448_jumbo.jpeg",
        "MRI": "https://prod-images-static.radiopaedia.org/images/52672464/20b4105267b1479873d63503164993_jumbo.jpeg",
        "CT": "https://prod-images-static.radiopaedia.org/images/2946289/6e43621421f92419bc9a6869b7f575_jumbo.jpeg"
    }
    
    scan.image_url = mock_urls.get(scan.scan_type, "https://via.placeholder.com/400x400?text=Scan+Image")
    scan.status = "completed"
    scan.completed_at = datetime.utcnow()
    
    db.add(scan)
    db.commit()
    
    background_tasks.add_task(manager.global_broadcast, f"radiology_update: scan uploaded for id {id}")
    
    return {"message": "Image uploaded successfully", "url": scan.image_url}

@router.put("/{id}/report")
def update_report(
    id: int,
    data: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    # Strict: Radiologists only (and Admin)
    _ = Depends(RoleChecker([UserRole.RADIOLOGIST, UserRole.ADMIN, UserRole.SUPER_ADMIN]))
) -> Any:
    scan = db.get(RadiologyScan, id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan request not found")
        
    scan.findings = data.get("findings")
    db.add(scan)
    db.commit()
    
    background_tasks.add_task(manager.global_broadcast, f"radiology_update: report updated for id {id}")
    
    return scan
