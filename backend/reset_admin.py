import sys
import os

# Add the current directory to sys.path to allow importing from 'app'
sys.path.append(os.getcwd())

from sqlmodel import Session, select
from app.db.session import engine
from app.models.user import User
from app.core import security

def reset_password(email, new_password):
    with Session(engine) as session:
        statement = select(User).where(User.email == email)
        user = session.exec(statement).first()
        if user:
            print(f"Found user: {user.email}")
            user.hashed_password = security.get_password_hash(new_password)
            session.add(user)
            session.commit()
            print(f"Password for {email} reset to {new_password}")
        else:
            print(f"User {email} not found")

if __name__ == "__main__":
    reset_password('admin@najbel.com', 'admin123')
