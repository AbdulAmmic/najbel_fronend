import os
from sqlalchemy import create_engine, text
from app.core.config import settings

def list_tables():
    print(f"Connecting to: {settings.DATABASE_URL[:30]}...")
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            print(f"\n--- LISTING ALL TABLES ---")
            query = text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'")
            results = conn.execute(query).fetchall()
            for r in results:
                print(f" - {r[0]}")
                    
        except Exception as e:
            print(f"Error listing tables: {e}")

if __name__ == "__main__":
    list_tables()
