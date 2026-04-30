from pydantic import BaseModel, Field
from datetime import datetime


class CallCreate(BaseModel):
    receiver_id: int


class CallResponse(BaseModel):
    id: int
    room_id: str = Field(min_length=1, max_length=512)
    room_url: str = Field(min_length=1, max_length=2000)

    class Config:
        from_attributes = True


class CallJoinResponse(BaseModel):
    """Returned for GET /calls/{id}: only Daily room ids + caller's meeting token."""

    room_id: str = Field(min_length=1, max_length=512)
    room_url: str = Field(min_length=1, max_length=2000)
    token: str = Field(min_length=1, max_length=2000)


class Call(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    room_name: str | None = Field(default=None, max_length=512)
    room_url: str = Field(min_length=1, max_length=2000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
