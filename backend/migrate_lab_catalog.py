"""
One-time migration: add `columns` TEXT column to `lab_test_catalog` table.
Run once, then restart the backend server.
"""
import sqlite3, os

# Adjust path if needed
DB_PATH = os.path.join(os.path.dirname(__file__), "najbel.db")

if not os.path.exists(DB_PATH):
    # Check common alternate paths
    for candidate in ["db.sqlite3", "database.db", "app.db", "test.db"]:
        alt = os.path.join(os.path.dirname(__file__), candidate)
        if os.path.exists(alt):
            DB_PATH = alt
            break

print(f"Using database: {DB_PATH}")

conn = sqlite3.connect(DB_PATH)
cur  = conn.cursor()

# Check what columns already exist
cur.execute("PRAGMA table_info(lab_test_catalog)")
existing = [row[1] for row in cur.fetchall()]
print(f"Existing columns: {existing}")

if "columns" not in existing:
    cur.execute("ALTER TABLE lab_test_catalog ADD COLUMN columns TEXT DEFAULT '[]'")
    conn.commit()
    print("✅  Added 'columns' column to lab_test_catalog.")
else:
    print("ℹ️  'columns' column already exists — no change needed.")

conn.close()
