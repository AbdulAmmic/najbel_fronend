from typing import Generator
from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings
from app.models.bank import Bank # Ensure model is registered
from app.models.transaction import Transaction # Ensure model is registered
from app.models.service_template import ServiceTemplate # Ensure model is registered

connect_args = {"check_same_thread": False, "timeout": 30}
engine = create_engine(settings.DATABASE_URL, echo=True, connect_args=connect_args)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
