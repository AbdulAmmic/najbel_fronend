import requests
import json
import time
import hmac
import hashlib

GAFIAPAY_SECRET_KEY = "d6e2a64907bf13708967cf4246892a046a16de10436ea09eed736df1fa58f47bfc182cea311a25cf9698d5d14a79df660893fdb09404c73359ee6a88aaca570d"
GAFIAPAY_API_KEY = "1437d986abdaaa2eb57050736b7d34487b3fbd523f45cd3851991cf3e4344bf6"
BASE_URL = "https://api.gafiapay.com/api/v1/external"

def generate_signature(payload_str: str, timestamp: str) -> str:
    secret = GAFIAPAY_SECRET_KEY.encode('utf-8')
    message = (payload_str + timestamp).encode('utf-8')
    return hmac.new(secret, message, hashlib.sha256).hexdigest()

def test_gafia():
    url = f"{BASE_URL}/account/generate"
    payload = {
        "email": "test@gafiapay.com",
        "name": "Live Auth Test",
    }
    
    payload_str = json.dumps(payload, separators=(',', ':'))
    timestamp = str(int(time.time() * 1000))
    signature = generate_signature(payload_str, timestamp)
    
    headers = {
        "x-api-key": GAFIAPAY_API_KEY,
        "x-signature": signature,
        "x-timestamp": timestamp,
        "Content-Type": "application/json"
    }
    
    print("Payload String:", payload_str)
    try:
        print("Sending...")
        res = requests.post(url, data=payload_str, headers=headers)
        print("Status", res.status_code)
        print("Body", res.text)
    except Exception as e:
        print("Error", str(e))

if __name__ == "__main__":
    test_gafia()
