from fastapi.testclient import TestClient


def test_register_creates_user_and_returns_201(client: TestClient):
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
    # Ensure password is never returned
    assert "password" not in data
    assert "hashed_password" not in data


def test_register_conflicts_on_duplicate_email(client: TestClient):
    payload = {
        "email": "user2@example.com",
        "username": "user2",
        "password": "strongpassword",
    }

    first = client.post("/auth/register", json=payload)
    assert first.status_code == 201

    # Try to register same email again (even with different username)
    second_payload = {**payload, "username": "user2b"}
    second = client.post("/auth/register", json=second_payload)

    assert second.status_code == 409
    assert second.json()["detail"] == "Email already registered"

