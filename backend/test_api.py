import requests

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3Njg3ODI2ODcsInN1YiI6IjEifQ.J2Rsf4_3hNWSKfFYxe1PGHflvvCTREFGdA9VDmHQxJo"
url = "http://localhost:8000/api/v1/appointments"

payload = {
    "doctor_id": 1,
    "appointment_time": "2026-01-20T10:00:00Z",
    "type": "offline",
    "communication_preference": "in_app_chat",
    "reason": "Routine checkup",
    "notes": "Test"
}

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
