from fastapi.testclient import TestClient
from tests.conftest import get_auth_header


# --- GET /messages/conversations ---


def test_conversations_lists_all_chat_partners(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2", "user-3", "user-4", "user-5", "user-6", "user-7", "user-8", "user-9", "user-10"])

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


# --- Unread count ---


def test_conversations_unread_count(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2"])

    client.post(
        "/messages/",
        json={"receiver_id": users["user-1"]["id"], "content": "Hey"},
        headers=get_auth_header(users["user-2"]),
    )
    client.post(
        "/messages/",
        json={"receiver_id": users["user-1"]["id"], "content": "You there?"},
        headers=get_auth_header(users["user-2"]),
    )

    data = client.get(
        "/messages/conversations",
        headers=get_auth_header(users["user-1"]),
    ).json()

    assert data[0]["unread_count"] == 2


def test_conversations_unread_zero_for_sent_messages(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2"])

    client.post(
        "/messages/",
        json={"receiver_id": users["user-2"]["id"], "content": "Hello"},
        headers=get_auth_header(users["user-1"]),
    )

    data = client.get(
        "/messages/conversations",
        headers=get_auth_header(users["user-1"]),
    ).json()

    assert data[0]["unread_count"] == 0


def test_unread_count_per_partner(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2", "user-3"])

    client.post(
        "/messages/",
        json={"receiver_id": users["user-1"]["id"], "content": "From user-2"},
        headers=get_auth_header(users["user-2"]),
    )
    for _ in range(3):
        client.post(
            "/messages/",
            json={"receiver_id": users["user-1"]["id"], "content": "From user-3"},
            headers=get_auth_header(users["user-3"]),
        )

    data = client.get(
        "/messages/conversations",
        headers=get_auth_header(users["user-1"]),
    ).json()

    counts = {c["user"]["username"]: c["unread_count"] for c in data}
    assert counts["user-2"] == 1
    assert counts["user-3"] == 3
