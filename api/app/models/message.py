from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, Text
from app.models.base import BaseModel

class Message(BaseModel):
    __tablename__ = "messages"

    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)