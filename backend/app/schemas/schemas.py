from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    name: str
    email: str
    role: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class SessionBase(BaseModel):
    title: str

class SessionCreate(SessionBase):
    teacher_id: int

class SessionResponse(SessionBase):
    id: int
    teacher_id: int
    started_at: datetime
    ended_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)

class EmotionLogBase(BaseModel):
    participant_id: int
    emotion: str
    confidence: float
    engagement_score: float

class EmotionLogCreate(EmotionLogBase):
    pass

class MetricResponse(BaseModel):
    id: int
    session_id: int
    timestamp: datetime
    avg_engagement: float
    confusion_ratio: float
    fatigue_ratio: float
    dominant_emotion: str
    
    model_config = ConfigDict(from_attributes=True)
