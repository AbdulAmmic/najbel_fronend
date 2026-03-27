from fastapi import APIRouter

from app.api.v1.endpoints import (
    users, auth, appointments, attendance, dashboard, dashboard_patients,
    prescriptions, medical_records, vitals, labs, billing, websockets,
    consultations, beds, referrals, chat, pharmacy, departments, patients, alerts,
    radiology, shifts, notifications, rooms, wards, lab_catalog
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(dashboard_patients.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(prescriptions.router, prefix="/prescriptions", tags=["prescriptions"])
api_router.include_router(medical_records.router, prefix="/medical-records", tags=["medical-records"])
api_router.include_router(vitals.router, prefix="/vitals", tags=["vitals"])
api_router.include_router(labs.router, prefix="/labs", tags=["labs"])
api_router.include_router(lab_catalog.router, prefix="/lab-catalog", tags=["lab-catalog"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
api_router.include_router(consultations.router, prefix="/consultations", tags=["consultations"])
api_router.include_router(beds.router, prefix="/beds", tags=["beds"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["rooms"])
api_router.include_router(wards.router, prefix="/wards", tags=["wards"])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(referrals.router, prefix="/referrals", tags=["referrals"])
api_router.include_router(websockets.router, tags=["websockets"])
api_router.include_router(chat.router, tags=["chat"])
api_router.include_router(pharmacy.router, prefix="/pharmacy", tags=["pharmacy"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(radiology.router, prefix="/radiology", tags=["radiology"])
api_router.include_router(shifts.router, prefix="/shifts", tags=["shifts"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
