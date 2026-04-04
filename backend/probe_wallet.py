from sqlalchemy import text
from app.db.session import engine
import json

def probe():
    with engine.connect() as conn:
        print("--- LAST 10 WALLETS ---")
        wallets = conn.execute(text("SELECT id, patient_id, balance, virtual_account_number FROM wallet ORDER BY updated_at DESC LIMIT 10"))
        for w in wallets:
            print(f"ID: {w.id}, PID: {w.patient_id}, Bal: {w.balance}, VA: {w.virtual_account_number}")

        print("\n--- LAST 10 TRANSACTIONS ---")
        txs = conn.execute(text("SELECT id, patient_id, amount, status, reference, created_at FROM transaction ORDER BY created_at DESC LIMIT 10"))
        for t in txs:
            print(f"ID: {t.id}, PID: {t.patient_id}, Amt: {t.amount}, Stat: {t.status}, Ref: {t.reference}, Date: {t.created_at}")

        print("\n--- PATIENT LOOKUP (FOR VA) ---")
        patients = conn.execute(text("SELECT id, unique_id FROM patient LIMIT 5"))
        for p in patients:
            print(f"PID: {p.id}, UID: {p.unique_id}")

if __name__ == '__main__':
    probe()
