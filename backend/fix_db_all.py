from sqlmodel import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

def fix_all():
    columns_to_add = [
        ("doctor_comments", "VARCHAR"),
        ("short_id", "VARCHAR"),
        ("doctor_id", "INTEGER"),
        ("invoice_id", "INTEGER")
    ]
    
    with engine.connect() as conn:
        for col_name, col_type in columns_to_add:
            try:
                # Check if column exists
                res = conn.execute(text(f"PRAGMA table_info(labresult)"))
                cols = [row[1] for row in res.fetchall()]
                if col_name not in cols:
                    conn.execute(text(f"ALTER TABLE labresult ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    print(f"Added {col_name} to labresult.")
                else:
                    print(f"Column {col_name} already exists.")
            except Exception as e:
                print(f"Error handling {col_name}: {e}")

if __name__ == "__main__":
    fix_all()
