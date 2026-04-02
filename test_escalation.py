import requests
import sys

def test_escalation():
    base_url = "http://localhost:8000/api/v1"
    
    # login as nurse
    print("Logging in as nurse...")
    login_data = {"username": "nurse@najbel.com", "password": "password"}
    r = requests.post(f"{base_url}/auth/login", data=login_data)
    if r.status_code != 200:
        print(f"Login failed: {r.status_code} - {r.text}")
        return
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # get patients
    r = requests.get(f"{base_url}/nurses/patients", headers=headers)
    patients = r.json()
    if not patients:
        print("No patients found.")
        return
    patient_id = patients[0]["id"]
    
    # test escalation
    print(f"Escalating patient {patient_id} for reason: 'High fever and BP spike'...")
    r = requests.post(f"{base_url}/nurses/escalate?patient_id={patient_id}&reason=High fever and BP spike", headers=headers)
    print(f"Escalation Response: {r.status_code}")
    if r.status_code == 200:
        print("SUCCESS: Escalation logged and doctor notified.")
        audit_log = r.json()
        print(f"Audit Log ID: {audit_log.get('id')}")
    else:
        print(f"FAILURE: {r.text}")

if __name__ == "__main__":
    test_escalation()
