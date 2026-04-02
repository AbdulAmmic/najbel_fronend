import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "NAJBEL Clinic API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_CHANGE_ME"  # TODO: Change in production
    # In production, use: SECRET_KEY = os.getenv("SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # SQLite - Ensure it always points to backend/najbel.db regardless of start directory
    DATABASE_URL: str = f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'najbel.db')}"

    # DEEPSEEK_API_KEY: str = "sk-d96513e88e9148c1a52f596ce74c6c36" 
    GEMINI_API_KEY: str = "AIzaSyBuIgcUs-dyvQscKKjMGAjAehEMUjnUdEc"

    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]

    class Config:
        case_sensitive = True

settings = Settings()
