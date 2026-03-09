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

    try:
        token = get_token_from_websocket(websocket)
        user = get_user_from_token(token, db)

        await manager.connect(websocket)
        await manager.send_personal_message(
            f"Connected as {user.username}",
            websocket,
        )

        await manager.broadcast(f"{user.username} joined the chat")

        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"{user.username}: {data}")

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
        await websocket.close(code=1008)
    finally:
        db.close()