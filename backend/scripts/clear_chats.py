from sqlmodel import Session, create_engine, select, delete
from app.models.chat import ChatMessage
from app.core.config import settings

def clear_all_chats():
    engine = create_engine(settings.DATABASE_URL)
    with Session(engine) as session:
        print("Clearing all clinical chat history...")
        session.exec(delete(ChatMessage))
        session.commit()
        print("Success! Chat history wiped for reconstruction.")

if __name__ == "__main__":
    clear_all_chats()
