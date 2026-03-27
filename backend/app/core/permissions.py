from typing import List, Callable
from fastapi import HTTPException, status
from app.models.user import User, UserRole

class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User) -> User:
        if user.role not in self.allowed_roles and user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Operation not permitted"
            )
        return user

def check_role(roles: List[UserRole]) -> Callable:
    """Dependency to check if user has one of the required roles."""
    return RoleChecker(roles)

# Specific Permission Helpers
def can_edit_emr(user: User) -> bool:
    """Doctor, Nurse (Limited), Admin"""
    return user.role in [UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN, UserRole.SUPER_ADMIN]

def can_prescribe(user: User) -> bool:
    """Strictly Doctors only"""
    return user.role in [UserRole.DOCTOR]

def can_dispense(user: User) -> bool:
    """Strictly Pharmacists only"""
    return user.role in [UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN] # Admin for fallback

def can_validate_lab(user: User) -> bool:
    """Lab Scientist/Technician"""
    return user.role in [UserRole.LAB_TECH, UserRole.ADMIN, UserRole.SUPER_ADMIN]

def can_validate_imaging(user: User) -> bool:
    """Radiologist"""
    return user.role in [UserRole.RADIOLOGIST, UserRole.ADMIN, UserRole.SUPER_ADMIN]

def can_manage_inventory(user: User) -> bool:
    """Pharmacist, Store Officer"""
    return user.role in [UserRole.PHARMACIST, UserRole.STORE_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN]

def can_bill(user: User) -> bool:
    """Accountant, Admin, Receptionist (Initiate)"""
    return user.role in [UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.SUPER_ADMIN]
