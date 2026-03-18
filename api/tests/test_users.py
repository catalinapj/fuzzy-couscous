from fastapi.testclient import TestClient
from tests.conftest import get_auth_header

def test_list_users_returns_registered_users(client: TestClient, user_factory):

    user_list = [f"user-{i}" for i in range(100)]
    users = user_factory(user_list)
    response = client.get("/users/", headers=get_auth_header(users["user-1"]))

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 100

    usernames = {u["username"] for u in data}
    assert "user-1" in usernames
    assert "user-2" in usernames

    for user in data:
        assert "id" in user
        assert "email" in user
        assert "username" in user
        assert "hashed_password" not in user


def test_list_users_requires_authentication(client: TestClient):
    response = client.get("/users/")

    assert response.status_code == 401


def test_get_me_returns_current_user(client: TestClient, mock_user):
    response = client.get("/users/me", headers=get_auth_header(mock_user))

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == mock_user["email"]
    assert data["username"] == mock_user["username"]
    assert "hashed_password" not in data


def test_get_me_requires_authentication(client: TestClient):
    response = client.get("/users/me")

    assert response.status_code == 401
