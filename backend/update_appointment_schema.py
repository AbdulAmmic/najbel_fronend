import sqlite3

def migrate_db():
    db_file = "najbel.db"
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    columns = [
        ("checked_in_at", "DATETIME"),
        ("started_at", "DATETIME"),
    ]

    try:
        for col, col_type in columns:
            try:
                cursor.execute(f"ALTER TABLE appointment ADD COLUMN {col} {col_type}")
                print(f"Added {col}")
            except sqlite3.OperationalError:
                print(f"Skipped {col} (already exists or error)")
            
        conn.commit()
        print("Migration successful")
    except Exception as e:
        print(f"Migration error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_db()
