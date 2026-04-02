from sqlmodel import SQLModel, create_engine
from app.db.session import engine
from app.models.directive import PhysicianDirective
from app.models.user import User, Patient

print("Registering models. for the corrections made..")
try:
    SQLModel.metadata.create_all(engine)
    print("Success!")
except Exception as e:
    print(f"Error: {e}")