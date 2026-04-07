"""
Clinical Data Endpoints — Phase 1 (Subjective) and Phase 2 (Objective)

Mounted under /consultations prefix via api.py:
  GET  /consultations/{id}/subjective
  PUT  /consultations/{id}/subjective
  GET  /consultations/{id}/objective
  PUT  /consultations/{id}/objective
"""
import json
from typing import Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.api import deps
from app.models.user import User, UserRole, Doctor, Patient
from app.models.consultation import Consultation, ConsultationStatus
from app.models.subjective_data import SubjectiveData
from app.models.objective_data import ObjectiveData

router = APIRouter()


def _get_active_consultation(id: int, db: Session, current_user: User) -> Consultation:
    """Load consultation and verify access rights."""
    consultation = db.get(Consultation, id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    if consultation.status == ConsultationStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Consultation is locked")

    if current_user.role == UserRole.DOCTOR:
        doctor = db.exec(select(Doctor).where(Doctor.user_id == current_user.id)).first()
        if not doctor or consultation.doctor_id != doctor.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == UserRole.PATIENT:
        patient = db.exec(select(Patient).where(Patient.user_id == current_user.id)).first()
        if not patient or consultation.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    return consultation


# ─── PHASE 1: Subjective Data ────────────────────────────────────────────────

@router.get("/{id}/subjective")
def get_subjective(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get Phase 1 (subjective) data for a consultation."""
    consultation = db.get(Consultation, id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    subj = db.exec(select(SubjectiveData).where(SubjectiveData.consultation_id == id)).first()
    if not subj:
        # Return empty defaults pre-filled with appointment reason
        return {
            "consultation_id": id,
            "chief_complaint": consultation.symptoms,
            "past_medical_history": [],
            "medications_used": [],
            "drug_allergies": [],
            "family_history": [],
            "hospitals_visited": [],
            "social_habits": [],
        }

    return {
        "id": subj.id,
        "consultation_id": subj.consultation_id,
        "chief_complaint": subj.chief_complaint or consultation.symptoms,
        "past_medical_history": _parse_json(subj.past_medical_history),
        "medications_used": _parse_json(subj.medications_used),
        "drug_allergies": _parse_json(subj.drug_allergies),
        "family_history": _parse_json(subj.family_history),
        "hospitals_visited": _parse_json(subj.hospitals_visited),
        "social_habits": _parse_json(subj.social_habits),
        "updated_at": subj.updated_at,
    }


@router.put("/{id}/subjective")
def save_subjective(
    id: int,
    data: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Save / update Phase 1 (subjective) data. Only doctors during active consultation."""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can update clinical data")

    _get_active_consultation(id, db, current_user)

    subj = db.exec(select(SubjectiveData).where(SubjectiveData.consultation_id == id)).first()
    if not subj:
        subj = SubjectiveData(consultation_id=id)
        db.add(subj)

    if "chief_complaint" in data:
        subj.chief_complaint = data["chief_complaint"]
    if "past_medical_history" in data:
        subj.past_medical_history = _to_json(data["past_medical_history"])
    if "medications_used" in data:
        subj.medications_used = _to_json(data["medications_used"])
    if "drug_allergies" in data:
        subj.drug_allergies = _to_json(data["drug_allergies"])
    if "family_history" in data:
        subj.family_history = _to_json(data["family_history"])
    if "hospitals_visited" in data:
        subj.hospitals_visited = _to_json(data["hospitals_visited"])
    if "social_habits" in data:
        subj.social_habits = _to_json(data["social_habits"])

    subj.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(subj)
    return {"message": "Subjective data saved", "consultation_id": id}


# ─── PHASE 2: Objective Data ─────────────────────────────────────────────────

@router.get("/{id}/objective")
def get_objective(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get Phase 2 (objective) data for a consultation."""
    consultation = db.get(Consultation, id)
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    obj = db.exec(select(ObjectiveData).where(ObjectiveData.consultation_id == id)).first()
    if not obj:
        return {"consultation_id": id, "bmi": None}

    return {
        "id": obj.id,
        "consultation_id": obj.consultation_id,
        "height_cm": obj.height_cm,
        "weight_kg": obj.weight_kg,
        "bmi": obj.bmi,
        "blood_pressure": f"{obj.blood_pressure_systolic}/{obj.blood_pressure_diastolic}" if obj.blood_pressure_systolic else None,
        "blood_pressure_systolic": obj.blood_pressure_systolic,
        "blood_pressure_diastolic": obj.blood_pressure_diastolic,
        "fbs": obj.fbs,
        "fbc": obj.fbc,
        "rbs": obj.rbs,
        "recorded_at": obj.recorded_at,
        "updated_at": obj.updated_at,
    }


@router.put("/{id}/objective")
def save_objective(
    id: int,
    data: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Save / update Phase 2 (objective) data. BMI is auto-calculated."""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=403, detail="Only doctors can update clinical data")

    _get_active_consultation(id, db, current_user)

    obj = db.exec(select(ObjectiveData).where(ObjectiveData.consultation_id == id)).first()
    if not obj:
        obj = ObjectiveData(consultation_id=id)
        db.add(obj)

    if "height_cm" in data and data["height_cm"] is not None:
        obj.height_cm = float(data["height_cm"])
    if "weight_kg" in data and data["weight_kg"] is not None:
        obj.weight_kg = float(data["weight_kg"])
    if "blood_pressure_systolic" in data:
        obj.blood_pressure_systolic = data["blood_pressure_systolic"]
    if "blood_pressure_diastolic" in data:
        obj.blood_pressure_diastolic = data["blood_pressure_diastolic"]
    if "fbs" in data:
        obj.fbs = data["fbs"]
    if "fbc" in data:
        obj.fbc = data["fbc"]
    if "rbs" in data:
        obj.rbs = data["rbs"]

    # Auto-calculate BMI — never manually set
    if obj.height_cm and obj.weight_kg and obj.height_cm > 0:
        height_m = obj.height_cm / 100
        obj.bmi = round(obj.weight_kg / (height_m ** 2), 1)

    obj.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(obj)

    return {
        "message": "Objective data saved",
        "consultation_id": id,
        "bmi": obj.bmi,
    }


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _parse_json(val: str | None):
    if not val:
        return []
    try:
        return json.loads(val)
    except Exception:
        return []


def _to_json(val) -> str:
    if isinstance(val, str):
        return val  # already JSON string
    return json.dumps(val, ensure_ascii=False)
