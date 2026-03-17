from fastapi.testclient import TestClient
from tests.conftest import auth_header


def _create_second_user(client: TestClient):
    """Register a second user and return (token, user_id)."""
    client.post("/auth/register", json={
        "email": "user-2@mail.com",
        "username": "user-2",
        "password": "strongpassword",
    })
    resp = client.post(
        "/auth/login",
        data={"username": "user-2@mail.com", "password": "strongpassword"},
    )
    token = resp.json()["access_token"]
    me = client.get("/users/me", headers=auth_header(token))
    return token, me.json()["id"]


# --- POST /messages/ ---


def test_create_message(client: TestClient, auth):
    _, receiver_id = _create_second_user(client)

    response = client.post(
        "/messages/",
        json={"receiver_id": receiver_id, "content": "Hello!"},
        headers=auth["header"],
    )

    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Hello!"
    assert data["receiver_id"] == receiver_id
    assert "id" in data
    assert "sender_id" in data
    assert "created_at" in data


def test_create_message_requires_authentication(client: TestClient):
    response = client.post(
        "/messages/",
        json={"receiver_id": 1, "content": "Hello!"},
    )

    assert response.status_code == 401


def test_create_message_rejects_empty_content(client: TestClient, auth):
    response = client.post(
        "/messages/",
        json={"receiver_id": 999, "content": ""},
        headers=auth["header"],
    )

    assert response.status_code == 422


def test_create_message_rejects_content_over_2000_chars(client: TestClient, auth):
    response = client.post(
        "/messages/",
        json={"receiver_id": 999, "content": "a" * 2001},
        headers=auth["header"],
    )

    assert response.status_code == 422


def test_create_message_accepts_content_at_max_length(client: TestClient, auth):
    _, receiver_id = _create_second_user(client)

    response = client.post(
        "/messages/",
        json={"receiver_id": receiver_id, "content": "a" * 2000},
        headers=auth["header"],
    )

    assert response.status_code == 200
    assert len(response.json()["content"]) == 2000


def test_create_message_rejects_missing_fields(client: TestClient, auth):
    response = client.post(
        "/messages/",
        json={},
        headers=auth["header"],
    )

    assert response.status_code == 422


# --- GET /messages/ ---


def test_list_messages_returns_sent_messages(client: TestClient, auth):
    _, receiver_id = _create_second_user(client)

    client.post(
        "/messages/",
        json={"receiver_id": receiver_id, "content": "First message"},
        headers=auth["header"],
    )
    client.post(
        "/messages/",
        json={"receiver_id": receiver_id, "content": "Second message"},
        headers=auth["header"],
    )

    response = client.get("/messages/", headers=auth["header"])

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    contents = {m["content"] for m in data}
    assert "First message" in contents
    assert "Second message" in contents


def test_list_messages_returns_empty_for_new_user(client: TestClient, auth):
    response = client.get("/messages/", headers=auth["header"])

    assert response.status_code == 200
    assert response.json() == []


def test_list_messages_requires_authentication(client: TestClient):
    response = client.get("/messages/")

    assert response.status_code == 401


def test_list_messages_only_returns_own_messages(client: TestClient, auth):
    user2_token, user2_id = _create_second_user(client)

    me = client.get("/users/me", headers=auth["header"]).json()
    user1_id = me["id"]

    client.post(
        "/messages/",
        json={"receiver_id": user2_id, "content": "From user-1"},
        headers=auth["header"],
    )
    client.post(
        "/messages/",
        json={"receiver_id": user1_id, "content": "From user-2"},
        headers=auth_header(user2_token),
    )

    user1_messages = client.get("/messages/", headers=auth["header"]).json()
    user2_messages = client.get("/messages/", headers=auth_header(user2_token)).json()

    assert len(user1_messages) == 1
    assert user1_messages[0]["content"] == "From user-1"

    assert len(user2_messages) == 1
    assert user2_messages[0]["content"] == "From user-2"
