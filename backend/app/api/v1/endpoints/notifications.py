from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationSchema, NotificationUpdate

router = APIRouter()

@router.get("/", response_model=List[NotificationSchema])
def get_notifications(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 20,
) -> Any:
    """
    Get current user's notifications.
    """
    query = select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    notifications = db.exec(query).all()
    return notifications

@router.put("/{id}/read")
def mark_notification_as_read(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Mark a notification as read.
    """
    notification = db.get(Notification, id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not permitted")
    
    notification.is_read = True
    db.add(notification)
    db.commit()
    return {"message": "Notification marked as read"}

@router.put("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Mark all user's notifications as read.
    """
    notifications = db.exec(select(Notification).where(Notification.user_id == current_user.id, Notification.is_read == False)).all()
    for n in notifications:
        n.is_read = True
        db.add(n)
    db.commit()
    return {"message": "All notifications marked as read"}
