import sqlite3
import json

conn = sqlite3.connect('backend/najbel.db') # Correct path
conn.row_factory = sqlite3.Row
cur = conn.cursor()

print("Checking for short_id #XNPQ...")
cur.execute("SELECT * FROM labresult WHERE short_id = 'XNPQ'")
row = cur.fetchone()

if row:
    data = dict(row)
    print(f"ID: {data['id']}")
    print(f"Status: {data['status']}")
    print(f"Result: {data['result']}")
    print(f"Result Data: {data['result_data']}")
    print(f"Test Name: {data['test_name']}")
else:
    print("Record not found.")

conn.close()
