"""
Notification helper used by multiple endpoints.
Creates a DB notification and optionally broadcasts via WebSocket.
"""
from sqlmodel import Session
from app.models.notification import Notification, NotificationType
from app.core.websockets import manager


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    ntype: NotificationType,
    broadcast: bool = True,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=ntype,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    if broadcast:
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(
                    manager.global_broadcast(
                        f"notification:{user_id}:{title}"
                    )
                )
        except Exception:
            pass  # non-fatal if WS not available

    return notif
