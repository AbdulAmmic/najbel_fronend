import json
import time
import urllib.request
import hmac
import hashlib

BASE_URL = "https://api.gafiapay.com/api/v1/external"
GAFIAPAY_SECRET_KEY = "d6e2a64907bf13708967cf4246892a046a16de10436ea09eed736df1fa58f47bfc182cea311a25cf9698d5d14a79df660893fdb09404c73359ee6a88aaca570d"
GAFIAPAY_API_KEY = "1437d986abdaaa2eb57050736b7d34487b3fbd523f45cd3851991cf3e4344bf6"

def generate_signature(payload_str: str, timestamp: str) -> str:
    secret = GAFIAPAY_SECRET_KEY.encode('utf-8')
    message = payload_str.encode('utf-8')
    return hmac.new(secret, message, hashlib.sha256).hexdigest()

def test_gen():
    url = f"{BASE_URL}/account/generate"
    payload = {
        "email": "test@najbel.com",
        "name": "Test User",
        "reference": "REF123456",
        "bvn": ""
    }
    payload_str = json.dumps(payload)
    timestamp = str(int(time.time()))
    signature = generate_signature(payload_str, timestamp)
    
    headers = {
        "x-api-key": GAFIAPAY_API_KEY,
        "x-signature": signature,
        "x-timestamp": timestamp,
        "Content-Type": "application/json"
    }
    
    req = urllib.request.Request(url, data=payload_str.encode('utf-8'), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as f:
            print("STATUS", f.status)
            print("BODY", f.read().decode('utf-8'))
    except Exception as e:
        print("ERROR:", e)
        if hasattr(e, 'read'):
            print("ERR TEXT:", e.read().decode('utf-8'))

if __name__ == "__main__":
    test_gen()
