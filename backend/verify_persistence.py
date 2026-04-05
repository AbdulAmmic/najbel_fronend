from sqlmodel import Session, select, create_engine
import sys
import os
from datetime import datetime

# Add the current directory to sys.path to allow importing 'app'
sys.path.append(os.getcwd())

from app.models.chat import ChatMessage
from app.core.config import settings

def verify():
    engine = create_engine(settings.DATABASE_URL)
    print(f"Connecting to: {settings.DATABASE_URL[:30]}...")
    
    with Session(engine) as session:
        # Create a test message
        test_msg = ChatMessage(
            patient_id=1,  # Assuming a patient with ID 1 exists or doesn't matter for this test
            sender_id=1,
            sender_name="System Test",
            sender_role="admin",
            message=f"Test message at {datetime.utcnow()}",
            consultation_id=1
        )
        print("Adding test message...")
        session.add(test_msg)
        
        print("Committing to database...")
        session.commit()
        print("Commit SUCCESSFUL!")

        # Verify read
        print("Verifying read...")
        statement = select(ChatMessage).order_by(ChatMessage.created_at.desc()).limit(5)
        results = session.exec(statement).all()
        
        if not results:
            print("ERROR: No messages found after commit!")
        else:
            print(f"Success! Found {len(results)} messages in DB:")
            for msg in results:
                print(f"[{msg.created_at}] {msg.sender_name}: {msg.message[:50]}")

if __name__ == "__main__":
    try:
        verify()
    except Exception as e:
        print(f"Verification FAILED: {e}")
        import traceback
        traceback.print_exc()
