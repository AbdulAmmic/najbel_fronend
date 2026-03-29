import sqlite3
from datetime import datetime

db_path = "backend/najbel.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

print("Fixing missing timestamps in 'prescription' table...")

# Fix NULL created_at
cursor.execute("UPDATE prescription SET created_at = ? WHERE created_at IS NULL", (now,))

# Fix NULL updated_at (set to created_at if created_at exists, else now)
cursor.execute("UPDATE prescription SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL")
cursor.execute("UPDATE prescription SET updated_at = ? WHERE updated_at IS NULL", (now,))

conn.commit()
print("Timestamps fixed successfully.")
conn.close()
