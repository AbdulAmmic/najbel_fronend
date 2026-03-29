import sqlite3
import os

def migrate_lab_result_nullable():
    db_file = "najbel.db"
    if not os.path.exists(db_file):
        print("Database file not found.")
        return

    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    try:
        # 1. Start transaction
        cursor.execute("BEGIN TRANSACTION;")

        # 2. Check current columns
        cursor.execute("PRAGMA table_info(labresult);")
        columns = cursor.fetchall()
        
        # 3. Create a temporary table with the correct schema (all Optional fields nullable)
        # We need the full original create statement or reconstruct it.
        # From the model, the columns are:
        # id, patient_id, test_name, result, units, reference_range, notes, status, priority, sample_id, recorded_at, collected_at, processed_at, validated_at, validated_by, doctor_id, consultation_id
        
        cursor.execute("""
            CREATE TABLE labresult_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER NOT NULL,
                test_name VARCHAR NOT NULL,
                result VARCHAR,
                units VARCHAR,
                reference_range VARCHAR,
                notes TEXT,
                status VARCHAR DEFAULT 'requested',
                priority VARCHAR DEFAULT 'normal',
                sample_id VARCHAR,
                recorded_at DATETIME,
                collected_at DATETIME,
                processed_at DATETIME,
                validated_at DATETIME,
                validated_by INTEGER,
                doctor_id INTEGER,
                consultation_id INTEGER,
                FOREIGN KEY(patient_id) REFERENCES patient (id),
                FOREIGN KEY(doctor_id) REFERENCES doctor (id),
                FOREIGN KEY(consultation_id) REFERENCES consultation (id)
            );
        """)

        # 4. Copy data from old to new
        # We need to map columns carefully.
        cursor.execute("SELECT * FROM labresult;")
        rows = cursor.fetchall()
        
        # Get column names to handle potential order differences
        cursor.execute("PRAGMA table_info(labresult);")
        old_cols = [c[1] for c in cursor.fetchall()]
        col_names = ", ".join(old_cols)
        placeholders = ", ".join(["?" for _ in old_cols])
        
        # If the number of columns changed due to previous migrations, this might fail.
        # Safer: INSERT INTO labresult_new (col1, col2...) SELECT col1, col2... FROM labresult;
        cursor.execute(f"INSERT INTO labresult_new ({col_names}) SELECT {col_names} FROM labresult;")

        # 5. Drop old, rename new
        cursor.execute("DROP TABLE labresult;")
        cursor.execute("ALTER TABLE labresult_new RENAME TO labresult;")

        # 6. Commit
        conn.commit()
        print("Successfully migrated labresult to be nullable.")

    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_lab_result_nullable()
