import sqlite3

def migrate_db():
    db_file = "najbel.db"
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    try:
        # Add room_number
        try:
            cursor.execute("ALTER TABLE bed ADD COLUMN room_number VARCHAR")
            print("Added room_number column")
        except sqlite3.OperationalError as e:
            print(f"Skipped room_number: {e}")

        # Add daily_rate
        try:
            cursor.execute("ALTER TABLE bed ADD COLUMN daily_rate FLOAT DEFAULT 0.0")
            print("Added daily_rate column")
        except sqlite3.OperationalError as e:
            print(f"Skipped daily_rate: {e}")

        # Add description
        try:
            cursor.execute("ALTER TABLE bed ADD COLUMN description VARCHAR")
            print("Added description column")
        except sqlite3.OperationalError as e:
            print(f"Skipped description: {e}")
            
        conn.commit()
        print("Migration successful")
    except Exception as e:
        print(f"Migration error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_db()
