from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.core.websockets import manager
from app.api import deps
from app.models.chat import ChatMessage
from app.models.user import User, UserRole, Patient
from app.schemas.chat import ChatMessage as ChatMessageSchema
from app.core.config import settings
from typing import List, Any
import json
import traceback

router = APIRouter()

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
        if not patient or consultation_id != patient.id:
            raise HTTPException(status_code=403, detail="Access Denied: You can only view your own chat history.")
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
    """
    consultation_id = message_in.get("consultationId")
    if not consultation_id:
        raise HTTPException(status_code=400, detail="consultationId required")
    
    # RBAC: Same as history
    if current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient or int(consultation_id) != patient.id:
            raise HTTPException(status_code=403, detail="Access Denied")
            
    user_msg = ChatMessage(
        consultation_id=int(consultation_id),
        sender_name=message_in.get("senderName", current_user.full_name),
        sender_role=message_in.get("senderRole", current_user.role),
        message=message_in.get("text", ""),
        audio_url=message_in.get("audioUrl"),
        image_url=message_in.get("imageUrl"),
        is_ai=False
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)
    
    # Broadcast to anyone connected via WebSocket
    try:
        import asyncio
        import json
        payload = {
            "id": user_msg.id,
            "message": user_msg.message,
            "senderName": user_msg.sender_name,
            "senderRole": user_msg.sender_role,
            "audioUrl": user_msg.audio_url,
            "imageUrl": user_msg.image_url,
            "created_at": user_msg.created_at.isoformat()
        }
        # We need a bridge between sync and async to broadcast
        # For now, we'll just rely on the recipient polling or connecting later
        # But we can try to call manager's broadcast (requires async)
    except Exception:
        pass
        
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
                print(f"[WS] PARSED: text='{user_text[:20]}...' role={sender_role}")
            except Exception as pe:
                print(f"[WS] JSON PARSE FAIL: {pe}. Using raw data as text.")
                user_text = data
                sender_name = "Doctor" if role in ["doctor", "admin"] else "Patient"
                sender_role = role
                audio_url = None
                image_url = None
                is_ai_assisted = False

            # 1. Broadcast to others immediately
            print(f"[WS] Broadcasting to others...")
            await manager.broadcast_to_others(data, consultation_id, websocket)

            # 2. Persist to DB
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
                        
                        # 3. Send ACK to sender
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
