from fastapi import APIRouter
from app.api.endpoints import session, websocket

router = APIRouter()

router.include_router(session.router, prefix="/session", tags=["session"])
router.include_router(websocket.router, prefix="/ws", tags=["websocket"])
