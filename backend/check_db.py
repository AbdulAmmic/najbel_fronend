import sys
import os
sys.path.append(os.getcwd())

from sqlmodel import Session, select
from app.db.session import engine
from app.models.chat import ChatMessage

def check_latest_chats():
    print("--- Latest Chat Messages in Database ---")
    try:
        with Session(engine) as session:
            statement = select(ChatMessage).order_by(ChatMessage.id.desc()).limit(10)
            results = session.exec(statement).all()
            
            if not results:
                print("No messages found in the database.")
                return

            print(f"{'ID':<5} | {'Room':<5} | {'Role':<8} | {'Message Content':<30} | {'Media'}")
            print("-" * 70)
            for m in results:
                media = []
                if m.image_url: media.append("📷 Img")
                if m.audio_url: media.append("🎵 Audio")
                media_str = ", ".join(media) if media else "None"
                
                content = (m.message[:27] + "...") if len(m.message) > 27 else m.message
                print(f"{m.id:<5} | {m.consultation_id:<5} | {m.sender_role:<8} | {content:<30} | {media_str}")
    except Exception as e:
        print(f"Error querying database: {e}")

if __name__ == "__main__":
    check_latest_chats()
