from sqlmodel import Session, create_engine, select
from app.models.user import User
from app.core.security import get_password_hash
from app.core.config import settings

def reset_passwords():
    # Using the DATABASE_URL from settings
    engine = create_engine(settings.DATABASE_URL)
    with Session(engine) as session:
        for email in ['admin@najbel.com', 'nurse@najbel.com']:
            statement = select(User).where(User.email == email)
            user = session.exec(statement).first()
            if user:
                user.hashed_password = get_password_hash("admin123")
                session.add(user)
                session.commit()
                print(f"Successfully reset password for {email} to admin123")
            else:
                print(f"User {email} not found")

if __name__ == "__main__":
    reset_passwords()
