import asyncio
from app.db.session import engine, SessionLocal
from app.models.user import User
from app.api.v1.endpoints.billing import generate_wallet_account

def run_test():
    db = SessionLocal()
    # Get any patient user
    user = db.query(User).filter(User.role == "patient").first()
    if not user:
        print("No patient user found!")
        return

    print("Testing generate account for user", user.id)
    try:
        wallet = generate_wallet_account(db=db, current_user=user)
        print("Success!", wallet.virtual_account_number)
    except Exception as e:
        print("Error!", str(e))
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_test()
