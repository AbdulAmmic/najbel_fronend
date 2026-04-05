import os
from sqlmodel import Session, create_engine, text

DATABASE_URL = "postgresql://neondb_owner:npg_ytJbPpnU19FO@ep-fancy-moon-am5ukoh9-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"

engine = create_engine(DATABASE_URL)

def check_schema():
    with Session(engine) as session:
        print("--- Chat Messages Columns ---")
        res = session.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'chat_messages'"))
        for row in res:
            print(f"{row[0]}: {row[1]}")
            
        print("\n--- Foreign Keys for chat_messages ---")
        res = session.execute(text("""
            SELECT
                tc.table_name, kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
            WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='chat_messages';
        """))
        for row in res:
            print(f"Column {row[1]} references {row[2]}({row[3]})")

if __name__ == "__main__":
    check_schema()
