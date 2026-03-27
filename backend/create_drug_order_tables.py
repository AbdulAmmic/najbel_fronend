"""Create DrugOrder and DrugOrderItem tables"""
from app.core.database import engine
from sqlmodel import SQLModel
from app.models.drug_order import DrugOrder, DrugOrderItem

if __name__ == "__main__":
    SQLModel.metadata.create_all(engine, tables=[DrugOrder.__table__, DrugOrderItem.__table__])
    print("DrugOrder and DrugOrderItem tables created successfully!")
