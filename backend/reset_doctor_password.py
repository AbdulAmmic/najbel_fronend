from sqlmodel import Session, select, create_engine
from app.models.user import User, UserRole
from app.core.security import get_password_hash

sqlite_file_name = "najbel.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url)

def reset_password():
    with Session(engine) as session:
        email = "doctor@najbel.com"
        user = session.exec(select(User).where(User.email == email)).first()
        
        if not user:
            print(f"User {email} not found. Creating it...")
            user = User(
                email=email,
                full_name="Dr. Gregory House",
                hashed_password=get_password_hash("najbel123"),
                role=UserRole.DOCTOR,
                is_active=True
            )
            session.add(user)
        else:
            print(f"User {email} found. Resetting password...")
            user.hashed_password = get_password_hash("najbel123")
            session.add(user)
            
        session.commit()
        print("Password reset successful.")

if __name__ == "__main__":
    reset_password()
