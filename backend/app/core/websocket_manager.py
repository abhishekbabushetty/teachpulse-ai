from fastapi import WebSocket
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Format: {session_id: {user_id: WebSocket}}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str, user_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = {}
        self.active_connections[session_id][user_id] = websocket
        logger.info(f"User {user_id} joined session {session_id}")
        await self.broadcast_active_users(session_id)

    async def disconnect(self, session_id: str, user_id: str):
        if session_id in self.active_connections:
            if user_id in self.active_connections[session_id]:
                del self.active_connections[session_id][user_id]
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
            else:
                await self.broadcast_active_users(session_id)
        logger.info(f"User {user_id} left session {session_id}")

    async def broadcast_active_users(self, session_id: str):
        count = sum(1 for u in self.active_connections.get(session_id, {}).keys() if u.startswith("student"))
        await self.broadcast_to_session(session_id, {
            "event": "student_count",
            "data": {"count": count}
        })

    async def broadcast_to_session(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            for user_id, connection in self.active_connections[session_id].items():
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to {user_id}: {e}")

manager = ConnectionManager()
