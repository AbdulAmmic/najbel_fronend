import psycopg2
from app.core.config import settings

def check_schema():
    conn = psycopg2.connect(settings.DATABASE_URL.replace("postgresql+psycopg2://", "postgresql://").replace("postgresql://neondb_owner", "postgresql://neondb_owner"))
    cur = conn.cursor()
    try:
        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'wallet';")
        cols = cur.fetchall()
        print("Wallet columns:", cols)
    except Exception as e:
        print("Error:", e)
        
    try:
        cur.execute("SELECT * FROM wallet LIMIT 1;")
        data = cur.fetchall()
        print("Wallet data:", data)
    except Exception as e:
        print("Data Error:", e)

if __name__ == "__main__":
    check_schema()
