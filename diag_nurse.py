import requests

def test_nurse_patients():
    # Login as admin to get token (assuming admin has nurse dashboard access per nurses.py check)
    login_url = "http://localhost:8000/api/v1/auth/login"
    login_payload = {
        "username": "admin@najbel.com",
        "password": "admin123"
    }
    
    try:
        print("Logging in...")
        login_response = requests.post(login_url, data=login_payload)
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.text}")
            return
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        print("Fetching nurse dashboard patients...")
        url = "http://localhost:8000/api/v1/nurses/patients"
        response = requests.get(url, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"Success! Found {len(response.json())} patients.")
        else:
            print(f"Failed! Details: {response.text}")
    except Exception as e:
        print(f"Error during request: {e}")

if __name__ == "__main__":
    test_nurse_patients()
