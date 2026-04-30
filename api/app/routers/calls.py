from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import requests
import os
from datetime import datetime, timedelta
import jwt
from fastapi import Body

from app.core.security import get_current_user
from app.database import get_db
from app import models
from app.schemas import calls as schemas

router = APIRouter(prefix="/calls", tags=["calls"])

DAILY_API_KEY = os.getenv("DAILY_API_KEY")
DAILY_API_URL = "https://api.daily.co/v1"


@router.post("/")
async def create_call(
    request: schemas.CallCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not DAILY_API_KEY:
        raise HTTPException(
            status_code=500, detail="Daily API key not configured"
        )

    # Verify target user exists
    target_user = db.query(models.User).filter(
        models.User.id == int(request.receiver_id)
    ).first()
    if not target_user:
        raise HTTPException(
            status_code=404, detail="Target user not found"
        )

    # Create room with max 2 participants
    room_resp = requests.post(
        f"{DAILY_API_URL}/rooms",
        json={"privacy": "public", "max_participants": 2},
        headers={"Authorization": f"Bearer {DAILY_API_KEY}"},
    )
    room_resp.raise_for_status()
    room = room_resp.json()

    # Generate tokens for both users
    token_a = _generate_daily_token(room["url"], str(current_user.id), is_owner=True)
    token_b = _generate_daily_token(room["url"], str(target_user.id), is_owner=False)

    return {
        "room_url": room["url"],
        "user_token": token_a,
        "target_token": token_b,
    }


def _generate_daily_token(room_url: str, user_id: str, is_owner: bool) -> str:
    payload = {
        "r": room_url,
        "u": user_id,
        "isOwner": str(is_owner).lower(),
        "exp": int((datetime.utcnow() + timedelta(hours=1)).timestamp()),
    }
    return jwt.encode(payload, DAILY_API_KEY, algorithm="HS256")
