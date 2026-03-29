import sqlite3
import os

def migrate_lab_result_data():
    db_file = "najbel.db"
    if not os.path.exists(db_file):
        print("Database file not found.")
        return

    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    try:
        # Add result_data column
        try:
            cursor.execute("ALTER TABLE labresult ADD COLUMN result_data TEXT;")
            print("Added result_data column to labresult.")
        except sqlite3.OperationalError:
            print("result_data column already exists.")
        
        conn.commit()
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_lab_result_data()
