import json
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from tests.conftest import get_auth_header

from app.websocket_manager import ConnectionManager


# --- ConnectionManager unit tests ---


@pytest.fixture
def manager():
    return ConnectionManager()


@pytest.mark.anyio
async def test_manager_connect_stores_connection(manager):
    ws = AsyncMock()
    await manager.connect(1, ws)

    assert 1 in manager.active_connections
    ws.accept.assert_awaited_once()


@pytest.mark.anyio
async def test_manager_disconnect_removes_connection(manager):
    ws = AsyncMock()
    await manager.connect(1, ws)
    manager.disconnect(1)

    assert 1 not in manager.active_connections


@pytest.mark.anyio
async def test_manager_disconnect_ignores_unknown_user(manager):
    manager.disconnect(999)


@pytest.mark.anyio
async def test_manager_send_json_to_connected_user(manager):
    ws = AsyncMock()
    await manager.connect(1, ws)

    await manager.send_json(1, {"type": "test", "data": "hello"})

    ws.send_text.assert_awaited_once()
    sent = json.loads(ws.send_text.call_args[0][0])
    assert sent["type"] == "test"
    assert sent["data"] == "hello"


@pytest.mark.anyio
async def test_manager_send_json_skips_offline_user(manager):
    await manager.send_json(999, {"type": "test"})


@pytest.mark.anyio
async def test_manager_broadcast_sends_to_all(manager):
    ws1 = AsyncMock()
    ws2 = AsyncMock()
    await manager.connect(1, ws1)
    await manager.connect(2, ws2)

    await manager.broadcast({"type": "announcement"})

    assert ws1.send_text.await_count == 1
    assert ws2.send_text.await_count == 1


# --- POST /messages/ WebSocket push ---


def test_post_message_pushes_to_recipient_websocket(client: TestClient, user_factory):
    users = user_factory(["user-1", "user-2"])

    with patch("app.routers.messages.manager") as mock_manager:
        mock_manager.send_json = AsyncMock()

        response = client.post(
            "/messages/",
            json={"receiver_id": users["user-2"]["id"], "content": "Real-time!"},
            headers=get_auth_header(users["user-1"]),
        )

        assert response.status_code == 200
        mock_manager.send_json.assert_awaited_once()

        call_args = mock_manager.send_json.call_args
        assert call_args[0][0] == users["user-2"]["id"]
        payload = call_args[0][1]
        assert payload["type"] == "new_message"
        assert payload["message"]["content"] == "Real-time!"
        assert payload["message"]["sender_id"] == users["user-1"]["id"]
        assert payload["message"]["receiver_id"] == users["user-2"]["id"]
