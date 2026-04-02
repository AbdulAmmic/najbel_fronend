import requests
import sys

def test_nurse_workflow():
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
    print("Fetching patients...")
    r = requests.get(f"{base_url}/nurses/patients", headers=headers)
    if r.status_code != 200:
        print(f"Fetch patients failed: {r.status_code} - {r.text}")
        return
    patients = r.json()
    print(f"Found {len(patients)} patients.")
    
    if len(patients) == 0:
        print("No patients to test with.")
        return
    
    patient_id = patients[0]["id"]
    
    # add note
    print(f"Adding nursing note for patient {patient_id}...")
    note_data = {"patient_id": patient_id, "content": "Nurse workflow test note", "category": "routine"}
    r = requests.post(f"{base_url}/nurses/notes", json=note_data, headers=headers)
    if r.status_code != 200:
        print(f"Add note failed: {r.status_code} - {r.text}")
        return
    
    # get activity logs
    print(f"Fetching activity logs for patient {patient_id}...")
    r = requests.get(f"{base_url}/nurses/activity-logs/{patient_id}", headers=headers)
    if r.status_code != 200:
        print(f"Fetch logs failed: {r.status_code} - {r.text}")
        return
    logs = r.json()
    print(f"Found {len(logs)} activity logs.")
    
    print("\n--- NURSE WORKFLOW VERIFIED ---")

if __name__ == "__main__":
    test_nurse_workflow()
