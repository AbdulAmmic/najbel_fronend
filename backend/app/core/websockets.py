from typing import List, Dict, Any
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Map room_id to list of active connections (tuples of WebSocket, role)
        self.active_connections: Dict[str, List[Dict[str, Any]]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, role: str = "patient"):
        room_id = str(room_id)
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append({"ws": websocket, "role": role})

    def disconnect(self, websocket: WebSocket, room_id: str):
        room_id = str(room_id)
        if room_id in self.active_connections:
            # Filter out the connection
            self.active_connections[room_id] = [
                conn for conn in self.active_connections[room_id] 
                if conn["ws"] != websocket
            ]
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, message: str, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection["ws"].send_text(message)

    async def broadcast_to_others(self, message: str, room_id: str, sender: WebSocket):
        """Broadcast to all connections in the room EXCEPT the sender."""
        room_id = str(room_id)
        if room_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[room_id]:
                if connection["ws"] != sender:
                    try:
                        await connection["ws"].send_text(message)
                    except Exception as e:
                        print(f"[WS] Broadcast failed for {connection.get('role')}: {e}")
                        dead_connections.append(connection)
            
            # Cleanup
            for dead in dead_connections:
                self.active_connections[room_id].remove(dead)

    def is_doctor_online(self, room_id: str) -> bool:
        room_id = str(room_id)
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if connection["role"] in ["doctor", "admin", "super_admin"]:
                    return True
        return False

    def is_patient_online(self, room_id: str) -> bool:
        room_id = str(room_id)
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if connection["role"] == "patient":
                    return True
        return False
    
    # Keep old global broadcast for backward compatibility if needed, or remove
    async def global_broadcast(self, message: str):
        # Flatten all lists
        for room in self.active_connections.values():
            for connection in room:
                await connection["ws"].send_text(message)

manager = ConnectionManager()
