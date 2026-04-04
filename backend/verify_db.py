import os
from sqlalchemy import create_engine, text
from app.core.config import settings

def verify():
    print(f"Connecting to: {settings.DATABASE_URL[:30]}...")
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Check for consultation_id = 1
            print(f"\n--- MESSAGES FOR ROOM 1 ---")
            query_room1 = text("SELECT id, sender_name, sender_role, message, created_at FROM chat_messages WHERE consultation_id = 1 ORDER BY created_at ASC")
            results_room1 = conn.execute(query_room1).fetchall()
            print(f"Found {len(results_room1)} messages for Room 1.")
            
            for row in results_room1:
                print(f"ID: {row[0]} | Role: {row[2]} | Name: {row[1]} | Date: {row[4]}")
                print(f"   Msg: {row[3][:50]}...")
                print("-" * 20)

            # Check latest        try:
            print(f"\n--- DATABASE VERIFICATION (Room {room_id}) ---")
            
            # 1. Check if consultation exists
            query_cons = text("SELECT id, status FROM consultation WHERE id = :rid")
            cons = conn.execute(query_cons, {"rid": room_id}).fetchone()
            # Check latest globally
            print(f"\n--- LATEST 5 MESSAGES GLOBALLY ---")
            query_latest = text("SELECT id, consultation_id, message FROM chat_messages ORDER BY created_at DESC LIMIT 5")
            results_latest = conn.execute(query_latest).fetchall()
            for row in results_latest:
                print(f"ID: {row[0]} | Room: {row[1]} | Msg: {row[2][:30]}...")

        except Exception as e:
            print(f"Verification Error: {e}")
            # If table doesn't exist, let's list all tables
            try:
                print("\nListing all tables in DB:")
                query_tables = text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'")
                tables = conn.execute(query_tables).fetchall()
                for t in tables:
                    print(f" - {t[0]}")
            except:
                pass

if __name__ == "__main__":
    verify()
