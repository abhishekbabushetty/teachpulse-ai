from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "TeachPulse-AI"
    API_V1_STR: str = "/api/v1"
    
    # Updated for local setup
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres123@localhost:5432/teachpulse_ai"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    class Config:
        case_sensitive = True

settings = Settings()
