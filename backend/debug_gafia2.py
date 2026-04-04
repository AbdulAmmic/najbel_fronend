import requests
import json
import time

GAFIAPAY_SECRET_KEY = "d6e2a64907bf13708967cf4246892a046a16de10436ea09eed736df1fa58f47bfc182cea311a25cf9698d5d14a79df660893fdb09404c73359ee6a88aaca570d"
GAFIAPAY_API_KEY = "1437d986abdaaa2eb57050736b7d34487b3fbd523f45cd3851991cf3e4344bf6"
BASE_URL = "https://api.gafiapay.com/api/v1/external"

def test_gafia():
    url = f"{BASE_URL}/account/generate"
    payload = {
        "email": "test@example.com",
        "name": "John Doe",
        "reference": "REF987654321",
        "bvn": ""
    }
    
    headers = {
        "Authorization": f"Bearer {GAFIAPAY_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        print("Sending...")
        res = requests.post(url, json=payload, headers=headers)
        print("Status", res.status_code)
        print("Body", res.text)
    except Exception as e:
        print("Error", str(e))

if __name__ == "__main__":
    test_gafia()
