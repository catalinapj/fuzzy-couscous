from fastapi.testclient import TestClient
import requests

from app import models
from app.routers import calls as calls_router
from tests.conftest import get_auth_header


class _FakeDailyResponse:
    def __init__(self, payload: dict):
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return self._payload


def test_create_call_returns_call_room_id_and_room_url(
    client: TestClient, user_factory, monkeypatch
):
    users = user_factory(["user-1", "user-2"])
    monkeypatch.setattr(calls_router, "DAILY_API_KEY", "test-daily-key")

    captured = {}

    def _fake_post(url, json=None, headers=None, **_kwargs):
        captured["url"] = url
        captured["json"] = json
        captured["headers"] = headers
        return _FakeDailyResponse(
            {"name": "daily-room-xyz", "url": "https://daily.example/room-123"}
        )

    monkeypatch.setattr(calls_router.requests, "post", _fake_post)

    response = client.post(
        "/calls/",
        json={"receiver_id": users["user-2"]["id"]},
        headers=get_auth_header(users["user-1"]),
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["id"], int)
    assert data["room_id"] == "daily-room-xyz"
    assert data["room_url"] == "https://daily.example/room-123"
    assert captured["url"] == f"{calls_router.DAILY_API_URL}/rooms"
    assert captured["json"] == {"privacy": "private", "max_participants": 2}
    assert captured["headers"] == {"Authorization": "Bearer test-daily-key"}


def test_create_call_requires_authentication(client: TestClient):
    response = client.post("/calls/", json={"receiver_id": 1})
    assert response.status_code == 401


def test_create_call_returns_500_when_daily_key_missing(
    client: TestClient, user_factory, monkeypatch
):
    users = user_factory(["user-1", "user-2"])
    monkeypatch.setattr(calls_router, "DAILY_API_KEY", None)

    response = client.post(
        "/calls/",
        json={"receiver_id": users["user-2"]["id"]},
        headers=get_auth_header(users["user-1"]),
    )

    assert response.status_code == 500
    assert response.json()["detail"] == "Daily API key not configured"


def test_create_call_returns_404_for_unknown_target_user(
    client: TestClient, mock_user, monkeypatch
):
    monkeypatch.setattr(calls_router, "DAILY_API_KEY", "test-daily-key")

    response = client.post(
        "/calls/",
        json={"receiver_id": 999999},
        headers=get_auth_header(mock_user),
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Target user not found"


def test_create_call_daily_failure_returns_502_and_no_db_row(
    client: TestClient, user_factory, monkeypatch, db_session
):
    users = user_factory(["user-1", "user-2"])
    monkeypatch.setattr(calls_router, "DAILY_API_KEY", "test-daily-key")

    calls_before = db_session.query(models.Call).count()

    class _FailingDailyResponse:
        def raise_for_status(self) -> None:
            raise requests.HTTPError("daily create room failed")

        def json(self) -> dict:
            return {}

    def _fake_post(url, json=None, headers=None, **_kwargs):
        return _FailingDailyResponse()

    monkeypatch.setattr(calls_router.requests, "post", _fake_post)

    response = client.post(
        "/calls/",
        json={"receiver_id": users["user-2"]["id"]},
        headers=get_auth_header(users["user-1"]),
    )

    assert response.status_code == 502
    assert "Failed to create Daily room" in response.json()["detail"]
    assert db_session.query(models.Call).count() == calls_before
