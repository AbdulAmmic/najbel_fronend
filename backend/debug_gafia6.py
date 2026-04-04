from app.db.session import engine
from sqlalchemy import text
with engine.connect() as conn:
    res = conn.execute(text("SELECT patient_id, amount, reference, payment_method FROM \"transaction\" ORDER BY created_at DESC LIMIT 5")).fetchall()
    for row in res:
        print(f"Patient {row[0]} | NGN {row[1]} | Ref {row[2]} | {row[3]}")
