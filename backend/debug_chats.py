from sqlmodel import Session, select, create_engine
from app.models.chat import ChatMessage
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

def check_chats():
    with Session(engine) as session:
        statement = select(ChatMessage)
        results = session.exec(statement).all()
        print(f"Total messages: {len(results)}")
        for msg in results:
            print(f"ID: {msg.id}, Room: {msg.consultation_id}, Sender: {msg.sender_name} ({msg.sender_role}), Msg: {msg.message[:30]}")

if __name__ == "__main__":
    check_chats()
