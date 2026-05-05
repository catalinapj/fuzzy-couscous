from sqlalchemy import Column, ForeignKey, Integer, String
from app.models.base import BaseModel

class Call(BaseModel):
    __tablename__ = "calls"

    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    room_name = Column(String(512), nullable=True)
    room_url = Column(String(2000), nullable=False)
