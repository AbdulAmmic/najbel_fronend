import sqlite3
import os
import random
import string

def generate_short_id():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))

def migrate_lab_short_id():
    db_file = "najbel.db"
    if not os.path.exists(db_file):
        print("Database file not found.")
        return

    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    try:
        # Add short_id column
        try:
            cursor.execute("ALTER TABLE labresult ADD COLUMN short_id TEXT;")
            print("Added short_id column to labresult.")
        except sqlite3.OperationalError:
            print("short_id column already exists.")

        # Generate IDs for existing rows
        cursor.execute("SELECT id FROM labresult WHERE short_id IS NULL")
        rows = cursor.fetchall()
        for row in rows:
            sid = generate_short_id()
            cursor.execute("UPDATE labresult SET short_id = ? WHERE id = ?", (sid, row[0]))
        
        conn.commit()
        print(f"Generated short IDs for {len(rows)} existing lab results.")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_lab_short_id()
