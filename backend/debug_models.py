import sys
import os

# Add backend to path
sys.path.append(os.getcwd())

print("Testing model imports one by one...")

try:
    print("Importing SQLModel...")
    from sqlmodel import SQLModel, create_engine
    
    print("Importing User, Doctor, Patient...")
    from app.models.user import User, Doctor, Patient
    
    print("Importing Appointment...")
    from app.models.appointment import Appointment
    
    print("Importing Consultation...")
    from app.models.consultation import Consultation
    
    print("Importing LabResult...")
    from app.models.lab_result import LabResult
    
    print("Importing ChatMessage...")
    from app.models.chat import ChatMessage
    
    print("All individual imports successful.")
    
    print("Attempting to initialize mapper (accessing metadata)...")
    # This usually triggers the mapper configuration
    _ = SQLModel.metadata
    print("Metadata access successful.")
    
    from sqlalchemy.orm import configure_mappers
    print("Configuring mappers...")
    configure_mappers()
    print("Mappers configured successfully!")

except Exception as e:
    print(f"\nERROR DETECTED: {type(e).__name__}")
    print(f"Message: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
