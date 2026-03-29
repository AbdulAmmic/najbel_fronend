import sqlite3

def migrate():
    conn = sqlite3.connect('najbel.db')
    cursor = conn.cursor()
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(prescription)")
    existing_cols = {col[1] for col in cursor.fetchall()}
    
    # Required columns from the model
    model_cols = {"patient_id", "doctor_id", "consultation_id", "invoice_id", "status", "instructions", "id", "created_at", "updated_at"}
    
    # 1. Add missing columns
    required_new_cols = {
        "invoice_id": "INTEGER REFERENCES invoice(id)",
        "updated_at": "DATETIME",
        "created_at": "DATETIME",
        "status": "VARCHAR DEFAULT 'pending_payment'",
        "instructions": "VARCHAR"
    }
    
    for col_name, col_type in required_new_cols.items():
        if col_name not in existing_cols:
            print(f"Adding column {col_name}...")
            try:
                cursor.execute(f"ALTER TABLE prescription ADD COLUMN {col_name} {col_type}")
            except sqlite3.OperationalError as e: print(f"Error adding {col_name}: {e}")

    # 2. Drop stray columns (if SQLite supports it)
    cursor.execute("PRAGMA table_info(prescription)")
    current_cols = {col[1] for col in cursor.fetchall()}
    for col_name in current_cols:
        if col_name not in model_cols:
            print(f"Dropping stray column {col_name}...")
            try:
                cursor.execute(f"ALTER TABLE prescription DROP COLUMN {col_name}")
            except sqlite3.OperationalError as e: print(f"Error dropping {col_name}: {e}")
                
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
