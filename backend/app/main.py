import os
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import init_db
from app.core.security import pwd_context
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Leapcell filesystem is read-only — use /tmp which is always writable
    os.makedirs("/tmp/uploads/lab_results", exist_ok=True)
    init_db()
    run_migrations()
    # Warm up passlib's CryptContext to avoid lazy loading delay on first login
    pwd_context.hash("warmup_password")
    yield

def run_migrations():
    """
    Safe inline migrations — compatible with both SQLite and PostgreSQL.
    Every ALTER TABLE is wrapped in try/except because SQLite does not support
    IF NOT EXISTS on ALTER TABLE (only CREATE TABLE supports it in SQLite).
    """
    from app.db.session import engine
    from sqlalchemy import text, inspect

    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()

    # ── ALTER TABLE migrations (columns added after initial deployment) ─────
    alter_migrations = [
        # Invoice extras
        ("invoice", "appointment_id", "ALTER TABLE invoice ADD COLUMN appointment_id INTEGER REFERENCES appointment(id)"),
        ("invoice", "consultation_id", "ALTER TABLE invoice ADD COLUMN consultation_id INTEGER REFERENCES consultation(id)"),
        ("invoice", "invoice_type", "ALTER TABLE invoice ADD COLUMN invoice_type VARCHAR DEFAULT 'composite'"),

        # InvoiceItem extras
        ("invoiceitem", "quantity", "ALTER TABLE invoiceitem ADD COLUMN quantity INTEGER DEFAULT 1"),
        ("invoiceitem", "item_type", "ALTER TABLE invoiceitem ADD COLUMN item_type VARCHAR DEFAULT 'consultation_fee'"),
        ("invoiceitem", "reference_id", "ALTER TABLE invoiceitem ADD COLUMN reference_id INTEGER"),

        # Consultation state machine + Meet
        ("consultation", "status", "ALTER TABLE consultation ADD COLUMN status VARCHAR DEFAULT 'DRAFT'"),
        ("consultation", "consultation_fee", "ALTER TABLE consultation ADD COLUMN consultation_fee FLOAT DEFAULT 0"),
        ("consultation", "consultation_fee_invoice_id", "ALTER TABLE consultation ADD COLUMN consultation_fee_invoice_id INTEGER REFERENCES invoice(id)"),
        ("consultation", "locked_at", "ALTER TABLE consultation ADD COLUMN locked_at TIMESTAMP"),
        ("consultation", "meet_link", "ALTER TABLE consultation ADD COLUMN meet_link TEXT"),
        ("consultation", "updated_at", "ALTER TABLE consultation ADD COLUMN updated_at TIMESTAMP"),

        # Lab catalog type
        ("lab_test_catalog", "test_type", "ALTER TABLE lab_test_catalog ADD COLUMN test_type VARCHAR DEFAULT 'PAID'"),

        # LabResult extras
        ("labresult", "test_type", "ALTER TABLE labresult ADD COLUMN test_type VARCHAR DEFAULT 'PAID'"),
        ("labresult", "patient_file_url", "ALTER TABLE labresult ADD COLUMN patient_file_url TEXT"),
        ("labresult", "payment_status", "ALTER TABLE labresult ADD COLUMN payment_status VARCHAR DEFAULT 'pending'"),
    ]

    # ── CREATE TABLE migrations (new tables) ───────────────────────────────
    create_migrations = []

    if "subjectivedata" not in existing_tables:
        create_migrations.append("""
        CREATE TABLE IF NOT EXISTS subjectivedata (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            consultation_id INTEGER UNIQUE REFERENCES consultation(id) ON DELETE CASCADE,
            chief_complaint TEXT,
            past_medical_history TEXT DEFAULT '[]',
            medications_used TEXT DEFAULT '[]',
            drug_allergies TEXT DEFAULT '[]',
            family_history TEXT DEFAULT '[]',
            hospitals_visited TEXT DEFAULT '[]',
            social_habits TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

    if "objectivedata" not in existing_tables:
        create_migrations.append("""
        CREATE TABLE IF NOT EXISTS objectivedata (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            consultation_id INTEGER UNIQUE REFERENCES consultation(id) ON DELETE CASCADE,
            height_cm FLOAT,
            weight_kg FLOAT,
            bmi FLOAT,
            blood_pressure_systolic INTEGER,
            blood_pressure_diastolic INTEGER,
            fbs FLOAT,
            fbc TEXT,
            rbs FLOAT,
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

    with engine.connect() as conn:
        # Run ALTER TABLE migrations — skip if column already exists
        for table, column, stmt in alter_migrations:
            if table not in existing_tables:
                continue  # Table doesn't exist yet, skip
            existing_cols = [c["name"] for c in inspector.get_columns(table)]
            if column in existing_cols:
                continue  # Column already exists, skip
            try:
                conn.execute(text(stmt))
                conn.commit()
                print(f"[MIGRATION] Added column {table}.{column}")
            except Exception as e:
                print(f"[MIGRATION] Skipped {table}.{column}: {e}")

        # Run CREATE TABLE migrations
        for stmt in create_migrations:
            try:
                conn.execute(text(stmt))
                conn.commit()
                print(f"[MIGRATION] Created table: {stmt.strip()[:50]}...")
            except Exception as e:
                print(f"[MIGRATION] Create table skipped: {e}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_log_path = "validation_errors.log"
    with open(error_log_path, "a") as f:
        f.write(f"\n--- {datetime.utcnow()} ---\n")
        f.write(f"Body: {exc.body}\n")
        f.write(f"Errors: {exc.errors()}\n")
    
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

@app.get("/")
def root():
    return {"message": "Welcome to NAJBEL Clinic API"}

from app.api.v1.api import api_router
app.include_router(api_router, prefix=settings.API_V1_STR)
