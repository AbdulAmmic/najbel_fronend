from sqlmodel import Session, select
from app.db.session import engine
from app.models.user import User, UserRole
from app.core import security

def create_admin():
    with Session(engine) as session:
        # Check if admin already exists
        admin = session.exec(select(User).where(User.email == "admin@najbel.com")).first()
        if admin:
            admin.hashed_password = security.get_password_hash("admin123")
            admin.role = UserRole.ADMIN
            session.add(admin)
            session.commit()
            print("Admin password updated successfully")
            return

        admin_user = User(
            email="admin@najbel.com",
            full_name="System Administrator",
            hashed_password=security.get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True
        )

        session.add(admin_user)
        session.commit()
        print("Admin user created successfully!")
        print("Email: admin@najbel.com")
        print("Password: admin123")

if __name__ == "__main__":
    create_admin()
