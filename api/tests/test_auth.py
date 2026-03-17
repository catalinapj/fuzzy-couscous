from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import models


def test_register_creates_user_and_returns_201(client: TestClient, db_session: Session):
    payload = {
        "email": "user1@example.com",
        "username": "user1",
        "password": "strongpassword",
    }

    response = client.post("/auth/register", json=payload)

    assert response.status_code == 201
    data = response.json()

    assert "id" in data
    assert data["email"] == payload["email"]
    assert data["username"] == payload["username"]
    assert "password" not in data
    assert "hashed_password" not in data

    users = db_session.query(models.User).filter(
        models.User.email == payload["email"]
    ).all()
    assert len(users) == 1

    user = users[0]
    assert user.email == payload["email"]
    assert user.username == payload["username"]
    assert user.hashed_password is not None


def test_register_conflicts_on_duplicate_email(client: TestClient):
    payload = {
        "email": "user2@example.com",
        "username": "user2",
        "password": "strongpassword",
    }

    first = client.post("/auth/register", json=payload)
    assert first.status_code == 201

    second_payload = {**payload, "username": "user2b"}
    second = client.post("/auth/register", json=second_payload)

    assert second.status_code == 409
    assert second.json()["detail"] == "Email already registered"


def test_register_rejects_invalid_email(client: TestClient):
    payload = {
        "email": "not-an-email",
        "username": "user3",
        "password": "strongpassword",
    }

    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422


def test_register_rejects_missing_fields(client: TestClient):
    response = client.post("/auth/register", json={})
    assert response.status_code == 422

    errors = response.json()["detail"]
    missing_fields = {e["loc"][-1] for e in errors}
    assert {"email", "username", "password"} <= missing_fields


def test_register_rejects_short_username(client: TestClient):
    payload = {
        "email": "short@example.com",
        "username": "ab",
        "password": "strongpassword",
    }

    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422


def test_register_rejects_long_username(client: TestClient):
    payload = {
        "email": "long@example.com",
        "username": "a" * 51,
        "password": "strongpassword",
    }

    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422


def test_register_rejects_short_password(client: TestClient):
    payload = {
        "email": "shortpw@example.com",
        "username": "user4",
        "password": "1234567",
    }

    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422


def test_register_rejects_password_over_72_bytes(client: TestClient):
    # 73 bytes when UTF-8 encoded (each char is 2 bytes)
    long_password = "\u00e9" * 37

    payload = {
        "email": "longpw@example.com",
        "username": "user5",
        "password": long_password,
    }

    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422


def test_register_rejects_empty_body(client: TestClient):
    response = client.post("/auth/register")
    assert response.status_code == 422


# --- Duplicate username (exposes a bug: route says "Email already registered"
#     even when the conflict is actually on username) ---


def test_register_conflicts_on_duplicate_username(client: TestClient):
    payload = {
        "email": "dupeuser@example.com",
        "username": "taken_name",
        "password": "strongpassword",
    }

    first = client.post("/auth/register", json=payload)
    assert first.status_code == 201

    second_payload = {**payload, "email": "different@example.com"}
    second = client.post("/auth/register", json=second_payload)

    assert second.status_code == 409
    assert second.json()["detail"] == "Username already taken"


# --- Boundary tests (exact min/max limits should succeed) ---


def test_register_accepts_username_at_min_length(client: TestClient):
    payload = {
        "email": "min_user@example.com",
        "username": "abc",
        "password": "strongpassword",
    }

    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201


def test_register_accepts_username_at_max_length(client: TestClient):
    payload = {
        "email": "max_user@example.com",
        "username": "a" * 50,
        "password": "strongpassword",
    }

    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201


def test_register_accepts_password_at_min_length(client: TestClient):
    payload = {
        "email": "minpw@example.com",
        "username": "minpwuser",
        "password": "12345678",
    }

    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201


def test_register_accepts_password_at_72_bytes(client: TestClient):
    password_72_bytes = "a" * 72

    payload = {
        "email": "exactpw@example.com",
        "username": "exactpwuser",
        "password": password_72_bytes,
    }

    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201


# --- Login / token tests ---


def test_login_returns_access_token(client: TestClient):
    payload = {
        "email": "loginuser@example.com",
        "username": "loginuser",
        "password": "strongpassword",
    }
    client.post("/auth/register", json=payload)

    response = client.post(
        "/auth/login",
        data={"username": payload["email"], "password": payload["password"]},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 0


def test_login_rejects_wrong_password(client: TestClient):
    payload = {
        "email": "wrongpw@example.com",
        "username": "wrongpwuser",
        "password": "strongpassword",
    }
    client.post("/auth/register", json=payload)

    response = client.post(
        "/auth/login",
        data={"username": payload["email"], "password": "wrongpassword"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"


def test_login_rejects_nonexistent_user(client: TestClient):
    response = client.post(
        "/auth/login",
        data={"username": "nobody@example.com", "password": "strongpassword"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"
