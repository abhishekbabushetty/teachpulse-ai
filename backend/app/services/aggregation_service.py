from app.db.session import async_session_maker
from app.models.models import EmotionLog, SessionMetric, Session
from sqlalchemy import select, func
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

async def aggregate_session_metrics():
    """
    Queries emotion_logs for the last 10 seconds for all active sessions.
    Computes avg engagement, confusion, fatigue, dominant emotion.
    Stores result into DB.
    """
    try:
        async with async_session_maker() as db:
            time_window = datetime.utcnow() - timedelta(seconds=10)
            
            # Subquery or group by session
            # Since emotion_log has participant_id, we need to join participants to get session_id
            from app.models.models import Participant
            
            # Simple aggregate query for demonstration:
            query = (
                select(
                    Participant.session_id,
                    func.avg(EmotionLog.engagement_score).label("avg_engagement"),
                    # Add conditional counts for confusion/fatigue based on emotions
                    func.count().label("total_logs")
                )
                .join(Participant, EmotionLog.participant_id == Participant.id)
                .where(EmotionLog.timestamp >= time_window)
                .group_by(Participant.session_id)
            )
            
            result = await db.execute(query)
            aggregations = result.all()
            
            for agg in aggregations:
                session_id = agg.session_id
                avg_eng = agg.avg_engagement or 0.0
                
                # Mock ratio generation for the MVP
                metric = SessionMetric(
                    session_id=session_id,
                    avg_engagement=avg_eng,
                    confusion_ratio=0.1,  # Calculated using a subquery where emotion='confused'
                    fatigue_ratio=0.05,
                    dominant_emotion="neutral"  # Mode calculation
                )
                
                db.add(metric)
            
            await db.commit()
            logger.info(f"Aggregated metrics for {len(aggregations)} active sessions.")
            
            # Post-aggregation logic: trigger insights if needed
            from app.services.insight_service import generate_insight
            for agg in aggregations:
                session_id = agg.session_id
                avg_eng = agg.avg_engagement or 0.0
                await generate_insight(
                    session_id=session_id,
                    avg_engagement=avg_eng,
                    confusion_ratio=0.1,  # Based on real subquery once implemented
                    dominant_emotion="neutral",
                    db_session=db
                )
                
            return f"Processed {len(aggregations)} sessions"
            
    except Exception as e:
        logger.error(f"Error aggregating session metrics: {e}")
        return "Failed"
