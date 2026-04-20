from fastapi.testclient import TestClient
from tests.conftest import get_auth_header


def test_list_users_returns_first_page_by_default(client: TestClient, user_factory):
    names = [f"user-{i}" for i in range(25)]
    users = user_factory(names)
    header = get_auth_header(users["user-0"])

    response = client.get("/users/", headers=header)

    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["per_page"] == 10
    assert data["total"] == 25
    assert len(data["users"]) == 10


def test_list_users_second_page(client: TestClient, user_factory):
    names = [f"user-{i}" for i in range(25)]
    users = user_factory(names)
    header = get_auth_header(users["user-0"])

    response = client.get("/users/?page=2", headers=header)

    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 2
    assert len(data["users"]) == 10


def test_list_users_last_page_partial(client: TestClient, user_factory):
    names = [f"user-{i}" for i in range(25)]
    users = user_factory(names)
    header = get_auth_header(users["user-0"])

    response = client.get("/users/?page=3", headers=header)

    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 3
    assert len(data["users"]) == 5


def test_list_users_filter_by_q_username(client: TestClient, user_factory):
    names = [f"user-{i}" for i in range(5)]
    users = user_factory(names)
    header = get_auth_header(users["user-0"])

    response = client.get("/users/?q=user-2", headers=header)

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["users"][0]["username"] == "user-2"


def test_list_users_filter_by_id(client: TestClient, user_factory):
    names = [f"u{i}" for i in range(3)]
    created = user_factory(names)
    target = created["u1"]
    header = get_auth_header(created["u0"])

    response = client.get(f"/users/?q={target['id']}", headers=header)

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["users"][0]["id"] == target["id"]


def test_list_users_custom_per_page(client: TestClient, user_factory):
    names = [f"user-{i}" for i in range(15)]
    users = user_factory(names)
    header = get_auth_header(users["user-0"])

    response = client.get("/users/?per_page=5", headers=header)

    assert response.status_code == 200
    data = response.json()
    assert data["per_page"] == 5
    assert data["total"] == 15
    assert len(data["users"]) == 5


def test_list_users_page_beyond_total_returns_empty(client: TestClient, mock_user):
    response = client.get("/users/?page=999", headers=get_auth_header(mock_user))

    assert response.status_code == 200
    data = response.json()
    assert data["users"] == []
    assert data["total"] == 1


def test_list_users_rejects_page_zero(client: TestClient, mock_user):
    response = client.get("/users/?page=0", headers=get_auth_header(mock_user))

    assert response.status_code == 422


def test_list_users_rejects_per_page_over_100(client: TestClient, mock_user):
    response = client.get("/users/?per_page=101", headers=get_auth_header(mock_user))

    assert response.status_code == 422


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
