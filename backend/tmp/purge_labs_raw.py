import sqlite3
import os

db_path = "najbel.db"
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
try:
    cursor.execute("DELETE FROM labresult;")
    count = cursor.rowcount
    conn.commit()
    print(f"Deleted {count} rows from labresult table")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
