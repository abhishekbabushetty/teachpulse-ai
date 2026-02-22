from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket_manager import manager
from app.services.emotion_service import emotion_pipeline
from app.services.engagement_service import calculate_engagement_score
from app.db.session import async_session_maker
from app.models.models import User, Session, Participant, EmotionLog
from sqlalchemy import select
import logging
import asyncio
import base64

router = APIRouter()
logger = logging.getLogger(__name__)

async def get_or_create_env(session_id_str: str, user_id_str: str) -> int:
    """Helper to ensure mock database records exist before inserting logs."""
    async with async_session_maker() as db:
        # Check for Session
        result = await db.execute(select(Session).where(Session.title == session_id_str))
        session_obj = result.scalars().first()
        if not session_obj:
            # Create dummy teacher
            teacher = User(name="Teacher", email="teacher@mock.com", role="teacher")
            db.add(teacher)
            await db.flush()
            session_obj = Session(title=session_id_str, teacher_id=teacher.id)
            db.add(session_obj)
            await db.flush()
            
        # Check for User
        result = await db.execute(select(User).where(User.name == user_id_str))
        user_obj = result.scalars().first()
        if not user_obj:
            user_obj = User(name=user_id_str, email=f"{user_id_str}@mock.com", role="student")
            db.add(user_obj)
            await db.flush()
            
        # Check for Participant
        result = await db.execute(select(Participant).where(Participant.session_id == session_obj.id, Participant.user_id == user_obj.id))
        participant_obj = result.scalars().first()
        if not participant_obj:
            participant_obj = Participant(session_id=session_obj.id, user_id=user_obj.id)
            db.add(participant_obj)
            await db.flush()
            
        await db.commit()
        return participant_obj.id

@router.websocket("/session/{session_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, user_id: str):
    await manager.connect(websocket, session_id, user_id)
    try:
        # In a real app, auth is done during handshake. For MVP, ensure mock env:
        # We only do this if it's a student sending data
        participant_id_db = None
        if user_id.startswith("student"):
            participant_id_db = await get_or_create_env(session_id, user_id)

        while True:
            # Receive binary frame from client
            data = await websocket.receive_bytes()
            
            # Process via CV / Emotion pipeline
            result = await emotion_pipeline.process_frame(data)
            
            # Calculate Engagement Metric
            engagement = calculate_engagement_score(
                face_detected=result.get("face_detected", False),
                eye_focus=result.get("eye_focus", False),
                emotion=result.get("emotion", "neutral")
            )
            
            result["engagement_score"] = engagement
            result["participant_id"] = user_id
            
            # Broadcast the updated metric payload to everyone in the session (e.g., teacher dashboard)
            image_b64 = base64.b64encode(data).decode('utf-8')
            payload = {
                "event": "emotion_update",
                "data": result,
                "image": image_b64
            }
            
            await manager.broadcast_to_session(session_id, payload)
            
            # Insert into PostgreSQL if it's a student stream
            if participant_id_db is not None:
                # Fire and forget async task so we don't block the next frame
                async def save_log(p_id, em, conf, eng):
                    async with async_session_maker() as db:
                        log = EmotionLog(
                            participant_id=p_id,
                            emotion=em,
                            confidence=conf,
                            engagement_score=eng
                        )
                        db.add(log)
                        await db.commit()
                
                asyncio.create_task(save_log(
                    participant_id_db,
                    result.get("emotion", "neutral"),
                    result.get("confidence", 0.0),
                    engagement
                ))
            
    except WebSocketDisconnect:
        await manager.disconnect(session_id, user_id)
