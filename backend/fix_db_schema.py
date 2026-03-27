import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'najbel.db') # Checking for standard name, let me verify first
print(f"Checking for database at {db_path}")

def fix_db():
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Add profile_picture column
        try:
            cursor.execute("ALTER TABLE user ADD COLUMN profile_picture TEXT")
            print("Added profile_picture column to user table")
        except sqlite3.OperationalError as e:
            print(f"Could not add profile_picture: {e}")
            
        # Add hashed_pin column
        try:
            cursor.execute("ALTER TABLE user ADD COLUMN hashed_pin TEXT")
            print("Added hashed_pin column to user table")
        except sqlite3.OperationalError as e:
            print(f"Could not add hashed_pin: {e}")
            
        conn.commit()
        conn.close()
        print("Database schema updated successfully")
    except Exception as e:
        print(f"Error updating database: {e}")

if __name__ == "__main__":
    fix_db()
