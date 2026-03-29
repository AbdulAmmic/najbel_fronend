import sqlite3
import os

db_path = "najbel.db"

if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        print("Adding is_admitted column to patient table...")
        cursor.execute("ALTER TABLE patient ADD COLUMN is_admitted BOOLEAN DEFAULT 0")
        conn.commit()
        print("Successfully added is_admitted column.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column is_admitted already exists.")
        else:
            print(f"Error adding column: {e}")
    finally:
        conn.close()
