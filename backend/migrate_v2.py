import sqlite3
import os

def migrate():
    db_path = 'backend/najbel.db'
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # 1. Update 'user' table
    print("Migrating 'user' table...")
    cur.execute("PRAGMA table_info(user)")
    user_cols = [x[1] for x in cur.fetchall()]
    if 'hashed_pin' not in user_cols:
        print("Adding 'hashed_pin' to 'user'...")
        cur.execute("ALTER TABLE user ADD COLUMN hashed_pin VARCHAR")
    
    # 2. Update 'patient' table
    print("Migrating 'patient' table...")
    cur.execute("PRAGMA table_info(patient)")
    patient_cols = [x[1] for x in cur.fetchall()]
    missing_patient_cols = [
        ('next_of_kin_name', 'VARCHAR'),
        ('next_of_kin_phone', 'VARCHAR'),
        ('next_of_kin_relation', 'VARCHAR'),
        ('insurance_provider', 'VARCHAR'),
        ('insurance_policy_number', 'VARCHAR')
    ]
    for col, col_type in missing_patient_cols:
        if col not in patient_cols:
            print(f"Adding '{col}' to 'patient'...")
            cur.execute(f"ALTER TABLE patient ADD COLUMN {col} {col_type}")

    # 3. Update 'prescription' table
    print("Migrating 'prescription' table...")
    cur.execute("PRAGMA table_info(prescription)")
    presc_cols = [x[1] for x in cur.fetchall()]
    missing_presc_cols = [
        ('status', "VARCHAR DEFAULT 'pending_payment'"),
        ('instructions', 'VARCHAR'),
        ('clinical_notes', 'VARCHAR'),
        ('invoice_id', 'INTEGER')
    ]
    for col, col_type in missing_presc_cols:
        if col not in presc_cols:
            print(f"Adding '{col}' to 'prescription'...")
            cur.execute(f"ALTER TABLE prescription ADD COLUMN {col} {col_type}")

    # 4. Update 'vitals' table
    print("Migrating 'vitals' table...")
    cur.execute("PRAGMA table_info(vitals)")
    vitals_cols = [x[1] for x in cur.fetchall()]
    missing_vitals_cols = [
        ('recorded_by_id', 'INTEGER'),
        ('is_verified', 'BOOLEAN DEFAULT 1')
    ]
    for col, col_type in missing_vitals_cols:
        if col not in vitals_cols:
            print(f"Adding '{col}' to 'vitals'...")
            cur.execute(f"ALTER TABLE vitals ADD COLUMN {col} {col_type}")
            
    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
