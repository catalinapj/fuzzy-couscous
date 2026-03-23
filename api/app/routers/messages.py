from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, and_, case, func
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.security import get_current_user
from app.database import get_db
from app.routers.ws import manager

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("/", response_model=schemas.MessageResponse)
async def create_message(
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

    await manager.send_json(message.receiver_id, {
        "type": "new_message",
        "message": {
            "id": db_message.id,
            "sender_id": db_message.sender_id,
            "receiver_id": db_message.receiver_id,
            "content": db_message.content,
            "created_at": db_message.created_at.isoformat(),
        },
    })

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

    unread_counts = dict(
        db.query(models.Message.sender_id, func.count(models.Message.id))
        .filter(
            models.Message.receiver_id == current_user.id,
            models.Message.is_read == False,
        )
        .group_by(models.Message.sender_id)
        .all()
    )

    return [
        {
            "user": user,
            "last_message": message,
            "unread_count": unread_counts.get(user.id, 0),
        }
        for user, message in rows
    ]


@router.get("/conversation/{user_id}", response_model=schemas.PaginatedMessagesResponse)
def get_conversation(
    user_id: int,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    both_directions = or_(
        and_(
            models.Message.sender_id == current_user.id,
            models.Message.receiver_id == user_id,
        ),
        and_(
            models.Message.sender_id == user_id,
            models.Message.receiver_id == current_user.id,
        ),
    )

    total = db.query(func.count(models.Message.id)).filter(both_directions).scalar()

    messages = (
        db.query(models.Message)
        .filter(both_directions)
        .order_by(models.Message.created_at.asc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    db.query(models.Message).filter(
        models.Message.sender_id == user_id,
        models.Message.receiver_id == current_user.id,
        models.Message.is_read == False,
    ).update({"is_read": True})
    db.commit()

    return {
        "messages": messages,
        "page": page,
        "per_page": per_page,
        "total": total,
    }

