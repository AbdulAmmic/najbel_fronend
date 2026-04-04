from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.core.websockets import manager
from app.api import deps
from app.models.chat import ChatMessage
from app.models.user import User, UserRole, Patient
from app.schemas.chat import ChatMessage as ChatMessageSchema
from typing import List, Any

router = APIRouter()

from app.services.ai_chat import ai_chat_service
import json

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
            print(f"[WS] DATA RECEIVED: Room={consultation_id}, Sender={role}, Raw={data[:50]}...")

            
            try:
                payload = json.loads(data)
                user_text = payload.get("text", "")
                # Prioritize payload senderName, fallback to role default
                sender_name = payload.get("senderName") or ("Doctor" if role in ["doctor", "admin"] else "Patient")
                audio_url = payload.get("audioUrl", None)
                image_url = payload.get("imageUrl", None)
                is_ai_assisted = payload.get("isAiAssisted", False)
            except Exception as pe:
                print(f"[WS] PARSE ERROR: {pe}")
                user_text = data
                sender_name = "Doctor" if role in ["doctor", "admin"] else "Patient"
                audio_url = None
                image_url = None
                # Extract data safely with logging
                user_text = data.get("text")
                audio_url = data.get("audioUrl") 
                image_url = data.get("imageUrl")
                sender_name = data.get("senderName", "Unknown")
                role = data.get("senderRole", "patient") # Default to patient for safety
                is_ai_assisted = data.get("isAiAssisted", False)

                print(f"[CHAT] Message received room={consultation_id} role={role} text={bool(user_text)} img={bool(image_url)} audio={bool(audio_url)}")

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
                        print(f"[CHAT] Message persisted ID={saved_msg_id}")

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
                    "isAI": False,
                    "createdAt": None # Will be handled by receiver's local time if needed
                }
                if audio_url:
                    broadcast_payload["audioUrl"] = audio_url
                if image_url:
                    broadcast_payload["imageUrl"] = image_url

                # Send full message to OTHER participants only (sender already has it)
                print(f"[WS] BROADCASTING: Room={consultation_id}, ID={saved_msg_id}, Content='{user_text[:20]}...'")
                await manager.broadcast_to_others(json.dumps(broadcast_payload), consultation_id, websocket)

                # Send ack back to sender with the real DB id
                await websocket.send_text(json.dumps({
                    "type": "ack",
                    "id": saved_msg_id,
                    "status": "delivered"
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
