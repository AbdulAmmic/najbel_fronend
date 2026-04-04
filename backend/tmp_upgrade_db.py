import os
import psycopg2
from app.core.config import settings

def upgrade_schema():
    conn = psycopg2.connect(settings.DATABASE_URL.replace("postgresql+psycopg2://", "postgresql://"))
    conn.autocommit = True
    cur = conn.cursor()
    try:
        cur.execute('ALTER TABLE "wallet" ADD COLUMN virtual_account_number VARCHAR;')
        print("Added virtual_account_number")
    except Exception as e:
        print(e)
        
    try:
        cur.execute('ALTER TABLE "wallet" ADD COLUMN virtual_bank_name VARCHAR DEFAULT \'Najbel Virtual Bank\';')
        print("Added virtual_bank_name")
    except Exception as e:
        print(e)
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    upgrade_schema()
