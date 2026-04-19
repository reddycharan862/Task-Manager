"""
Pytest test suite for Task Manager API.
Uses an in-memory SQLite DB so tests never touch tasks.db.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

# In-memory test database 
TEST_DATABASE_URL = "sqlite:///./test.db"

test_engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    """Create tables before each test, drop after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    return TestClient(app)


# Helpers 
def create_user_and_login(client, suffix="1"):
    client.post("/register", json={
        "email": f"user{suffix}@test.com",
        "username": f"user{suffix}",
        "password": "password123",
    })
    res = client.post("/login", data={"username": f"user{suffix}", "password": "password123"})
    return res.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


#  Registration Tests 
class TestRegister:
    def test_register_success(self, client):
        res = client.post("/register", json={
            "email": "new@test.com", "username": "newuser", "password": "pass123"
        })
        assert res.status_code == 201
        data = res.json()
        assert data["email"] == "new@test.com"
        assert data["username"] == "newuser"
        assert "id" in data
        assert "hashed_password" not in data

    def test_register_duplicate_email(self, client):
        client.post("/register", json={"email": "dupe@test.com", "username": "userA1", "password": "pass123"})
        res = client.post("/register", json={"email": "dupe@test.com", "username": "userB2", "password": "pass123"})
        assert res.status_code == 400
        assert "Email" in res.json()["detail"]

    def test_register_duplicate_username(self, client):
        client.post("/register", json={"email": "a@test.com", "username": "same", "password": "pass123"})
        res = client.post("/register", json={"email": "b@test.com", "username": "same", "password": "pass123"})
        assert res.status_code == 400
        assert "Username" in res.json()["detail"]

    def test_register_invalid_email(self, client):
        res = client.post("/register", json={"email": "not-an-email", "username": "xyz", "password": "pass123"})
        assert res.status_code == 422

    def test_register_short_password(self, client):
        res = client.post("/register", json={"email": "x@test.com", "username": "xyz", "password": "abc"})
        assert res.status_code == 422


# Login Tests 
class TestLogin:
    def test_login_success(self, client):
        client.post("/register", json={"email": "u@test.com", "username": "loginuser", "password": "pass123"})
        res = client.post("/login", data={"username": "loginuser", "password": "pass123"})
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        client.post("/register", json={"email": "u2@test.com", "username": "u2", "password": "pass123"})
        res = client.post("/login", data={"username": "u2", "password": "wrongpass"})
        assert res.status_code == 401

    def test_login_nonexistent_user(self, client):
        res = client.post("/login", data={"username": "ghost", "password": "pass123"})
        assert res.status_code == 401


# Task Tests 
class TestTasks:
    def test_create_task(self, client):
        token = create_user_and_login(client)
        res = client.post("/tasks", json={"title": "Buy groceries", "description": "Milk, eggs"},
                          headers=auth_headers(token))
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == "Buy groceries"
        assert data["description"] == "Milk, eggs"
        assert data["completed"] is False

    def test_create_task_requires_auth(self, client):
        res = client.post("/tasks", json={"title": "Test"})
        assert res.status_code == 401

    def test_create_task_empty_title(self, client):
        token = create_user_and_login(client)
        res = client.post("/tasks", json={"title": "   "}, headers=auth_headers(token))
        assert res.status_code == 422

    def test_get_all_tasks(self, client):
        token = create_user_and_login(client)
        headers = auth_headers(token)
        client.post("/tasks", json={"title": "Task 1"}, headers=headers)
        client.post("/tasks", json={"title": "Task 2"}, headers=headers)
        res = client.get("/tasks", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total"] == 2
        assert len(data["tasks"]) == 2

    def test_get_task_by_id(self, client):
        token = create_user_and_login(client)
        headers = auth_headers(token)
        created = client.post("/tasks", json={"title": "Find me"}, headers=headers).json()
        res = client.get(f"/tasks/{created['id']}", headers=headers)
        assert res.status_code == 200
        assert res.json()["title"] == "Find me"

    def test_get_task_not_found(self, client):
        token = create_user_and_login(client)
        res = client.get("/tasks/9999", headers=auth_headers(token))
        assert res.status_code == 404

    def test_complete_task(self, client):
        token = create_user_and_login(client)
        headers = auth_headers(token)
        task = client.post("/tasks", json={"title": "Finish me"}, headers=headers).json()
        res = client.put(f"/tasks/{task['id']}", json={"completed": True}, headers=headers)
        assert res.status_code == 200
        assert res.json()["completed"] is True

    def test_update_task_title(self, client):
        token = create_user_and_login(client)
        headers = auth_headers(token)
        task = client.post("/tasks", json={"title": "Old title"}, headers=headers).json()
        res = client.put(f"/tasks/{task['id']}", json={"title": "New title"}, headers=headers)
        assert res.status_code == 200
        assert res.json()["title"] == "New title"

    def test_delete_task(self, client):
        token = create_user_and_login(client)
        headers = auth_headers(token)
        task = client.post("/tasks", json={"title": "Delete me"}, headers=headers).json()
        res = client.delete(f"/tasks/{task['id']}", headers=headers)
        assert res.status_code == 204
        # Confirm gone
        res2 = client.get(f"/tasks/{task['id']}", headers=headers)
        assert res2.status_code == 404

    def test_user_cannot_access_other_users_tasks(self, client):
        token1 = create_user_and_login(client, "A")
        token2 = create_user_and_login(client, "B")
        task = client.post("/tasks", json={"title": "Private"}, headers=auth_headers(token1)).json()
        # User B tries to get User A's task
        res = client.get(f"/tasks/{task['id']}", headers=auth_headers(token2))
        assert res.status_code == 404

    def test_filter_by_completed(self, client):
        token = create_user_and_login(client)
        headers = auth_headers(token)
        t1 = client.post("/tasks", json={"title": "Done"}, headers=headers).json()
        client.post("/tasks", json={"title": "Pending"}, headers=headers)
        client.put(f"/tasks/{t1['id']}", json={"completed": True}, headers=headers)
        # Filter completed
        res = client.get("/tasks?completed=true", headers=headers)
        assert res.json()["total"] == 1
        assert res.json()["tasks"][0]["completed"] is True
        # Filter pending
        res2 = client.get("/tasks?completed=false", headers=headers)
        assert res2.json()["total"] == 1

    def test_pagination(self, client):
        token = create_user_and_login(client)
        headers = auth_headers(token)
        for i in range(5):
            client.post("/tasks", json={"title": f"Task {i}"}, headers=headers)
        res = client.get("/tasks?page=1&page_size=3", headers=headers)
        data = res.json()
        assert len(data["tasks"]) == 3
        assert data["total"] == 5
        assert data["total_pages"] == 2
