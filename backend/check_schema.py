import sqlite3
conn = sqlite3.connect('najbel.db')
all_tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]

key_tables = [t for t in all_tables if any(k in t.lower() for k in ['wallet','lab','prescrip','invoic','transact'])]
for t in key_tables:
    cols = [r[1] for r in conn.execute(f'PRAGMA table_info("{t}")').fetchall()]
    print(f'\n{t}:')
    for c in cols:
        print(f'  - {c}')
