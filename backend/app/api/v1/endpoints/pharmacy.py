from typing import Any, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter()

class Medicine(BaseModel):
    id: int
    name: str
    dosage: str
    stock: int
    category: str

# Mock Inventory
INVENTORY = [
    {"id": 1, "name": "Paracetamol", "dosage": "500mg", "stock": 100, "category": "Painkiller"},
    {"id": 2, "name": "Amoxicillin", "dosage": "250mg", "stock": 50, "category": "Antibiotic"},
    {"id": 3, "name": "Ibuprofen", "dosage": "400mg", "stock": 75, "category": "Anti-inflammatory"},
    {"id": 4, "name": "Metformin", "dosage": "500mg", "stock": 200, "category": "Antidiabetic"},
    {"id": 5, "name": "Amlodipine", "dosage": "5mg", "stock": 150, "category": "Antihypertensive"},
    {"id": 6, "name": "Omeprazole", "dosage": "20mg", "stock": 80, "category": "Antacid"},
    {"id": 7, "name": "Atorvastatin", "dosage": "10mg", "stock": 120, "category": "Statin"},
    {"id": 8, "name": "Azithromycin", "dosage": "500mg", "stock": 40, "category": "Antibiotic"},
    {"id": 9, "name": "Cetirizine", "dosage": "10mg", "stock": 100, "category": "Antihistamine"},
    {"id": 10, "name": "Aspirin", "dosage": "75mg", "stock": 300, "category": "Blood Thinner"},
]

@router.get("/inventory", response_model=List[Medicine])
def get_inventory() -> Any:
    """
    Get all available medicines in pharmacy.
    """
    return INVENTORY
