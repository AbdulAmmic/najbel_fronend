from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
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
    role: str = "patient"
):
    from app.db.session import engine
    from sqlmodel import Session

    await manager.connect(websocket, consultation_id, role)
    try:
        while True:
            data = await websocket.receive_text()
            
            # --- Parse incoming message ---
            try:
                payload = json.loads(data)
                user_text = payload.get("text", "")
                sender_name = payload.get("senderName", "Patient")
                audio_url = payload.get("audioUrl", None)
                image_url = payload.get("imageUrl", None)
            except:
                user_text = data
                sender_name = "Patient" if role == "patient" else "Doctor"
                audio_url = None
                image_url = None

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
                            is_ai=False
                        )
                        session.add(user_msg)
                        session.commit()
                        session.refresh(user_msg)
                        saved_msg_id = user_msg.id
                except Exception as e:
                    print(f"Error saving user message: {e}")

                # Build broadcast payload with the saved DB id
                broadcast_payload = {
                    "id": saved_msg_id,
                    "senderName": sender_name,
                    "text": user_text or "",
                }
                if audio_url:
                    broadcast_payload["audioUrl"] = audio_url
                if image_url:
                    broadcast_payload["imageUrl"] = image_url

                # Send full message to OTHER participants only (sender already has it)
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
