from sqlmodel import SQLModel, create_engine
from app.models.shift import Shift

def create_table():
    db_file = "najbel.db"
    engine = create_engine(f"sqlite:///{db_file}")
    SQLModel.metadata.create_all(engine)
    print("Created shift table successfully")

if __name__ == "__main__":
    create_table()
