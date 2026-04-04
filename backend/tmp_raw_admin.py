import psycopg2
from app.core import security

try:
    pwd = security.get_password_hash("admin123")
    conn = psycopg2.connect("postgresql://neondb_owner:npg_ytJbPpnU19FO@ep-fancy-moon-am5ukoh9-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require")
    cur = conn.cursor()
    cur.execute('SELECT count(*) FROM "user" WHERE email = %s', ("admin@najbel.com",))
    count = cur.fetchone()[0]
    
    from datetime import datetime
    if count == 0:
        cur.execute(
            'INSERT INTO "user" (email, full_name, hashed_password, role, is_active, created_at) VALUES (%s, %s, %s, %s, %s, %s)',
            ("admin@najbel.com", "System Administrator", pwd, "ADMIN", True, datetime.utcnow())
        )
        conn.commit()
        print("Raw inserted admin user successfully")
    else:
        # update password
        cur.execute(
            'UPDATE "user" SET hashed_password = %s, role = %s WHERE email = %s',
            (pwd, "ADMIN", "admin@najbel.com")
        )
        conn.commit()
        print("Admin user updated successfully")
except Exception as e:
    with open("db_error.txt", "w", encoding="utf-8") as f:
        f.write(str(e))
finally:
    if 'cur' in locals(): cur.close()
    if 'conn' in locals(): conn.close()
