import os
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from main import app


# Use a dedicated Postgres database for tests.
# Make sure this database exists (created via psql or your migration tooling).
POSTGRES_TEST_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+psycopg2://admin:secret@localhost:5433/chatapp_test",
)

engine = create_engine(POSTGRES_TEST_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database() -> None:
    """
    Create all tables once for the test session.
    You can optionally drop them at the end if you want a clean DB each run.
    """
    Base.metadata.create_all(bind=engine)
    yield
    # If you prefer dropping all tables after tests, uncomment:
    # Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(setup_test_database) -> Generator:
    """
    Provide a fresh database session for each test, wrapped in a transaction.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    try:
        yield session
    finally:
        transaction.rollback()
        session.close()
        connection.close()


@pytest.fixture
def client(db_session) -> TestClient:
    """
    FastAPI TestClient that uses the Postgres testing database session.
    """

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


MOCK_USER_EMAIL = "user-1@mail.com"
MOCK_USER_USERNAME = "user-1"
MOCK_USER_PASSWORD = "strongpassword"


@pytest.fixture
def mock_user(client):
    """A registered user in the database."""
    resp = client.post("/auth/register", json={
        "email": MOCK_USER_EMAIL,
        "username": MOCK_USER_USERNAME,
        "password": MOCK_USER_PASSWORD,
    })
    return resp.json()


@pytest.fixture
def auth(client, mock_user):
    """Auth token and header for mock_user."""
    resp = client.post(
        "/auth/login",
        data={"username": MOCK_USER_EMAIL, "password": MOCK_USER_PASSWORD},
    )
    token = resp.json()["access_token"]
    return {"token": token, "header": {"Authorization": f"Bearer {token}"}}


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}

