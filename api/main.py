from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}

clients: set[WebSocket] = set()

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    clients.add(ws)
    try:
        while True:
            msg = await ws.receive_text()
            dead = []
            for c in clients:
                try:
                    await c.send_text(msg)
                except Exception:
                    dead.append(c)
            for d in dead:
                clients.discard(d)
    except WebSocketDisconnect:
        clients.discard(ws)
