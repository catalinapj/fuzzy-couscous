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


# --- GET /messages/conversation/{user_id} ---


def test_conversation_returns_both_directions(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2"])

    client.post(
        "/messages/",
        json={"receiver_id": users["user-2"]["id"], "content": "From user-1"},
        headers=get_auth_header(users["user-1"]),
    )
    client.post(
        "/messages/",
        json={"receiver_id": users["user-1"]["id"], "content": "From user-2"},
        headers=get_auth_header(users["user-2"]),
    )

    response = client.get(
        f"/messages/conversation/{users['user-2']['id']}",
        headers=get_auth_header(users["user-1"]),
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    contents = [m["content"] for m in data]
    assert "From user-1" in contents
    assert "From user-2" in contents


def test_conversation_is_sorted_by_time(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2"])

    client.post(
        "/messages/",
        json={"receiver_id": users["user-2"]["id"], "content": "First"},
        headers=get_auth_header(users["user-1"]),
    )
    client.post(
        "/messages/",
        json={"receiver_id": users["user-1"]["id"], "content": "Second"},
        headers=get_auth_header(users["user-2"]),
    )
    client.post(
        "/messages/",
        json={"receiver_id": users["user-2"]["id"], "content": "Third"},
        headers=get_auth_header(users["user-1"]),
    )

    data = client.get(
        f"/messages/conversation/{users['user-2']['id']}",
        headers=get_auth_header(users["user-1"]),
    ).json()

    assert [m["content"] for m in data] == ["First", "Second", "Third"]


def test_conversation_excludes_other_users(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2", "user-3"])

    client.post(
        "/messages/",
        json={"receiver_id": users["user-2"]["id"], "content": "To user-2"},
        headers=get_auth_header(users["user-1"]),
    )
    client.post(
        "/messages/",
        json={"receiver_id": users["user-3"]["id"], "content": "To user-3"},
        headers=get_auth_header(users["user-1"]),
    )

    data = client.get(
        f"/messages/conversation/{users['user-2']['id']}",
        headers=get_auth_header(users["user-1"]),
    ).json()

    assert len(data) == 1
    assert data[0]["content"] == "To user-2"


def test_conversation_returns_empty_with_no_messages(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2"])

    data = client.get(
        f"/messages/conversation/{users['user-2']['id']}",
        headers=get_auth_header(users["user-1"]),
    ).json()

    assert data == []


def test_conversation_requires_authentication(client: TestClient):
    response = client.get("/messages/conversation/1")

    assert response.status_code == 401


# --- GET /messages/conversations ---


def test_conversations_lists_all_chat_partners(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2", "user-3"])

    client.post(
        "/messages/",
        json={"receiver_id": users["user-2"]["id"], "content": "Hey user-2"},
        headers=get_auth_header(users["user-1"]),
    )
    client.post(
        "/messages/",
        json={"receiver_id": users["user-3"]["id"], "content": "Hey user-3"},
        headers=get_auth_header(users["user-1"]),
    )

    data = client.get(
        "/messages/conversations",
        headers=get_auth_header(users["user-1"]),
    ).json()

    assert len(data) == 2
    partner_names = [c["user"]["username"] for c in data]
    assert "user-2" in partner_names
    assert "user-3" in partner_names


def test_conversations_shows_latest_message(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2"])

    client.post(
        "/messages/",
        json={"receiver_id": users["user-2"]["id"], "content": "First"},
        headers=get_auth_header(users["user-1"]),
    )
    client.post(
        "/messages/",
        json={"receiver_id": users["user-1"]["id"], "content": "Second"},
        headers=get_auth_header(users["user-2"]),
    )

    data = client.get(
        "/messages/conversations",
        headers=get_auth_header(users["user-1"]),
    ).json()

    assert len(data) == 1
    assert data[0]["user"]["username"] == "user-2"
    assert data[0]["last_message"]["content"] == "Second"


def test_conversations_sorted_newest_first(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2", "user-3"])

    client.post(
        "/messages/",
        json={"receiver_id": users["user-2"]["id"], "content": "Older"},
        headers=get_auth_header(users["user-1"]),
    )
    client.post(
        "/messages/",
        json={"receiver_id": users["user-3"]["id"], "content": "Newer"},
        headers=get_auth_header(users["user-1"]),
    )

    data = client.get(
        "/messages/conversations",
        headers=get_auth_header(users["user-1"]),
    ).json()

    assert data[0]["user"]["username"] == "user-3"
    assert data[1]["user"]["username"] == "user-2"


def test_conversations_includes_incoming_messages(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2"])

    client.post(
        "/messages/",
        json={"receiver_id": users["user-1"]["id"], "content": "Hi there"},
        headers=get_auth_header(users["user-2"]),
    )

    data = client.get(
        "/messages/conversations",
        headers=get_auth_header(users["user-1"]),
    ).json()

    assert len(data) == 1
    assert data[0]["user"]["username"] == "user-2"
    assert data[0]["last_message"]["content"] == "Hi there"


def test_conversations_empty_when_no_messages(client: TestClient, mock_user):
    data = client.get(
        "/messages/conversations",
        headers=get_auth_header(mock_user),
    ).json()

    assert data == []


def test_conversations_requires_authentication(client: TestClient):
    response = client.get("/messages/conversations")

    assert response.status_code == 401
