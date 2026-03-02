# from fastapi import FastAPI

# app = FastAPI()

# @app.get("/")
# def root():
#     return {"message": "Chat API running"}

from fastapi import FastAPI
from .database import engine
from sqlalchemy import text
from app.routers import users

app = FastAPI()

app.include_router(
    users.router,
    prefix="/users",
    tags=["users"]
)