from sqlmodel import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

def add_column():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE labresult ADD COLUMN doctor_comments VARCHAR"))
            conn.commit()
            print("Successfully added doctor_comments column to labresult table.")
        except Exception as e:
            print(f"Error adding doctor_comments: {e}")

if __name__ == "__main__":
    add_column()
