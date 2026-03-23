from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.users import UserResponse


class MessageBase(BaseModel):
  content: str = Field(min_length=1, max_length=2000)


class MessageCreate(MessageBase):
  receiver_id: int


class MessageResponse(MessageBase):
  id: int
  sender_id: int
  receiver_id: int
  created_at: datetime

  class Config:
    from_attributes = True


class ConversationResponse(BaseModel):
  user: UserResponse
  last_message: MessageResponse