from fastapi.testclient import TestClient
import pytest
import requests

from app.routers import calls as calls_router
from tests.conftest import get_auth_header


class _FakeDailyResponse:
    def __init__(self, payload: dict):
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return self._payload


def test_create_call_returns_room_and_tokens(
    client: TestClient, user_factory, monkeypatch
):
    users = user_factory(["user-1", "user-2"])
    monkeypatch.setattr(calls_router, "DAILY_API_KEY", "test-daily-key")

    captured = {}

    def _fake_post(url, json, headers):
        captured["url"] = url
        captured["json"] = json
        captured["headers"] = headers
        return _FakeDailyResponse({"url": "https://daily.example/room-123"})

    monkeypatch.setattr(calls_router.requests, "post", _fake_post)

    response = client.post(
        "/calls/",
        json={"receiver_id": users["user-2"]["id"]},
        headers=get_auth_header(users["user-1"]),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["room_url"] == "https://daily.example/room-123"
    assert isinstance(data["user_token"], str) and len(data["user_token"]) > 0
    assert isinstance(data["target_token"], str) and len(data["target_token"]) > 0
    assert data["user_token"] != data["target_token"]
    assert captured["url"] == f"{calls_router.DAILY_API_URL}/rooms"
    assert captured["json"] == {"privacy": "public", "max_participants": 2}
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


def test_create_call_daily_failure_returns_500(
    client: TestClient, user_factory, monkeypatch
):
    users = user_factory(["user-1", "user-2"])
    monkeypatch.setattr(calls_router, "DAILY_API_KEY", "test-daily-key")

    class _FailingDailyResponse:
        def raise_for_status(self) -> None:
            raise requests.HTTPError("daily create room failed")

        def json(self) -> dict:
            return {}

    def _fake_post(url, json, headers):
        return _FailingDailyResponse()

    monkeypatch.setattr(calls_router.requests, "post", _fake_post)

    with pytest.raises(requests.HTTPError):
        client.post(
            "/calls/",
            json={"receiver_id": users["user-2"]["id"]},
            headers=get_auth_header(users["user-1"]),
        )
