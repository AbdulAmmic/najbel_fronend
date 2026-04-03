import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "NAJBEL Clinic API"
    API_V1_STR: str = "/api/v1"

    # Read from environment variable in production; fallback for local dev
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # PostgreSQL (Neon) in production, default to Neon directly since it's online
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://neondb_owner:npg_ytJbPpnU19FO@ep-fancy-moon-am5ukoh9-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require"
    )

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "AIzaSyBuIgcUs-dyvQscKKjMGAjAehEMUjnUdEc")

    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "https://najbelbackend-connectorstech7925-mmd9cjji.leapcell.dev",
        "*"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
