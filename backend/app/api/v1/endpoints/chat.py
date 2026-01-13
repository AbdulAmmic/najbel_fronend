from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.core.websockets import manager
from typing import Any

router = APIRouter()

@router.websocket("/ws/consultations/{consultation_id}")
async def websocket_endpoint(websocket: WebSocket, consultation_id: str):
    await manager.connect(websocket, consultation_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Simple echo/broadcast to the room
            await manager.broadcast(data, consultation_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, consultation_id)
        # Optional: Broadcast that user left
        # await manager.broadcast(f"User left chat", consultation_id)
