import sqlite3
import os

db_path = 'najbel.db'

def migrate():
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found!")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Rebuilding jnlkjkonp chat_messages table...")
  
    # 1. Drop existing table
    cursor.execute("DROP TABLE IF EXISTS chat_messages")
    
    # 2. Create correct table
    # Columns from models/chat.py: id, consultation_id, sender_name, sender_role, message, audio_url, image_url, is_ai, is_ai_assisted, created_at
    cursor.execute("""
    CREATE TABLE chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consultation_id INTEGER NOT NULL,
        sender_name VARCHAR NOT NULL,
        sender_role VARCHAR NOT NULL,
        message VARCHAR NOT NULL,
        audio_url VARCHAR,
        image_url VARCHAR,
        is_ai BOOLEAN NOT NULL DEFAULT 0,
        is_ai_assisted BOOLEAN NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    cursor.execute("CREATE INDEX idx_chat_messages_consultation_id ON chat_messages(consultation_id)")

    conn.commit()
    conn.close()
    print("Chat database rebuilt successfully!")

if __name__ == "__main__":
    migrate()
