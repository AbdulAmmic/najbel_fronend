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
@router.get("/active-rooms")
def get_active_chat_rooms(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    List all consultations that have chat messages or are active sessions (Staff only).
    Returns the SAME consultation_id the patient is connected to.
    """
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN, UserRole.NURSE]:
        raise HTTPException(status_code=403, detail="Not authorized")

    from app.models.consultation import Consultation
    from app.models.appointment import Appointment, AppointmentStatus

    # Get consultations that have ANY chat messages OR are in an active state
    # This ensures doctor always joins the same room as the patient
    consultations_with_msgs = db.exec(
        select(ChatMessage.consultation_id).distinct()
    ).all()

    # Also include consultations for IN_CONSULTATION or recent COMPLETED appointments
    active_consultations = db.exec(
        select(Consultation)
        .join(Appointment, Consultation.appointment_id == Appointment.id, isouter=True)
        .where(
            (Consultation.id.in_(consultations_with_msgs)) |
            (Appointment.status.in_([
                AppointmentStatus.IN_CONSULTATION,
                AppointmentStatus.COMPLETED
            ]))
        )
        .order_by(Consultation.created_at.desc())
    ).all()

    result = []
    seen = set()
    for c in active_consultations:
        if c.id in seen:
            continue
        seen.add(c.id)
        # Get patient name
        patient = db.exec(
            select(Patient, User)
            .where(Patient.id == c.patient_id)
            .join(User, Patient.user_id == User.id)
        ).first()
        if not patient:
            continue
        p, u = patient
        result.append({
            "consultation_id": c.id,
            "patient_id": p.id,
            "patient_name": u.full_name,
            "created_at": c.created_at.isoformat()
        })

    return result

@router.get("/chats/history/{consultation_id}", response_model=List[ChatMessageSchema])
def get_chat_history(
    consultation_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieve chat history for a consultation with RBAC
    """
    # RBAC logic
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        
        # Check if the requested consultation belongs to this patient
        from app.models.consultation import Consultation
        consultation = db.get(Consultation, consultation_id)
        if not consultation or consultation.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Access Denied: You can only view your own consultations.")
    elif current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Access Denied: Insufficient permissions.")

    statement = select(ChatMessage).where(ChatMessage.consultation_id == consultation_id).order_by(ChatMessage.created_at.asc())
    results = db.exec(statement).all()
    return results

@router.post("/send", response_model=ChatMessageSchema)
def send_message_rest(
    message_in: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    REST Fallback for sending messages when WebSockets are unavailable.
    Accepts both snake_case and camelCase field names for compatibility.
    """
    # Accept both naming conventions
    consultation_id = message_in.get("consultation_id") or message_in.get("consultationId")
    if not consultation_id:
        raise HTTPException(status_code=400, detail="consultation_id required")

    consultation_id = int(consultation_id)

    # RBAC: Patients can only send to their own consultations
    if current_user.role == UserRole.PATIENT:
        from app.models.consultation import Consultation
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient:
            raise HTTPException(status_code=403, detail="Patient profile not found")
        consultation = db.get(Consultation, consultation_id)
        if not consultation or consultation.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Access Denied")

    # Accept both 'message' and 'text' field names
    text = message_in.get("message") or message_in.get("text") or ""
    sender_name = message_in.get("sender_name") or message_in.get("senderName") or current_user.full_name
    sender_role = message_in.get("sender_role") or message_in.get("senderRole") or str(current_user.role)

    user_msg = ChatMessage(
        consultation_id=consultation_id,
        sender_name=sender_name,
        sender_role=sender_role,
        message=text,
        audio_url=message_in.get("audioUrl") or message_in.get("audio_url"),
        image_url=message_in.get("imageUrl") or message_in.get("image_url"),
        is_ai=False
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    return user_msg

@router.websocket("/ws/consultations/{consultation_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    consultation_id: str, 
    role: str = Query("patient"),
    token: Optional[str] = Query(None) # Allow token without failing
):
    from app.db.session import engine
    from sqlmodel import Session

    print(f"[WS] Connection accepted for room={consultation_id} role={role}")
    print(f"[WS] Active DB Strategy: {settings.DATABASE_URL[:30]}...")
    
    await manager.connect(websocket, consultation_id, role)
    
    try:
        while True:
            data = await websocket.receive_text()
            print(f"[WS] RAW RECEIVED: {data[:100]}...")
            
            try:
                payload = json.loads(data)
                user_text = payload.get("text", "")
                sender_name = payload.get("senderName") or ("Doctor" if role in ["doctor", "admin"] else "Patient")
                audio_url = payload.get("audioUrl", None)
                image_url = payload.get("imageUrl", None)
                sender_role = payload.get("senderRole") or role
                is_ai_assisted = payload.get("isAiAssisted", False)
                print(f"[WS] PARSED: text='{user_text[:20]}' role={sender_role} audio={bool(audio_url)} image={bool(image_url)}")
            except Exception as pe:
                print(f"[WS] JSON PARSE FAIL: {pe}. Using raw data as text.")
                user_text = data
                sender_name = "Doctor" if role in ["doctor", "admin"] else "Patient"
                sender_role = role
                audio_url = None
                image_url = None
                is_ai_assisted = False

            # 1. Broadcast to others in the room
            print(f"[WS] Broadcasting to others in room {consultation_id}...")
            await manager.broadcast_to_others(data, consultation_id, websocket)

            # 2. If sender is a patient, broadcast to ALL doctors via clinical_feed
            # Enrich payload with consultationId so doctor dashboards know which room to update
            if role == "patient":
                print(f"[WS] Broadcasting to clinical_feed (All Doctors)...")
                enriched = json.dumps({
                    "consultationId": consultation_id,
                    "text": user_text,
                    "senderName": sender_name,
                    "senderRole": sender_role,
                    "audioUrl": audio_url,
                    "imageUrl": image_url,
                    "type": "patient_message"
                })
                await manager.broadcast_to_doctors(enriched)

            # 3. Persist to DB
            if user_text or audio_url or image_url:
                print(f"[WS] Attempting DB persistence...")
                try:
                    with Session(engine) as session:
                        user_msg = ChatMessage(
                            consultation_id=int(consultation_id),
                            sender_name=sender_name,
                            sender_role=sender_role,
                            message=user_text or "",
                            audio_url=audio_url,
                            image_url=image_url,
                            is_ai=False,
                            is_ai_assisted=is_ai_assisted
                        )
                        session.add(user_msg)
                        session.commit()
                        session.refresh(user_msg)
                        print(f"[WS] DB SUCCESS: Saved ID={user_msg.id}")
                        
                        # 4. Send ACK to sender
                        await websocket.send_json({
                            "type": "ack",
                            "id": user_msg.id,
                            "status": "sent"
                        })
                except Exception as dbe:
                    print(f"[WS] DB EXCEPTION: {dbe}")
                    traceback.print_exc()
            else:
                print(f"[WS] No content to save.")

    except WebSocketDisconnect:
        manager.disconnect(websocket, consultation_id)
        print(f"[WS] Disconnected room={consultation_id}")
    except Exception as e:
        print(f"[WS] CRITICAL ERROR in loop: {e}")
        traceback.print_exc()
        manager.disconnect(websocket, consultation_id)


@router.websocket("/ws/clinical_feed")
async def clinical_feed_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """
    Dedicated WebSocket for doctors/staff to receive ALL patient messages in real-time.
    Doctors connect here and get notified whenever ANY patient sends a message.
    """
    print("[WS] Doctor connecting to clinical_feed")
    # Register in clinical_feed so they get patient broadcasts
    feed_id = "clinical_feed"
    await websocket.accept()
    if feed_id not in manager.active_connections:
        manager.active_connections[feed_id] = []
    if not any(conn["ws"] == websocket for conn in manager.active_connections[feed_id]):
        manager.active_connections[feed_id].append({"ws": websocket, "role": "doctor"})

    try:
        while True:
            # Keep connection alive - doctors only listen on this channel
            await websocket.receive_text()
    except WebSocketDisconnect:
        if feed_id in manager.active_connections:
            manager.active_connections[feed_id] = [
                c for c in manager.active_connections[feed_id] if c["ws"] != websocket
            ]
        print("[WS] Doctor disconnected from clinical_feed")
    except Exception as e:
        print(f"[WS] clinical_feed error: {e}")
        if feed_id in manager.active_connections:
            manager.active_connections[feed_id] = [
                c for c in manager.active_connections[feed_id] if c["ws"] != websocket
            ]
