from fastapi.testclient import TestClient
from app.main import app
from app.api import deps
from app.models.user import User, UserRole

def mock_get_current_user():
    return User(id=1, email="admin@test.com", full_name="Admin", role=UserRole.ADMIN, hashed_password="...")

app.dependency_overrides[deps.get_current_user] = mock_get_current_user
client = TestClient(app)

payload = {'name': 'T', 'quantity': 1, 'unit_price': 100.0}

res_put = client.put("/api/v1/pharmacy/inventory/1", json=payload)
print(f"PUT_STATUS={res_put.status_code}")

res_del = client.delete("/api/v1/pharmacy/inventory/1")
print(f"DEL_STATUS={res_del.status_code}")
