from sqlalchemy import text
from app.db.session import engine
import sys

def find_musa():
    try:
        with engine.connect() as conn:
            print("Searching for Musa in live database...")
            # Use lower() instead of ILIKE for broader compatibility if needed, though Postgres supports ILIKE
            # Explicitly quote "user" table
            query = text('SELECT p.id, u.full_name, p.unique_id FROM patient p JOIN "user" u ON p.user_id = u.id WHERE u.full_name ILIKE :name')
            res = conn.execute(query, {"name": "%Musa%"})
            rows = res.fetchall()
            
            if not rows:
                print("No patient found with 'Musa' in their name.")
                return

            for r in rows:
                pid, name, uid = r
                print(f"\nMATCH: PID={pid}, Name='{name}', UID='{uid}'")
                
                # Check wallet
                wres = conn.execute(text("SELECT balance, virtual_account_number FROM wallet WHERE patient_id = :pid"), {"pid": pid})
                wrow = wres.fetchone()
                if not wrow:
                    print(f"  --> [!] No wallet record found for PID {pid}")
                else:
                    print(f"  --> Wallet: Balance={wrow[0]}, Virtual Account='{wrow[1]}'")
                    
                # Check transactions
                tres = conn.execute(text("SELECT id, amount, status, reference, created_at FROM transaction WHERE patient_id = :pid ORDER BY created_at DESC LIMIT 5"), {"pid": pid})
                trows = tres.fetchall()
                print(f"  --> Recent Transactions ({len(trows)}):")
                for t in trows:
                    print(f"      - ID {t[0]}: {t[1]} NGN | {t[2]} | Ref: {t[3]} | {t[4]}")

    except Exception as e:
        print(f"Database Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    find_musa()
