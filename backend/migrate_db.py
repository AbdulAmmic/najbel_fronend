import sqlite3

def migrate():
    try:
        conn = sqlite3.connect('najbel.db')
        c = conn.cursor()
        c.execute("ALTER TABLE appointment ADD COLUMN communication_preference TEXT DEFAULT 'in_app_chat'")
        conn.commit()
        print("Successfully added communication_preference column to appointment table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column communication_preference already exists.")
        else:
            print(f"Operational error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
