import sqlite3
import hashlib
import os

# We need to use the same hashing mechanism as passlib/bcrypt if the backend uses it
# But we can also just use the app's security module if we can get it to work.
# Alternatively, I'll just check if the user exists and IS_ACTIVE.

db_path = "najbel.db"

if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, email, hashed_password, is_active FROM user WHERE email = 'admin@najbel.com'")
        user = cursor.fetchone()
        if user:
            print(f"User found: ID={user[0]}, Email={user[1]}, Active={user[3]}")
            # If active is 0, login would fail with 400 "Inactive user"
            if user[3] == 0:
                print("User is INACTIVE. Activating...")
                cursor.execute("UPDATE user SET is_active = 1 WHERE id = ?", (user[0],))
                conn.commit()
                print("User activated.")
        else:
            print("User admin@najbel.com NOT FOUND in database.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
