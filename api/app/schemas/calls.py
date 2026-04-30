from pydantic import BaseModel, Field
from datetime import datetime

class CallCreate(BaseModel):
  receiver_id: int

class CallResponse(BaseModel):
  room_url: str = Field(min_length=1, max_length=2000)
  user_token: str = Field(min_length=1, max_length=2000)
  target_token: str = Field(min_length=1, max_length=2000)

class Call(BaseModel):
  id: int
  sender_id: int
  receiver_id: int
  room_url: str = Field(min_length=1, max_length=2000)
  user_token: str = Field(min_length=1, max_length=2000)
  target_token: str = Field(min_length=1, max_length=2000)
  created_at: datetime = Field(default_factory=datetime.utcnow)
  updated_at: datetime = Field(default_factory=datetime.utcnow)
