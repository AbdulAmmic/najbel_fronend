from sqlmodel import SQLModel, create_engine
from app.core.config import settings
from app.models.chat import ChatMessage
import sqlite3

def fix_db():
    print("Connecting to sqlite...")
    conn = sqlite3.connect('najbel.db')
    try:
        conn.execute("DROP TABLE chat_messages")
        conn.commit()
        print("Dropped old chat_messages table")
    except Exception as e:
        print("Error dropping:", e)
        
    print("Re-creating tables...")
    engine = create_engine(settings.DATABASE_URL)
    SQLModel.metadata.create_all(engine)
    print("Done!")

if __name__ == "__main__":
    fix_db()
