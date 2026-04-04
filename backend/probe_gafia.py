import requests
import json

GAFIAPAY_SECRET_KEY = "d6e2a64907bf13708967cf4246892a046a16de10436ea09eed736df1fa58f47bfc182cea311a25cf9698d5d14a79df660893fdb09404c73359ee6a88aaca570d"
GAFIAPAY_API_KEY = "1437d986abdaaa2eb57050736b7d34487b3fbd523f45cd3851991cf3e4344bf6"
BASE_URL = "https://api.gafiapay.com/api/v1/external"

url = f"{BASE_URL}/account/generate"
payload = {"email": "test@najbel.com", "name": "Test User", "reference": "REF1234"}

def test_headers(headers, desc):
    print(f"\n--- Testing {desc} ---")
    try:
        r = requests.post(url, json=payload, headers=headers)
        print("Status:", r.status_code)
        print("Body:", r.text)
    except Exception as e:
        print("Error:", e)

# 1. Bearer API Key
test_headers({"Authorization": f"Bearer {GAFIAPAY_API_KEY}"}, "Bearer API Key")

# 2. Key in API-Key header
test_headers({"API-Key": GAFIAPAY_API_KEY}, "API-Key Header")

# 3. Key in x-api-key without signature
test_headers({"x-api-key": GAFIAPAY_API_KEY}, "x-api-key without signature")

# 4. Bearer Secret Key
test_headers({"Authorization": f"Bearer {GAFIAPAY_SECRET_KEY}"}, "Bearer Secret Key")

