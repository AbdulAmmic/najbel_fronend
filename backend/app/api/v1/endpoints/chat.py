from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.websockets import manager
from app.api import deps
from app.models.chat import ChatMessage
from app.schemas.chat import ChatMessage as ChatMessageSchema
from typing import List, Any

router = APIRouter()

from app.services.ai_chat import ai_chat_service
import json

@router.get("/chats/history/{consultation_id}", response_model=List[ChatMessageSchema])
def get_chat_history(
    consultation_id: int,
    db: Session = Depends(deps.get_db),
    # current_user: models.User = Depends(deps.get_current_active_user) # Optional security
):
    """
    Retrieve chat history for a consultation
    """
    from sqlmodel import select
    statement = select(ChatMessage).where(ChatMessage.consultation_id == consultation_id).order_by(ChatMessage.created_at.asc())
    results = db.exec(statement).all()
    return results

@router.websocket("/ws/consultations/{consultation_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    consultation_id: str, 
    role: str = Query("patient")
):
    from app.db.session import engine
    from sqlmodel import Session

    await manager.connect(websocket, consultation_id, role)
    print(f"[WS] HANDSHAKE: Room={consultation_id}, Role={role}")
    
    try:
        while True:
            data = await websocket.receive_text()
            print(f"[WS] DATA RECEIVED: Room={consultation_id}, Sender={role}, Raw={data[:30]}...")
            
            # --- Parse incoming message ---
            try:
                payload = json.loads(data)
                user_text = payload.get("text", "")
                sender_name = payload.get("senderName", "Patient")
                audio_url = payload.get("audioUrl", None)
                image_url = payload.get("imageUrl", None)
                is_ai_assisted = payload.get("isAiAssisted", False)
            except:
                user_text = data
                sender_name = "Patient" if role == "patient" else "Doctor"
                audio_url = None
                image_url = None
                is_ai_assisted = False

            # Save if there is any content (text, audio, or image)
            if user_text or audio_url or image_url:
                # Persist to DB using a fresh session per operation
                saved_msg_id = None
                try:
                    with Session(engine) as session:
                        user_msg = ChatMessage(
                            consultation_id=int(consultation_id),
                            sender_name=sender_name,
                            sender_role=role,
                            message=user_text or "",
                            audio_url=audio_url,
                            image_url=image_url,
                            is_ai=False,
                            is_ai_assisted=is_ai_assisted
                        )
                        session.add(user_msg)
                        session.commit()
                        session.refresh(user_msg)
                        saved_msg_id = user_msg.id

                        # ---- Notifications Logic ----
                        try:
                            from sqlmodel import select
                            from app.models.user import User
                            from app.models.patient import Patient
                            from app.models.notification import Notification, NotificationType
                            from app.core.email import send_email_background, generate_chat_notification_email
                            
                            # Important: consultation_id is actually strictly mapped to the Patient ID natively under the unified model.
                            patient_record = session.exec(select(Patient).where(Patient.id == int(consultation_id))).first()
                            if patient_record:
                                if (role == "doctor" or role == "admin") and not manager.is_patient_online(str(consultation_id)):
                                    patient_user = session.exec(select(User).where(User.id == patient_record.user_id)).first()
                                    if patient_user:
                                        notif = Notification(
                                            user_id=patient_user.id,
                                            title=f"New Message from {sender_name}",
                                            message="Your doctor has sent you a new message.",
                                            type=NotificationType.CHAT
                                        )
                                        session.add(notif)
                                        preview = user_msg.message[:50] + ("..." if len(user_msg.message) > 50 else "")
                                        body = generate_chat_notification_email(patient_user.full_name, sender_name, preview, "http://localhost:3000/dashboard/patient/chat")
                                        send_email_background(patient_user.email, f"New Message from {sender_name}", body)
                                        
                                elif role == "patient" and not manager.is_doctor_online(str(consultation_id)):
                                    # Optional: Global alert for new patient messages
                                    # E.g. notify admins or primary doctors
                                    pass
                                    
                                session.commit()
                        except Exception as ne:
                            print(f"Error handling offline notifications: {ne}")

                except Exception as e:

                    print(f"Error saving user message: {e}")

                # Build broadcast payload with the saved DB id
                broadcast_payload = {
                    "id": saved_msg_id,
                    "senderName": sender_name,
                    "senderRole": role,
                    "text": user_text or "",
                    "isAiAssisted": is_ai_assisted,
                    "isAI": False
                }
                if audio_url:
                    broadcast_payload["audioUrl"] = audio_url
                if image_url:
                    broadcast_payload["imageUrl"] = image_url

                # Send full message to OTHER participants only (sender already has it)
                print(f"[WS] BROADCASTING: Room={consultation_id}, Content='{user_text[:20]}...'")
                await manager.broadcast_to_others(json.dumps(broadcast_payload), consultation_id, websocket)

                # Send lightweight confirmation back to sender with the DB id
                await websocket.send_text(json.dumps({
                    "type": "ack",
                    "tempId": None,
                    "id": saved_msg_id
                }))
            
                # --- AI Response Logic ---
                if role == "patient" and not manager.is_doctor_online(consultation_id) and user_text:
                    # Broadcast "typing" status
                    typing_payload = {"type": "typing", "senderName": "AI Assistant"}
                    await manager.broadcast(json.dumps(typing_payload), consultation_id)

                    ai_response_text = ai_chat_service.generate_response(user_text)
                    
                    # Persist AI Message
                    try:
                        with Session(engine) as session:
                            ai_msg = ChatMessage(
                                consultation_id=int(consultation_id),
                                sender_name="AI Assistant",
                                sender_role="ai",
                                message=ai_response_text,
                                is_ai=True
                            )
                            session.add(ai_msg)
                            session.commit()
                    except Exception as e:
                        print(f"Error saving AI message: {e}")

                    # Construct response payload
                    response_payload = {
                        "senderName": "AI Assistant",
                        "text": ai_response_text,
                        "is_ai": True
                    }
                    await manager.broadcast(json.dumps(response_payload), consultation_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, consultation_id)
