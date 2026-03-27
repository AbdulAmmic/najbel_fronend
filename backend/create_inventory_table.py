import sqlite3
from sqlmodel import SQLModel, create_engine
from app.models.inventory import InventoryItem

# Using sqlmodel to generate schema is cleaner if we had configured Alembic.
# For now, sticking to the manual SQL pattern used effectively so far for quick updates,
# or using SQLModel's create_all with a temporary engine to just create missing tables.

def create_table():
    db_file = "najbel.db"
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='inventoryitem'")
    if cursor.fetchone():
        print("Table 'inventoryitem' already exists.")
    else:
        # Create table manually to match SQLModel definition
        # ID, name, category, batch_number, expiry_date, quantity, unit_price, reorder_level, location, supplier, description, created_at, updated_at
        cursor.execute("""
            CREATE TABLE inventoryitem (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR NOT NULL,
                category VARCHAR NOT NULL,
                batch_number VARCHAR NOT NULL,
                expiry_date DATE NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price FLOAT NOT NULL,
                reorder_level INTEGER NOT NULL,
                location VARCHAR,
                supplier VARCHAR,
                description VARCHAR,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL
            )
        """)
        print("Table 'inventoryitem' created successfully.")
        
        # Add indexes
        cursor.execute("CREATE INDEX ix_inventoryitem_name ON inventoryitem (name)")
        cursor.execute("CREATE INDEX ix_inventoryitem_batch_number ON inventoryitem (batch_number)")
        print("Indexes created.")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    create_table()
