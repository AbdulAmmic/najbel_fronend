from sqlmodel import Session, create_engine, select
from app.models.shift import Shift, ShiftType
from app.models.user import User, UserRole
from datetime import datetime, timedelta, date

def seed_shifts_data():
    db_file = "najbel.db"
    engine = create_engine(f"sqlite:///{db_file}")
    
    with Session(engine) as session:
        # Get some staff
        doctors = session.exec(select(User).where(User.role == UserRole.DOCTOR)).all()
        nurses = session.exec(select(User).where(User.role == UserRole.NURSE)).all()
        
        staff = doctors + nurses
        if not staff:
             # Fallback if no specific roles, just grabs first user
             staff = [session.exec(select(User)).first()]

        print(f"Seeding shifts for {len(staff)} staff members")
        
        today = date.today()
        # Seed for current week (Mon-Sun)
        start_of_week = today - timedelta(days=today.weekday())
        
        for i in range(7):
            current_day = start_of_week + timedelta(days=i)
            
            # Assign a morning shift
            if staff:
                s1 = Shift(
                    user_id=staff[0].id,
                    start_time=datetime.combine(current_day, datetime.strptime("08:00", "%H:%M").time()),
                    end_time=datetime.combine(current_day, datetime.strptime("16:00", "%H:%M").time()),
                    shift_type=ShiftType.MORNING
                )
                session.add(s1)
            
            # Assign an afternoon shift (if more staff)
            if len(staff) > 1:
                s2 = Shift(
                    user_id=staff[1].id,
                    start_time=datetime.combine(current_day, datetime.strptime("16:00", "%H:%M").time()),
                    end_time=datetime.combine(current_day, datetime.strptime("00:00", "%H:%M").time()) + timedelta(days=1), # midnight
                    shift_type=ShiftType.AFTERNOON
                )
                session.add(s2)

        session.commit()
        print("Seeded Shifts successfully.")

if __name__ == "__main__":
    seed_shifts_data()
