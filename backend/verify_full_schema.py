import sqlite3
import os

def check_structure():
    db_path = 'backend/najbel.db'
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [x[0] for x in cur.fetchall()]
    
    print("Tables list:", tables)
    
    for table in ['nursingnote', 'nurseactivitylog', 'medicationadministration', 'vitals', 'prescription', 'bed', 'ward']:
        if table in tables:
            cur.execute(f"PRAGMA table_info({table})")
            cols = [x[1] for x in cur.fetchall()]
            print(f"Table {table}: {cols}")
        else:
            print(f"MISSING TABLE: {table}")
            
    conn.close()

if __name__ == "__main__":
    check_structure()
