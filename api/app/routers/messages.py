from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.security import get_current_user
from app.database import get_db

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("/", response_model=schemas.MessageResponse)
def create_message(message: schemas.MessageCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_message = models.Message(sender_id=current_user.id, receiver_id=message.receiver_id, content=message.content)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


@router.get("/", response_model=list[schemas.MessageResponse])
def list_messages(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    messages = db.query(models.Message).filter(models.Message.sender_id == current_user.id).all()
    return messages

