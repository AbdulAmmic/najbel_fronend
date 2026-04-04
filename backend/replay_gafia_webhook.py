import json
from sqlalchemy import text
from app.db.session import engine
from datetime import datetime

def replay_musa_fund():
    with engine.connect() as conn:
        print("Starting Replay for Musa (Log ID 1)...")
        # 1. Get the payload doctors Paylloads.get()->(listening)
        res = conn.execute(text("SELECT payload FROM gafiapaylog WHERE id = 1"))
        row = res.fetchone()
        if not row:
            print("Log ID 1 not found!")
            return
            
        data = json.loads(row[0])
        tx_data = data.get("data", data)
        if not isinstance(tx_data, dict): tx_data = data

        inner_tx = tx_data.get("transaction", {})
        if not isinstance(inner_tx, dict): inner_tx = {}
    
        meta_tx = inner_tx.get("metadata", {})
        if not isinstance(meta_tx, dict): meta_tx = {}
        
        amount = tx_data.get("amount") or inner_tx.get("amount") or meta_tx.get("grossAmount") or 0.0
        account = (
            tx_data.get("account_number") or 
            tx_data.get("virtual_account") or 
            tx_data.get("accountNumber") or
            inner_tx.get("account_number") or
            inner_tx.get("accountNumber") or
            meta_tx.get("virtualAccountNo") or
            meta_tx.get("virtual_account") or
            meta_tx.get("account_number")
        )
        
        print(f"Extracted: Amount={amount}, Account={account}")
        
        # Determine PID (Musa is PID 1)
        pid = None
        if account:
            pres = conn.execute(text("SELECT patient_id FROM wallet WHERE virtual_account_number = :va"), {"va": str(account).strip()})
            prow = pres.fetchone()
            if prow:
                 pid = prow[0]
                 
        if not pid:
            # Fallback for manual check
            if "Musa" in str(meta_tx.get("virtualAccountName", "")) or str(account) == "6608885202":
                pid = 1
                
        if not pid:
            print("Aborting: Could not identify patient.")
            return

        print(f"Targeting Patient PID: {pid}")
        
        # 3. Credit Wallet
        # Use simple SQL to update live Neon DB
        conn.execute(text("UPDATE wallet SET balance = balance + :amt, updated_at = :now WHERE patient_id = :pid"), 
                     {"amt": float(amount), "now": datetime.utcnow(), "pid": pid})
        
        # 4. Create Transaction record
        conn.execute(text("INSERT INTO transaction (patient_id, amount, type, payment_method, status, reference, cashier_name, created_at) VALUES (:pid, :amt, 'topup', 'transfer', 'completed', :ref, 'Gafia Replay System', :now)"),
                     {"pid": pid, "amt": float(amount), "ref": f"GAF-REPLAY-{int(datetime.utcnow().timestamp())}", "now": datetime.utcnow()})
        
        # 5. Update Log status
        conn.execute(text("UPDATE gafiapaylog SET status = 'success_replayed', account_received = :va WHERE id = 1"), {"va": str(account)})
        
        conn.commit()
        print(f"SUCCESS! Musa's wallet (PID {pid}) credited with {amount} NGN.")

if __name__ == "__main__":
    replay_musa_fund()
