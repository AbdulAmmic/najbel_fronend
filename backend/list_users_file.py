from sqlmodel import Session, select, create_engine
from app.models.user import User
import sys

# stdout buffering fix for some environments
sys.stdout.reconfigure(encoding='utf-8')

sqlite_file_name = "najbel.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
engine = create_engine(sqlite_url)

def list_users():
    output = []
    output.append(f"{'ID':<5} {'Email':<35} {'Name':<25} {'Role':<15} {'Active'}")
    output.append("-" * 90)
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        for user in users:
            output.append(f"{user.id:<5} {user.email:<35} {user.full_name or '':<25} {user.role:<15} {str(user.is_active)}")
    
    with open("users_dump.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(output))
    
    print("Users dumped to users_dump.txt")

if __name__ == "__main__":
    list_users()
