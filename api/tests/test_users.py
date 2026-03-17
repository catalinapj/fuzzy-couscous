from fastapi.testclient import TestClient


def test_list_users_returns_registered_users(client: TestClient, auth):
    response = client.get("/users/", headers=auth["header"])

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1

    usernames = {u["username"] for u in data}
    assert "user-1" in usernames

    for user in data:
        assert "id" in user
        assert "email" in user
        assert "username" in user
        assert "hashed_password" not in user

def test_list_users_returns_registered_users(client: TestClient, auth):
    response = client.get("/users/", headers=auth["header"])

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1

    usernames = {u["username"] for u in data}
    assert "user-1" in usernames

    for user in data:
        assert "id" in user
        assert "email" in user
        assert "username" in user
        assert "hashed_password" not in user


def test_list_users_requires_authentication(client: TestClient):
    response = client.get("/users/")

    assert response.status_code == 401


def test_get_me_returns_current_user(client: TestClient, auth):
    response = client.get("/users/me", headers=auth["header"])

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "user-1@mail.com"
    assert data["username"] == "user-1"
    assert "hashed_password" not in data


def test_get_me_requires_authentication(client: TestClient):
    response = client.get("/users/me")

    assert response.status_code == 401
