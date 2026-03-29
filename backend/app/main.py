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
    # Warm up passlib's CryptContext to avoid lazy loading delay on first login
    pwd_context.hash("warmup_password")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
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
