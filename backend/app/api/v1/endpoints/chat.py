from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.core.websockets import manager
from app.api import deps
from app.models.chat import ChatMessage
from app.models.user import User, UserRole, Patient
from app.schemas.chat import ChatMessage as ChatMessageSchema
from app.core.config import settings
from typing import List, Any, Optional
import json
import traceback

router = APIRouter()

# ─────────────────────────────────────────────
# UNIFIED PATIENT CHAT MODEL
# consultation_id in chat_messages IS the patient_id.
# No consultation, no room concept. Just patient ↔ care team.
# ─────────────────────────────────────────────

@router.get("/patient/{patient_id}/history")
def get_patient_chat_history(
    patient_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Fast patient chat history — keyed by patient_id.
    Staff can read any patient. Patient can only read their own.
    """
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient or patient.id != patient_id:
            raise HTTPException(status_code=403, detail="Access Denied")
    elif current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN, UserRole.NURSE, UserRole.RECEPTIONIST]:
        raise HTTPException(status_code=403, detail="Access Denied")

    msgs = db.exec(
        select(ChatMessage)
        .where(ChatMessage.consultation_id == patient_id)
        .order_by(ChatMessage.created_at.asc())
    ).all()
    return [
        {
            "id": m.id,
            "sender_name": m.sender_name,
            "sender_role": m.sender_role,
            "message": m.message,
            "audio_url": m.audio_url,
            "image_url": m.image_url,
            "is_ai": m.is_ai,
            "created_at": m.created_at.isoformat()
        }
        for m in msgs
    ]


@router.post("/patient/{patient_id}/send")
def send_patient_message(
    patient_id: int,
    message_in: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    REST endpoint to send a message in a patient's chat thread.
    Staff can send to any patient. Patient can only send in their own thread.
    """
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient or patient.id != patient_id:
            raise HTTPException(status_code=403, detail="Access Denied")

    text = message_in.get("message") or message_in.get("text") or ""
    sender_name = message_in.get("sender_name") or message_in.get("senderName") or current_user.full_name
    sender_role = message_in.get("sender_role") or message_in.get("senderRole") or str(current_user.role.value)

    msg = ChatMessage(
        consultation_id=patient_id,  # Unified: consultation_id == patient_id
        sender_name=sender_name,
        sender_role=sender_role,
        message=text,
        audio_url=message_in.get("audio_url") or message_in.get("audioUrl"),
        image_url=message_in.get("image_url") or message_in.get("imageUrl"),
        is_ai=False
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    return {
        "id": msg.id,
        "sender_name": msg.sender_name,
        "sender_role": msg.sender_role,
        "message": msg.message,
        "audio_url": msg.audio_url,
        "image_url": msg.image_url,
        "created_at": msg.created_at.isoformat()
    }


@router.get("/patients/list")
def list_patients_for_chat(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Returns all patients for the doctor/staff chat sidebar.
    Includes unread count and last message preview.
    """
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN, UserRole.NURSE, UserRole.RECEPTIONIST]:
        raise HTTPException(status_code=403, detail="Not authorized")

    patients = db.exec(select(Patient)).all()
    result = []
    for p in patients:
        u = p.user
        if not u:
            continue
        # Get last message for preview
        last_msg = db.exec(
            select(ChatMessage)
            .where(ChatMessage.consultation_id == p.id)
            .order_by(ChatMessage.created_at.desc())
        ).first()
        result.append({
            "patient_id": p.id,
            "patient_name": u.full_name,
            "last_message": last_msg.message if last_msg else None,
            "last_timestamp": last_msg.created_at.isoformat() if last_msg else None,
        })

    # Sort: patients with messages first, then by last message time
    result.sort(key=lambda x: x["last_timestamp"] or "", reverse=True)
    return result


# ─────────────────────────────────────────────
# LEGACY ENDPOINTS (kept for backward compat)
# ─────────────────────────────────────────────

@router.get("/active-rooms")
def get_active_chat_rooms(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Redirect to /patients/list"""
    return list_patients_for_chat(db, current_user)


@router.get("/chats/history/{consultation_id}", response_model=List[ChatMessageSchema])
def get_chat_history(
    consultation_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Legacy history endpoint — consultation_id == patient_id in unified model."""
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient or patient.id != consultation_id:
            raise HTTPException(status_code=403, detail="Access Denied")
    elif current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN, UserRole.NURSE]:
        raise HTTPException(status_code=403, detail="Access Denied")

    msgs = db.exec(
        select(ChatMessage)
        .where(ChatMessage.consultation_id == consultation_id)
        .order_by(ChatMessage.created_at.asc())
    ).all()
    return msgs


@router.post("/send", response_model=ChatMessageSchema)
def send_message_rest(
    message_in: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Legacy REST send — works with patient_id as consultation_id."""
    patient_id = (
        message_in.get("patient_id") or
        message_in.get("consultation_id") or
        message_in.get("consultationId")
    )
    if not patient_id:
        raise HTTPException(status_code=400, detail="patient_id required")

    patient_id = int(patient_id)

    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient or patient.id != patient_id:
            raise HTTPException(status_code=403, detail="Access Denied")

    text = message_in.get("message") or message_in.get("text") or ""
    sender_name = message_in.get("sender_name") or message_in.get("senderName") or current_user.full_name
    sender_role = message_in.get("sender_role") or message_in.get("senderRole") or str(current_user.role.value)

    msg = ChatMessage(
        consultation_id=patient_id,
        sender_name=sender_name,
        sender_role=sender_role,
        message=text,
        audio_url=message_in.get("audioUrl") or message_in.get("audio_url"),
        image_url=message_in.get("imageUrl") or message_in.get("image_url"),
        is_ai=False
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


# ─────────────────────────────────────────────
# WEBSOCKET - Room key = patient_id
# Both doctor and patient connect to the same room
# ─────────────────────────────────────────────

@router.websocket("/ws/patient/{patient_id}")
async def patient_room_ws(
    websocket: WebSocket,
    patient_id: str,
    role: str = Query("patient"),
    token: Optional[str] = Query(None)
):
    """
    Unified WebSocket room for a patient's chat thread.
    Both patient and doctor(s) connect here using patient_id as room.
    """
    room = f"p-{patient_id}"
    print(f"[WS] Connecting to patient room={room} role={role}")
    await manager.connect(websocket, room, role)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                user_text = payload.get("text", "")
                sender_name = payload.get("senderName") or ("Doctor" if role in ["doctor", "admin", "nurse"] else "Patient")
                audio_url = payload.get("audioUrl")
                image_url = payload.get("imageUrl")
                sender_role = payload.get("senderRole") or role
            except Exception:
                user_text = data
                sender_name = "Doctor" if role in ["doctor", "admin"] else "Patient"
                sender_role = role
                audio_url = None
                image_url = None

            # Broadcast to everyone else in this patient's room
            await manager.broadcast_to_others(data, room, websocket)

            # If message has content, save to DB (WS path for real-time only; REST is primary)
            # Note: REST /send is called first by frontend, so WS DB save is secondary
            # We skip DB save here to avoid duplicates — REST already saves it

    except WebSocketDisconnect:
        manager.disconnect(websocket, room)
        print(f"[WS] Disconnected from patient room={room}")
    except Exception as e:
        print(f"[WS] Error in patient room {room}: {e}")
        manager.disconnect(websocket, room)


# Legacy WS endpoint (keep alive for backward compat)
@router.websocket("/ws/consultations/{consultation_id}")
async def websocket_endpoint_legacy(
    websocket: WebSocket,
    consultation_id: str,
    role: str = Query("patient"),
    token: Optional[str] = Query(None)
):
    """Legacy WS — routes to the patient room using consultation_id as patient_id."""
    room = f"p-{consultation_id}"
    print(f"[WS] Legacy connect → patient room={room} role={role}")
    await manager.connect(websocket, room, role)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast_to_others(data, room, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room)
    except Exception as e:
        manager.disconnect(websocket, room)


@router.websocket("/ws/clinical_feed")
async def clinical_feed_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    feed_id = "clinical_feed"
    await websocket.accept()
    if feed_id not in manager.active_connections:
        manager.active_connections[feed_id] = []
    if not any(conn["ws"] == websocket for conn in manager.active_connections[feed_id]):
        manager.active_connections[feed_id].append({"ws": websocket, "role": "doctor"})
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if feed_id in manager.active_connections:
            manager.active_connections[feed_id] = [
                c for c in manager.active_connections[feed_id] if c["ws"] != websocket
            ]
    except Exception:
        if feed_id in manager.active_connections:
            manager.active_connections[feed_id] = [
                c for c in manager.active_connections[feed_id] if c["ws"] != websocket
            ]
