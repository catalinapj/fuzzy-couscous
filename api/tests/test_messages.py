from fastapi.testclient import TestClient
from tests.conftest import get_auth_header


# --- POST /messages/ ---


def test_create_message(client: TestClient, user_factory):
    users = user_factory(["sender", "receiver"])
    sender = users["sender"]
    receiver = users["receiver"]

    response = client.post(
        "/messages/",
        json={"receiver_id": receiver["id"], "content": "Hello!"},
        headers=get_auth_header(sender),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Hello!"
    assert data["receiver_id"] == receiver["id"]
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
    users = user_factory(["sender", "receiver"])

    response = client.post(
        "/messages/",
        json={"receiver_id": users["receiver"]["id"], "content": "a" * 2000},
        headers=get_auth_header(users["sender"]),
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


# --- GET /messages/ ---


def test_list_messages_returns_sent_messages(client: TestClient, user_factory):
    users = user_factory(["sender", "receiver"])
    sender = users["sender"]
    receiver = users["receiver"]

    client.post(
        "/messages/",
        json={"receiver_id": receiver["id"], "content": "First message"},
        headers=get_auth_header(sender),
    )
    client.post(
        "/messages/",
        json={"receiver_id": receiver["id"], "content": "Second message"},
        headers=get_auth_header(sender),
    )

    response = client.get("/messages/", headers=get_auth_header(sender))

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    contents = {m["content"] for m in data}
    assert "First message" in contents
    assert "Second message" in contents


def test_list_messages_returns_empty_for_new_user(client: TestClient, mock_user):
    response = client.get("/messages/", headers=get_auth_header(mock_user))

    assert response.status_code == 200
    assert response.json() == []


def test_list_messages_requires_authentication(client: TestClient):
    response = client.get("/messages/")

    assert response.status_code == 401


def test_list_messages_only_returns_own_messages(client: TestClient, user_factory):
    users = user_factory(["alice", "bob"])
    alice = users["alice"]
    bob = users["bob"]

    client.post(
        "/messages/",
        json={"receiver_id": bob["id"], "content": "From Alice"},
        headers=get_auth_header(alice),
    )
    client.post(
        "/messages/",
        json={"receiver_id": alice["id"], "content": "From Bob"},
        headers=get_auth_header(bob),
    )

    alice_messages = client.get("/messages/", headers=get_auth_header(alice)).json()
    bob_messages = client.get("/messages/", headers=get_auth_header(bob)).json()

    assert len(alice_messages) == 1
    assert alice_messages[0]["content"] == "From Alice"

    assert len(bob_messages) == 1
    assert bob_messages[0]["content"] == "From Bob"
