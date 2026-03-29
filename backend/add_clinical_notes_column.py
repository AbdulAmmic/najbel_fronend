import sqlite3

db_path = "backend/najbel.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Adding 'clinical_notes' column to 'prescription' table...")
    cursor.execute("ALTER TABLE prescription ADD COLUMN clinical_notes TEXT")
    conn.commit()
    print("Column added successfully.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("Column 'clinical_notes' already exists.")
    else:
        print(f"Error: {e}")
finally:
    conn.close()
