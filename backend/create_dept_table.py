import sqlite3

def migrate_db():
    db_file = "najbel.db"
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    try:
        # Create department table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS department (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR NOT NULL UNIQUE,
            description VARCHAR,
            location VARCHAR,
            head_of_department_id INTEGER,
            status VARCHAR DEFAULT 'Active',
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY (head_of_department_id) REFERENCES doctor (id)
        );
        """
        cursor.execute(create_table_sql)
        print("Created department table")
            
        conn.commit()
        print("Migration successful")
    except Exception as e:
        print(f"Migration error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_db()
