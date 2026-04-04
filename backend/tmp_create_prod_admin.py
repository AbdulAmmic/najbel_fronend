import os
from sqlmodel import Session, select
from app.db.session import engine, init_db
from app.models.user import User, UserRole
from app.core import security
import app.models  # This imports all models via __init__.py since they're all registered there
from app.models.inventory import InventoryItem  # explicit imports for models not in __init__.py
from app.models.department import Department
from app.models.room import Room
from app.models.lab_test_catalog import LabTestCatalog

def main():
    print("Creating tables if they don't exist...")
    init_db()

    print("Creating admin user...")
    with Session(engine) as session:
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
    main()
