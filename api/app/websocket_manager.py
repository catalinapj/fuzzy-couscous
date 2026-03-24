import json

from fastapi import WebSocket

WS_EVENT_CONNECTED = "connected"
WS_EVENT_NEW_MESSAGE = "new_message"


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int) -> None:
        self.active_connections.pop(user_id, None)

    async def send_json(self, user_id: int, data: dict) -> None:
        ws = self.active_connections.get(user_id)
        if ws:
            await ws.send_text(json.dumps(data))

    async def broadcast(self, data: dict) -> None:
        payload = json.dumps(data)
        for ws in self.active_connections.values():
            await ws.send_text(payload)