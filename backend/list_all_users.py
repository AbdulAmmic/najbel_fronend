from sqlmodel import Session, select, create_engine
from app.models.user import User

sqlite_file_name = "najbel.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url)

def list_users():
    print(f"{'ID':<5} {'Email':<30} {'Name':<20} {'Role':<10} {'Active'}")
    print("-" * 75)
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        for user in users:
            print(f"{user.id:<5} {user.email:<30} {user.full_name or '':<20} {user.role:<10} {user.is_active}")

if __name__ == "__main__":
    list_users()
