import os
from celery import Celery
from celery.schedules import crontab
from datetime import timedelta
from app.services.aggregation_service import aggregate_session_metrics

celery_app = Celery(
    "teachpulse_worker",
    broker=os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")
)

# Optional settings if using UTC
celery_app.conf.timezone = 'UTC'

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Runs the aggregation task every 10 seconds per blueprint
    sender.add_periodic_task(10.0, aggregate_metrics_task.s(), name='aggregate_metrics_every_10s')

@celery_app.task
def aggregate_metrics_task():
    # Because Celery tasks are synchronous by design, we wrap the async DB call inside an asyncio event loop
    import asyncio
    
    # We don't want to run asyncio.run() if the loop is already running, 
    # but in a standard celery worker it won't be.
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    result = loop.run_until_complete(aggregate_session_metrics())
    return result
