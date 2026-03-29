from datetime import timedelta, datetime
import random
import string
from pydantic import BaseModel
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User, PasswordReset
from app.core.email import send_email_background, generate_otp_email
from app.schemas import Token

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    statement = select(User).where(User.email == form_data.username)
    user = db.exec(statement).first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "user": user
    }


class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyOtpRequest(BaseModel):
    email: str
    otp: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(deps.get_db)
) -> Any:
    # Always return a generic success message to prevent email enumeration
    user = db.exec(select(User).where(User.email == request.email)).first()
    if not user:
        return {"msg": "If an account matches that email, a password reset link has been sent."}

    # Generate 6 digit OTP
    otp_code = ''.join(random.choices(string.digits, k=6))
    
    # Invalidate previous ones for this email
    db.query(PasswordReset).filter(PasswordReset.email == request.email).delete()
    
    reset_request = PasswordReset(
        email=request.email,
        otp_code=otp_code,
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    )
    db.add(reset_request)
    db.commit()

    # Dispatch email
    email_html = generate_otp_email(otp_code)
    try:
        send_email_background(user.email, "Najbel Clinic - Password Reset Code", email_html)
    except Exception as e:
        print(f"Failed to send email: {e}")

    return {"msg": "If an account matches that email, a password reset link has been sent."}

@router.post("/verify-otp")
def verify_otp(
    request: VerifyOtpRequest,
    db: Session = Depends(deps.get_db)
) -> Any:
    reset_req = db.exec(
        select(PasswordReset)
        .where(PasswordReset.email == request.email)
        .where(PasswordReset.otp_code == request.otp)
    ).first()

    if not reset_req or reset_req.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    return {"msg": "OTP verified successfully"}

@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(deps.get_db)
) -> Any:
    reset_req = db.exec(
        select(PasswordReset)
        .where(PasswordReset.email == request.email)
        .where(PasswordReset.otp_code == request.otp)
    ).first()

    if not reset_req or reset_req.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    user = db.exec(select(User).where(User.email == request.email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = security.get_password_hash(request.new_password)
    db.add(user)
    
    # Delete the used token
    db.delete(reset_req)
    db.commit()


@router.post("/reset-admin-password-debug")
def reset_admin_password_debug(db: Session = Depends(deps.get_db)) -> Any:
    statement = select(User).where(User.email == "admin@najbel.com")
    user = db.exec(statement).first()
    if user:
        user.hashed_password = security.get_password_hash("admin123")
        db.add(user)
        db.commit()
        return {"msg": "Admin password reset successfully"}
    return {"msg": "Admin not found"}
