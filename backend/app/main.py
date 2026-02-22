from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router as api_router
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

from app.db.session import engine
from app.models.base import Base
from app.models import models  # Ensure models are imported for metadata generation

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up TeachPulse-AI API")
    async with engine.begin() as conn:
        # For local MVP development, create all tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)
