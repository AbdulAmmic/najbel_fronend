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
    init_db()
    run_migrations()
    # Warm up passlib's CryptContext to avoid lazy loading delay on first login
    pwd_context.hash("warmup_password")
    yield

def run_migrations():
    """
    Safe inline migrations for columns added after initial deployment.
    Uses IF NOT EXISTS so this is idempotent on every startup.
    """
    from app.db.session import engine
    from sqlalchemy import text

    migrations = [
        # Invoice: add appointment_id and consultation_id (added 2026-04-05)
        "ALTER TABLE invoice ADD COLUMN IF NOT EXISTS appointment_id INTEGER REFERENCES appointment(id) ON DELETE SET NULL",
        "ALTER TABLE invoice ADD COLUMN IF NOT EXISTS consultation_id INTEGER REFERENCES consultation(id) ON DELETE SET NULL",
    ]

    with engine.connect() as conn:
        for stmt in migrations:
            try:
                conn.execute(text(stmt))
                conn.commit()
                print(f"[MIGRATION] OK: {stmt[:60]}...")
            except Exception as e:
                # Column may already exist (non-Postgres DBs don't support IF NOT EXISTS)
                print(f"[MIGRATION] Skipped (already applied or error): {e}")


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
