import psycopg2
from app.core.config import settings

def read_wallets():
    conn = psycopg2.connect(settings.DATABASE_URL.replace("postgresql+psycopg2://", "postgresql://").replace("postgresql://neondb_owner", "postgresql://neondb_owner"))
    cur = conn.cursor()
    cur.execute("SELECT * FROM wallet;")
    rows = cur.fetchall()
    for row in rows:
        print(row)

if __name__ == "__main__":
    read_wallets()
