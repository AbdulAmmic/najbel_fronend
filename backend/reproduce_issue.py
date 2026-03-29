import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api import deps
from app.models.user import User, UserRole

# Mock database and current user
def mock_get_current_user():
    return User(id=1, email="admin@test.com", full_name="Admin", role=UserRole.ADMIN, hashed_password="...")

app.dependency_overrides[deps.get_current_user] = mock_get_current_user

client = TestClient(app)

def test_reproduce_422():
    # Payload similar to what was in the log
    payload = {
        'name': 'Tramadol', 
        'description': 'Something', 
        'quantity': 3773, 
        'reorder_level': 10, 
        'batch_number': 'BATR78', 
        'expiry_date': '2026-01-30', 
        'supplier': '', 
        'unit_price': 799.99, 
        'category': 'Antibiotics'
    }
    
    print("\n--- Testing PUT ---")
    response = client.put("/api/v1/pharmacy/inventory/1", json=payload)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 422:
        print(f"Details: {response.json()}")
    
    print("\n--- Testing DELETE ---")
    response = client.delete("/api/v1/pharmacy/inventory/1")
    print(f"Status Code: {response.status_code}")
    if response.status_code == 422:
        print(f"Details: {response.json()}")

if __name__ == "__main__":
    test_reproduce_422()
