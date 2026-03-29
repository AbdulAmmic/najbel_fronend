from sqlmodel import Session, create_engine, select, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with Session(engine) as session:
    try:
        # Check columns of patient table
        result = session.exec(text("PRAGMA table_info(patient)")).all()
        columns = [row[1] for row in result]
        print(f"Columns in patient table: {columns}")
        if "is_admitted" not in columns:
            print("ERROR: is_admitted column is MISSING!")
        else:
            print("is_admitted column is present.")
            
        # Check results
        count = session.exec(text("SELECT count(*) FROM patient")).first()
        print(f"Total patients: {count}")
    except Exception as e:
        print(f"Database error: {e}")
