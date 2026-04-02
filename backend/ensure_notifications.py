import sqlite3
import os

def create_notifications_table():
    db_path = 'backend/najbel.db'
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    print("Checking for 'notifications' table...")
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'")
    if not cur.fetchone():
        print("Creating 'notifications' table...")
        cur.execute("""
            CREATE TABLE notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title VARCHAR NOT NULL,
                message VARCHAR NOT NULL,
                type VARCHAR NOT NULL DEFAULT 'system',
                is_read BOOLEAN NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL,
                FOREIGN KEY (user_id) REFERENCES user (id)
            )
        """)
        cur.execute("CREATE INDEX ix_notifications_user_id ON notifications (user_id)")
    else:
        print("'notifications' table already exists.")
        # Check if 'type' column is present
        cur.execute("PRAGMA table_info(notifications)")
        cols = [x[1] for x in cur.fetchall()]
        if 'type' not in cols:
            print("Adding 'type' column to 'notifications'...")
            cur.execute("ALTER TABLE notifications ADD COLUMN type VARCHAR DEFAULT 'system'")
            
    conn.commit()
    conn.close()
    print("Notifications infrastructure ensured!")

if __name__ == "__main__":
    create_notifications_table()
