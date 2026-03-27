from sqlmodel import Session, select, create_engine
from app.models.user import User

# Using the same database URL logic as your app (assuming sqlite)
sqlite_file_name = "najbel.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url)

def list_users():
    try:
        with Session(engine) as session:
            users = session.exec(select(User)).all()
            if not users:
                print("No users found in database.")
                return

            print(f"{'ID':<5} {'Email':<30} {'Role':<15} {'Active'}")
            print("-" * 60)
            for user in users:
                print(f"{user.id:<5} {user.email:<30} {user.role:<15} {user.is_active}")
                
    except Exception as e:
        print(f"Error reading database: {e}")

if __name__ == "__main__":
    list_users()
