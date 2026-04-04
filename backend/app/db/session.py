from typing import Generator
from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings
from app.models.chat import ChatMessage # Standard chat model
import app.models # Bulk register all clinical models

# SQLite needs check_same_thread=False; PostgreSQL does not support it
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False, "timeout": 30}
else:
    connect_args = {}

engine = create_engine(settings.DATABASE_URL, echo=False, connect_args=connect_args)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
