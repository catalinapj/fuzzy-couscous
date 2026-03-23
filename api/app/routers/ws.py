from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.security import get_token_from_websocket, get_user_from_token
from app.database import SessionLocal
from app.websocket_manager import ConnectionManager

router = APIRouter()
manager = ConnectionManager()


@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    db: Session = SessionLocal()
    user = None

    try:
        token = get_token_from_websocket(websocket)
        user = get_user_from_token(token, db)

        await manager.connect(user.id, websocket)
        await manager.send_json(user.id, {"type": "connected", "username": user.username})

        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        if user:
            manager.disconnect(user.id)
    except Exception:
        if user:
            manager.disconnect(user.id)
        await websocket.close(code=1008)
    finally:
        db.close()