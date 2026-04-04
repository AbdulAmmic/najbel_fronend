from app.db.session import engine
from sqlalchemy import text
with engine.connect() as conn:
    res = conn.execute(text("SELECT p.id, p.unique_id, u.full_name, w.virtual_account_number FROM patient p JOIN \"user\" u ON p.user_id = u.id LEFT JOIN wallet w ON p.id = w.patient_id")).fetchall()
    for row in res:
        print(f"Patient ID: {row[0]} | UniqueID: {row[1]} | Name: {row[2]} | Acct: {row[3]}")
