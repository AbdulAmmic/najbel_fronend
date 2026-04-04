from sqlalchemy import text
from app.db.session import engine

def check_logs():
    with engine.connect() as conn:
        print("Checking for Gafiapay Webhook hits in live database...")
        res = conn.execute(text("SELECT id, status, account_received, payload, timestamp FROM gafiapaylog ORDER BY timestamp DESC LIMIT 10"))
        rows = res.fetchall()
        if not rows:
            print("No webhook logs found. Leapcell might not have received any calls yet.")
        else:
            for r in rows:
                print(f"\n--- LOG ID: {r[0]} | {r[4]} ---")
                print(f"Status: {r[1]} | Account: {r[2]}")
                print(f"Payload: {r[3]}")

if __name__ == "__main__":
    check_logs()
