# from fastapi import FastAPI

# app = FastAPI()

# @app.get("/")
# def root():
#     return {"message": "Chat API running"}

from fastapi import FastAPI
from .database import engine
from sqlalchemy import text

app = FastAPI()

@app.get("/")
def root():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return {"db": "connected"}