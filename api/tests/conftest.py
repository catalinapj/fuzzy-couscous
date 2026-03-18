import os
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.models import User
from app.core.security import hash_password, create_access_token
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


HASHED_PASSWORD = hash_password("strongpassword")


@pytest.fixture
def user_factory(db_session):
    """Batch-insert users into the DB.

    Usage:
        users = user_factory(["alice", "bob"])
        # returns {"alice": {id, email, username}, "bob": {id, email, username}}
    """

    def create(names: list[str]):
        db_users = [
            User(
                email=f"{name}@mail.com",
                username=name,
                hashed_password=HASHED_PASSWORD,
            )
            for name in names
        ]
        db_session.add_all(db_users)
        db_session.flush()

        return {
            u.username: {"id": u.id, "email": u.email, "username": u.username}
            for u in db_users
        }

    return create


def get_token(user: dict) -> str:
    """Generate an access token for a user dict."""
    return create_access_token(subject=str(user["id"]))


def get_auth_header(user: dict) -> dict:
    """Generate an Authorization header for a user dict."""
    return {"Authorization": f"Bearer {get_token(user)}"}


@pytest.fixture
def mock_user(user_factory):
    """A single registered user (user-1@mail.com)."""
    users = user_factory(["user-1"])
    return users["user-1"]

