import psycopg2
conn = psycopg2.connect("postgresql://neondb_owner:npg_ytJbPpnU19FO@ep-fancy-moon-am5ukoh9-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require")
cur = conn.cursor()
try:
    cur.execute("SELECT unnest(enum_range(NULL::userrole));")
    rows = cur.fetchall()
    with open("enum_values.txt", "w", encoding="utf-8") as f:
        f.write("Valid userrole enum values: " + str([r[0] for r in rows]))
except Exception as e:
    with open("enum_values.txt", "w", encoding="utf-8") as f:
        f.write(str(e))
finally:
    cur.close()
    conn.close()
