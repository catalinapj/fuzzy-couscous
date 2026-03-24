from fastapi.testclient import TestClient
from tests.conftest import get_auth_header


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
    assert data["total"] == 2
    assert len(data["messages"]) == 2
    contents = [m["content"] for m in data["messages"]]
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

    assert [m["content"] for m in data["messages"]] == ["First", "Second", "Third"]


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

    assert data["total"] == 1
    assert data["messages"][0]["content"] == "To user-2"


def test_conversation_returns_empty_with_no_messages(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2"])

    data = client.get(
        f"/messages/conversation/{users['user-2']['id']}",
        headers=get_auth_header(users["user-1"]),
    ).json()

    assert data["messages"] == []
    assert data["total"] == 0


def test_conversation_requires_authentication(client: TestClient):
    response = client.get("/messages/conversation/1")

    assert response.status_code == 401


def test_conversation_default_pagination(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2"])

    for i in range(60):
        client.post(
            "/messages/",
            json={"receiver_id": users["user-2"]["id"], "content": f"msg-{i}"},
            headers=get_auth_header(users["user-1"]),
        )

    data = client.get(
        f"/messages/conversation/{users['user-2']['id']}",
        headers=get_auth_header(users["user-1"]),
    ).json()

    assert data["page"] == 1
    assert data["per_page"] == 50
    assert data["total"] == 60
    assert len(data["messages"]) == 50


def test_conversation_second_page(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2"])

    for i in range(60):
        client.post(
            "/messages/",
            json={"receiver_id": users["user-2"]["id"], "content": f"msg-{i}"},
            headers=get_auth_header(users["user-1"]),
        )

    data = client.get(
        f"/messages/conversation/{users['user-2']['id']}?page=2",
        headers=get_auth_header(users["user-1"]),
    ).json()

    assert data["page"] == 2
    assert len(data["messages"]) == 10


def test_conversation_custom_per_page(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2"])

    for i in range(15):
        client.post(
            "/messages/",
            json={"receiver_id": users["user-2"]["id"], "content": f"msg-{i}"},
            headers=get_auth_header(users["user-1"]),
        )

    data = client.get(
        f"/messages/conversation/{users['user-2']['id']}?per_page=5",
        headers=get_auth_header(users["user-1"]),
    ).json()

    assert data["per_page"] == 5
    assert data["total"] == 15
    assert len(data["messages"]) == 5


def test_conversation_rejects_page_zero(client: TestClient, mock_user):
    response = client.get(
        "/messages/conversation/1?page=0",
        headers=get_auth_header(mock_user),
    )
    assert response.status_code == 422


def test_conversation_rejects_per_page_over_100(client: TestClient, mock_user):
    response = client.get(
        "/messages/conversation/1?per_page=101",
        headers=get_auth_header(mock_user),
    )
    assert response.status_code == 422


# --- Mark as read ---


def test_opening_conversation_marks_messages_as_read(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2"])

    client.post(
        "/messages/",
        json={"receiver_id": users["user-1"]["id"], "content": "Msg 1"},
        headers=get_auth_header(users["user-2"]),
    )
    client.post(
        "/messages/",
        json={"receiver_id": users["user-1"]["id"], "content": "Msg 2"},
        headers=get_auth_header(users["user-2"]),
    )

    convos_before = client.get(
        "/messages/conversations",
        headers=get_auth_header(users["user-1"]),
    ).json()
    assert convos_before[0]["unread_count"] == 2

    client.get(
        f"/messages/conversation/{users['user-2']['id']}",
        headers=get_auth_header(users["user-1"]),
    )

    convos_after = client.get(
        "/messages/conversations",
        headers=get_auth_header(users["user-1"]),
    ).json()
    assert convos_after[0]["unread_count"] == 0
