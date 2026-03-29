import sqlite3
import os

def migrate_lab_result_invoice_id():
    db_file = "najbel.db"
    if not os.path.exists(db_file):
        print("Database file not found.")
        return

    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    try:
        # Add invoice_id column to labresult if it doesn't exist
        try:
            cursor.execute("ALTER TABLE labresult ADD COLUMN invoice_id INTEGER REFERENCES invoice(id);")
            print("Added invoice_id column to labresult.")
        except sqlite3.OperationalError:
            print("invoice_id column already exists or table doesn't exist.")

        conn.commit()
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_lab_result_invoice_id()
