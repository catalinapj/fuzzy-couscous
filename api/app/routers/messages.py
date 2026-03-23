from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, and_, case, func
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.security import get_current_user
from app.database import get_db

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("/", response_model=schemas.MessageResponse)
def create_message(
    message: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_message = models.Message(
        sender_id=current_user.id,
        receiver_id=message.receiver_id,
        content=message.content,
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


@router.get("/conversations", response_model=list[schemas.ConversationResponse])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    partner_id = case(
        (models.Message.sender_id == current_user.id, models.Message.receiver_id),
        else_=models.Message.sender_id,
    )

    latest_per_partner = (
        db.query(
            partner_id.label("partner_id"),
            func.max(models.Message.id).label("last_message_id"),
        )
        .filter(
            or_(
                models.Message.sender_id == current_user.id,
                models.Message.receiver_id == current_user.id,
            )
        )
        .group_by("partner_id")
        .subquery()
    )

    rows = (
        db.query(models.User, models.Message)
        .join(latest_per_partner, models.User.id == latest_per_partner.c.partner_id)
        .join(models.Message, models.Message.id == latest_per_partner.c.last_message_id)
        .order_by(models.Message.created_at.desc(), models.Message.id.desc())
        .all()
    )

    return [{"user": user, "last_message": message} for user, message in rows]


@router.get("/conversation/{user_id}", response_model=list[schemas.MessageResponse])
def get_conversation(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    messages = (
        db.query(models.Message)
        .filter(
            or_(
                and_(
                    models.Message.sender_id == current_user.id,
                    models.Message.receiver_id == user_id,
                ),
                and_(
                    models.Message.sender_id == user_id,
                    models.Message.receiver_id == current_user.id,
                ),
            )
        )
        .order_by(models.Message.created_at.asc())
        .all()
    )
    return messages

