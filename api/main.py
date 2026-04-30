from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, auth, messages, ws, calls

app = FastAPI()

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(messages.router)
app.include_router(ws.router)
app.include_router(calls.router)

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
