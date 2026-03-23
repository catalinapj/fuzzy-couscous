from fastapi.testclient import TestClient
from tests.conftest import get_auth_header


# --- POST /messages/ ---


def test_create_message(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2"])

    response = client.post(
        "/messages/",
        json={"receiver_id": users["user-2"]["id"], "content": "Hello!"},
        headers=get_auth_header(users["user-1"]),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Hello!"
    assert data["receiver_id"] == users["user-2"]["id"]
    assert "id" in data
    assert "sender_id" in data
    assert "created_at" in data


def test_create_message_requires_authentication(client: TestClient):
    response = client.post(
        "/messages/",
        json={"receiver_id": 1, "content": "Hello!"},
    )

    assert response.status_code == 401


def test_create_message_rejects_empty_content(client: TestClient, mock_user):
    response = client.post(
        "/messages/",
        json={"receiver_id": 999, "content": ""},
        headers=get_auth_header(mock_user),
    )

    assert response.status_code == 422


def test_create_message_rejects_content_over_2000_chars(client: TestClient, mock_user):
    response = client.post(
        "/messages/",
        json={"receiver_id": 999, "content": "a" * 2001},
        headers=get_auth_header(mock_user),
    )

    assert response.status_code == 422


def test_create_message_accepts_content_at_max_length(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2"])

    response = client.post(
        "/messages/",
        json={"receiver_id": users["user-2"]["id"], "content": "a" * 2000},
        headers=get_auth_header(users["user-1"]),
    )

    assert response.status_code == 200
    assert len(response.json()["content"]) == 2000


def test_create_message_rejects_missing_fields(client: TestClient, mock_user):
    response = client.post(
        "/messages/",
        json={},
        headers=get_auth_header(mock_user),
    )

    assert response.status_code == 422
