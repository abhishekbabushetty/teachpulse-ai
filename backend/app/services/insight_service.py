import os
import requests
import logging
from app.models.models import Insight
from app.core.websocket_manager import manager

logger = logging.getLogger(__name__)

HF_API_KEY = os.environ.get("HF_API_KEY", "")
# Using Mistral 7B Instruct v0.2 endpoint
API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"

async def generate_insight(session_id: int, avg_engagement: float, confusion_ratio: float, dominant_emotion: str, db_session):
    """
    Generates a teaching intervention if metrics indicate the class is struggling.
    Stores it in Postgres, and broadcasts the insight to the teacher.
    """
    
    # Simple threshold rules to avoid over-pinging Mistral
    if avg_engagement > 60.0 and confusion_ratio < 0.2:
        return
        
    prompt = f"""[INST] You are an expert teaching assistant observing a real-time virtual classroom.
Based on the current metrics, give a ONE SENTENCE actionable instruction to the teacher to improve the situation.
Input:
Confusion: {confusion_ratio * 100:.1f}%
Engagement: {avg_engagement:.1f}%
Dominant emotion: {dominant_emotion}
[/INST]
"""
    
    headers = {"Authorization": f"Bearer {HF_API_KEY}"} if HF_API_KEY else {}
    
    try:
        if HF_API_KEY:
            response = requests.post(API_URL, headers=headers, json={"inputs": prompt, "parameters": {"max_new_tokens": 50}})
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                suggestion = result[0].get("generated_text", "").split("[/INST]")[-1].strip()
            else:
                suggestion = "Consider pausing to ask if everyone is following."
        else:
            # Local fallback mock if no HF API key is provided
            logger.warning("No HF_API_KEY provided. Using local heuristic insights.")
            if confusion_ratio > 0.3:
                suggestion = "High confusion detected. Pause and ask a concept-checking question."
            elif dominant_emotion == "sad" or dominant_emotion == "fatigued":
                suggestion = "Energy is low. Try a quick 2-minute breakout or interactive poll."
            else:
                suggestion = "Engagement dropping. Call on a student randomly to snap attention back."
        
        # Save to DB
        insight = Insight(session_id=session_id, message=suggestion)
        db_session.add(insight)
        await db_session.commit()
        
        # Broadcast via WebSocket (Manager needs to route to session str id. In DB it's int.)
        await manager.broadcast_to_session(str(session_id), {
            "event": "new_insight",
            "data": {
                "message": suggestion
            }
        })
        
        logger.info(f"Insight generated for session {session_id}: {suggestion}")
        
    except Exception as e:
        logger.error(f"Failed to generate insight: {e}")
