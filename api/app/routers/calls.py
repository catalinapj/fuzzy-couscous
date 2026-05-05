import os
import requests
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app import models
from app.schemas import calls as schemas

router = APIRouter(prefix="/calls", tags=["calls"])

DAILY_API_KEY = os.getenv("DAILY_API_KEY")
DAILY_API_URL = "https://api.daily.co/v1"


@router.post("/", response_model=schemas.CallResponse)
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

    room = _create_daily_room()

    db_call = models.Call(
        sender_id=current_user.id,
        receiver_id=target_user.id,
        room_name=room["name"],
        room_url=room["url"],
    )
    db.add(db_call)
    db.commit()
    db.refresh(db_call)

    room_id = _daily_room_identifier(db_call)
    return schemas.CallResponse(
        id=db_call.id,
        room_id=room_id,
        room_url=db_call.room_url,
    )


@router.get("/{call_id}", response_model=schemas.CallJoinResponse)
def get_call(
    call_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_call = db.query(models.Call).filter(models.Call.id == call_id).first()
    if not db_call:
        raise HTTPException(status_code=404, detail="Call not found")

    if current_user.id not in (db_call.sender_id, db_call.receiver_id):
        raise HTTPException(status_code=403, detail="Not part of this call")

    room_id = _daily_room_identifier(db_call)
    token = _create_meeting_token(
        room_name=room_id,
        user_name=current_user.username,
        is_owner=current_user.id == db_call.sender_id,
    )
    return schemas.CallJoinResponse(
        room_id=room_id,
        room_url=db_call.room_url,
        token=token,
    )


def _daily_room_identifier(call_row: models.Call) -> str:
    if getattr(call_row, "room_name", None):
        return call_row.room_name
    parsed = urlparse(call_row.room_url or "")
    seg = parsed.path.strip("/").split("/", maxsplit=1)[0].strip()
    if seg:
        return seg
    raise HTTPException(
        status_code=500,
        detail="Call missing Daily room name; recreate the call.",
    )


def _daily_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {DAILY_API_KEY}"}


def _create_daily_room() -> dict:
    try:
        room_resp = requests.post(
            f"{DAILY_API_URL}/rooms",
            json={"privacy": "private", "max_participants": 2},
            headers=_daily_headers(),
            timeout=15,
        )
        room_resp.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to create Daily room: {exc}",
        ) from exc

    return room_resp.json()


def _create_meeting_token(room_name: str, user_name: str, is_owner: bool) -> str:
    try:
        token_resp = requests.post(
            f"{DAILY_API_URL}/meeting-tokens",
            json={
                "properties": {
                    "room_name": room_name,
                    "user_name": user_name,
                    "is_owner": is_owner,
                }
            },
            headers=_daily_headers(),
            timeout=15,
        )
        token_resp.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to create Daily meeting token: {exc}",
        ) from exc

    return token_resp.json()["token"]
