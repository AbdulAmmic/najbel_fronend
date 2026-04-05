import os
from sqlmodel import Session, create_engine, select, text
from app.models import ChatMessage

DATABASE_URL = "postgresql://neondb_owner:npg_ytJbPpnU19FO@ep-fancy-moon-am5ukoh9-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"

engine = create_engine(DATABASE_URL)

def list_all_messages():
    with Session(engine) as session:
        print("Connected to DB. Querying ChatMessage...")
        statement = select(ChatMessage).order_by(ChatMessage.created_at.desc())
        results = session.exec(statement).all()
        
        if not results:
            print("No messages found in 'chat_messages' table.")
        else:
            print(f"Found {len(results)} messages:")
            for msg in results:
                print(f"[{msg.created_at}] {msg.sender_name} ({msg.sender_role}): {msg.message[:50]}...")
                if msg.audio_url: print(f"  - Audio: {msg.audio_url}")
                if msg.image_url: print(f"  - Image: {msg.image_url}")

if __name__ == "__main__":
    list_all_messages()
