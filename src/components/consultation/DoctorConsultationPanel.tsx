"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ClipboardList, Activity, FlaskConical, Pill, Save, CheckCircle2, 
  Plus, Trash2, AlertTriangle, Loader2,
  Video, Link2, Check, X
} from "lucide-react";
import LabTestRequestPanel from "./LabTestRequestPanel";
import MedicationPanel from "./MedicationPanel";

interface ConsultationPanelProps {
  consultationId: number;
  appointmentReason?: string;
  meetLink?: string;
  onComplete?: () => void;
}

interface SubjectiveData {
  chief_complaint: string;
  past_medical_history: ArrayEntry[];
  medications_used: ArrayEntry[];
  drug_allergies: ArrayEntry[];
  family_history: ArrayEntry[];
  hospitals_visited: ArrayEntry[];
  social_habits: ArrayEntry[];
}

interface ObjectiveData {
  height_cm: string;
  weight_kg: string;
  bmi: number | null;
  blood_pressure_systolic: string;
  blood_pressure_diastolic: string;
  fbs: string;
  fbc: string;
  rbs: string;
}

interface ArrayEntry {
  value: string;
  note?: string;
  timestamp?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://najbelbackend-ammicsystems4174-umj4fvky.leapcell.dev/api/v1";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getAuthToken()}`,
  };
}

// ─── Array Field Component ────────────────────────────────────────────────────
function ArrayField({
  label,
  entries,
  onChange,
  placeholder,
}: {
  label: string;
  entries: ArrayEntry[];
  onChange: (entries: ArrayEntry[]) => void;
  placeholder?: string;
}) {
  const add = () => onChange([...entries, { value: "", timestamp: new Date().toISOString() }]);
  const remove = (i: number) => onChange(entries.filter((_, idx) => idx !== i));
  const update = (i: number, value: string) => {
    const next = [...entries];
    next[i] = { ...next[i], value };
    onChange(next);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium px-2 py-1 rounded-lg hover:bg-violet-50 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      {entries.length === 0 && (
        <p className="text-xs text-gray-400 italic py-1">No entries — click Add</p>
      )}
      <div className="space-y-2">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={entry.value}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Doctor Panel ────────────────────────────────────────────────────────
export default function DoctorConsultationPanel({
  consultationId,
  appointmentReason = "",
  meetLink: initialMeetLink,
  onComplete,
}: ConsultationPanelProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"subjective" | "objective" | "treatment">("subjective");
  const [treatmentSubTab, setTreatmentSubTab] = useState<"labs" | "meds">("labs");
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  // Meet link state
  const [meetLink, setMeetLink] = useState(initialMeetLink || "");
  const [showMeetInput, setShowMeetInput] = useState(false);
  const [meetLinkInput, setMeetLinkInput] = useState(initialMeetLink || "");
  const [savingLink, setSavingLink] = useState(false);
  const [linkSaved, setLinkSaved] = useState(false);

  // Phase 1 state
  const [subjective, setSubjective] = useState<SubjectiveData>({
    chief_complaint: appointmentReason,
    past_medical_history: [],
    medications_used: [],
    drug_allergies: [],
    family_history: [],
    hospitals_visited: [],
    social_habits: [],
  });

  // Phase 2 state
  const [objective, setObjective] = useState<ObjectiveData>({
    height_cm: "",
    weight_kg: "",
    bmi: null,
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    fbs: "",
    fbc: "",
    rbs: "",
  });

  // Phase 3 — notes
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");

  // Load existing data
  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, oRes] = await Promise.all([
          fetch(`${API_BASE}/consultations/${consultationId}/subjective`, { headers: authHeaders() }),
          fetch(`${API_BASE}/consultations/${consultationId}/objective`, { headers: authHeaders() }),
        ]);
        if (sRes.ok) {
          const s = await sRes.json();
          setSubjective({
            chief_complaint: s.chief_complaint || appointmentReason,
            past_medical_history: s.past_medical_history || [],
            medications_used: s.medications_used || [],
            drug_allergies: s.drug_allergies || [],
            family_history: s.family_history || [],
            hospitals_visited: s.hospitals_visited || [],
            social_habits: s.social_habits || [],
          });
        }
        if (oRes.ok) {
          const o = await oRes.json();
          setObjective({
            height_cm: o.height_cm?.toString() || "",
            weight_kg: o.weight_kg?.toString() || "",
            bmi: o.bmi,
            blood_pressure_systolic: o.blood_pressure_systolic?.toString() || "",
            blood_pressure_diastolic: o.blood_pressure_diastolic?.toString() || "",
            fbs: o.fbs?.toString() || "",
            fbc: o.fbc || "",
            rbs: o.rbs?.toString() || "",
          });
        }
      } catch (e) {
        console.error("Failed to load consultation data", e);
      }
    };
    load();
  }, [consultationId]);

  // Auto BMI on blur
  const calcBMI = useCallback(() => {
    const h = parseFloat(objective.height_cm);
    const w = parseFloat(objective.weight_kg);
    if (h > 0 && w > 0) {
      const bmi = w / Math.pow(h / 100, 2);
      setObjective(prev => ({ ...prev, bmi: Math.round(bmi * 10) / 10 }));
    }
  }, [objective.height_cm, objective.weight_kg]);

  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      await Promise.all([
        fetch(`${API_BASE}/consultations/${consultationId}/subjective`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify(subjective),
        }),
        fetch(`${API_BASE}/consultations/${consultationId}/objective`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({
            height_cm: objective.height_cm ? parseFloat(objective.height_cm) : null,
            weight_kg: objective.weight_kg ? parseFloat(objective.weight_kg) : null,
            blood_pressure_systolic: objective.blood_pressure_systolic ? parseInt(objective.blood_pressure_systolic) : null,
            blood_pressure_diastolic: objective.blood_pressure_diastolic ? parseInt(objective.blood_pressure_diastolic) : null,
            fbs: objective.fbs ? parseFloat(objective.fbs) : null,
            fbc: objective.fbc || null,
            rbs: objective.rbs ? parseFloat(objective.rbs) : null,
          }),
        }),
        fetch(`${API_BASE}/consultations/${consultationId}/save-draft`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ diagnosis, notes }),
        }),
      ]);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [consultationId, subjective, objective, diagnosis, notes]);

  // Auto-save every 30s
  useEffect(() => {
    const timer = setInterval(saveDraft, 30000);
    return () => clearInterval(timer);
  }, [saveDraft]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await saveDraft();
      await fetch(`${API_BASE}/consultations/${consultationId}/complete`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ diagnosis, notes }),
      });
      setShowCompleteConfirm(false);
      onComplete?.();
    } catch (e) {
      console.error("Failed to complete consultation", e);
    } finally {
      setCompleting(false);
    }
  };

  const saveMeetLink = async () => {
    if (!meetLinkInput.trim()) return;
    setSavingLink(true);
    try {
      const res = await fetch(`${API_BASE}/consultations/${consultationId}/meet-link`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ meet_link: meetLinkInput.trim() }),
      });
      if (res.ok) {
        setMeetLink(meetLinkInput.trim());
        setShowMeetInput(false);
        setLinkSaved(true);
        setTimeout(() => setLinkSaved(false), 3000);
      }
    } catch (e) {
      console.error("Failed to save meet link", e);
    } finally {
      setSavingLink(false);
    }
  };

  const tabs = [
    { id: "subjective" as const, label: "Phase 1: History", icon: ClipboardList, color: "text-blue-600" },
    { id: "objective" as const, label: "Phase 2: Vitals", icon: Activity, color: "text-green-600" },
    { id: "treatment" as const, label: "Phase 3: Treatment", icon: FlaskConical, color: "text-violet-600" },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-sm">Clinical Panel</h2>
            <p className="text-violet-200 text-xs">Consultation #{consultationId}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* In-app Meeting Room Button */}
            {meetLink ? (
              <button
                onClick={() => router.push(`/dashboard/meeting/${consultationId}`)}
                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-md"
              >
                <Video className="w-3.5 h-3.5" />
                Enter Meeting Room
              </button>
            ) : (
              <button
                onClick={() => setShowMeetInput(true)}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
              >
                <Link2 className="w-3.5 h-3.5" />
                Set Meet Link
              </button>
            )}
            {meetLink && (
              <button
                onClick={() => { setMeetLinkInput(meetLink); setShowMeetInput(true); }}
                title="Change meeting link"
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                <Link2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Meet Link Paste Input */}
        {showMeetInput && (
          <div className="mt-3 bg-white/10 rounded-xl p-3">
            <p className="text-violet-100 text-xs mb-2 font-medium">
              📋 Paste your Google Meet link — patient will be notified
            </p>
            <div className="flex gap-2">
              <input
                value={meetLinkInput}
                onChange={e => setMeetLinkInput(e.target.value)}
                placeholder="https://meet.google.com/xxx-yyy-zzz"
                className="flex-1 text-xs px-3 py-2 rounded-lg bg-white text-gray-800 placeholder:text-gray-400 outline-none"
                autoFocus
              />
              <button
                onClick={saveMeetLink}
                disabled={savingLink || !meetLinkInput.trim()}
                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1"
              >
                {savingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save
              </button>
              <button
                onClick={() => setShowMeetInput(false)}
                className="px-2 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        {linkSaved && (
          <p className="text-green-200 text-xs mt-2 font-semibold">✓ Meeting link saved — patient notified!</p>
        )}
      </div>

      {/* Phase Tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 text-xs font-semibold transition-all border-b-2 ${
              activeTab === tab.id
                ? `border-violet-500 bg-white ${tab.color}`
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:block leading-tight text-center">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* PHASE 1 — Subjective */}
        {activeTab === "subjective" && (
          <div>
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                Chief Medical Complaint
              </label>
              <textarea
                value={subjective.chief_complaint}
                onChange={e => setSubjective(p => ({ ...p, chief_complaint: e.target.value }))}
                rows={2}
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all resize-none"
                placeholder="Primary complaint..."
              />
            </div>
            <ArrayField label="Past Medical History" entries={subjective.past_medical_history}
              onChange={v => setSubjective(p => ({ ...p, past_medical_history: v }))} placeholder="e.g. Hypertension, Diabetes" />
            <ArrayField label="Medications Currently Used" entries={subjective.medications_used}
              onChange={v => setSubjective(p => ({ ...p, medications_used: v }))} placeholder="e.g. Metformin 500mg OD" />
            <ArrayField label="Drug Allergies" entries={subjective.drug_allergies}
              onChange={v => setSubjective(p => ({ ...p, drug_allergies: v }))} placeholder="e.g. Penicillin - rash" />
            <ArrayField label="Family History" entries={subjective.family_history}
              onChange={v => setSubjective(p => ({ ...p, family_history: v }))} placeholder="e.g. Father - hypertension" />
            <ArrayField label="Hospitals Previously Visited" entries={subjective.hospitals_visited}
              onChange={v => setSubjective(p => ({ ...p, hospitals_visited: v }))} placeholder="e.g. General Hospital Lagos" />
            <ArrayField label="Social Habits" entries={subjective.social_habits}
              onChange={v => setSubjective(p => ({ ...p, social_habits: v }))} placeholder="e.g. Smokes 5 cigarettes/day" />
          </div>
        )}

        {/* PHASE 2 — Objective */}
        {activeTab === "objective" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={objective.height_cm}
                  onChange={e => setObjective(p => ({ ...p, height_cm: e.target.value }))}
                  onBlur={calcBMI}
                  placeholder="e.g. 172"
                  className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={objective.weight_kg}
                  onChange={e => setObjective(p => ({ ...p, weight_kg: e.target.value }))}
                  onBlur={calcBMI}
                  placeholder="e.g. 75"
                  className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                />
              </div>
            </div>

            {/* BMI Display */}
            {objective.bmi !== null && (
              <div className={`p-3 rounded-xl flex items-center gap-3 ${
                objective.bmi < 18.5 ? "bg-blue-50 border border-blue-200" :
                objective.bmi < 25 ? "bg-green-50 border border-green-200" :
                objective.bmi < 30 ? "bg-yellow-50 border border-yellow-200" :
                "bg-red-50 border border-red-200"
              }`}>
                <Activity className={`w-5 h-5 ${
                  objective.bmi < 18.5 ? "text-blue-500" :
                  objective.bmi < 25 ? "text-green-500" :
                  objective.bmi < 30 ? "text-yellow-500" : "text-red-500"
                }`} />
                <div>
                  <div className="font-bold text-gray-800">BMI: {objective.bmi}</div>
                  <div className="text-xs text-gray-500">
                    {objective.bmi < 18.5 ? "Underweight" :
                     objective.bmi < 25 ? "Normal weight" :
                     objective.bmi < 30 ? "Overweight" : "Obese"}
                    {" "}— Auto-calculated
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Blood Pressure (mmHg)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={objective.blood_pressure_systolic}
                  onChange={e => setObjective(p => ({ ...p, blood_pressure_systolic: e.target.value }))}
                  placeholder="Systolic (120)"
                  className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                />
                <span className="text-gray-400 font-bold">/</span>
                <input
                  type="number"
                  value={objective.blood_pressure_diastolic}
                  onChange={e => setObjective(p => ({ ...p, blood_pressure_diastolic: e.target.value }))}
                  placeholder="Diastolic (80)"
                  className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "fbs", label: "FBS (mmol/L)", placeholder: "0.0" },
                { key: "rbs", label: "RBS (mmol/L)", placeholder: "0.0" },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">{field.label}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={objective[field.key as keyof ObjectiveData] as string}
                    onChange={e => setObjective(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">FBC (Full Blood Count summary)</label>
              <textarea
                value={objective.fbc}
                onChange={e => setObjective(p => ({ ...p, fbc: e.target.value }))}
                rows={2}
                placeholder="FBC result summary or key values..."
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all resize-none"
              />
            </div>
          </div>
        )}

        {/* PHASE 3 — Treatment */}
        {activeTab === "treatment" && (
          <div>
            {/* Diagnosis + Notes */}
            <div className="mb-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Diagnosis</label>
                <textarea
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  rows={2}
                  placeholder="Primary diagnosis..."
                  className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Clinical Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Additional notes, follow-up plan..."
                  className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Sub-tabs: Labs / Meds */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTreatmentSubTab("labs")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  treatmentSubTab === "labs"
                    ? "bg-violet-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <FlaskConical className="w-4 h-4" /> Lab Tests
              </button>
              <button
                onClick={() => setTreatmentSubTab("meds")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  treatmentSubTab === "meds"
                    ? "bg-violet-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Pill className="w-4 h-4" /> Medications
              </button>
            </div>

            {treatmentSubTab === "labs" && (
              <LabTestRequestPanel consultationId={consultationId} />
            )}
            {treatmentSubTab === "meds" && (
              <MedicationPanel consultationId={consultationId} />
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-100 p-3 bg-gray-50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={saveDraft}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Draft"}
          </button>
          {saveStatus === "saved" && <span className="text-xs text-green-600 font-semibold">✓ Saved</span>}
          {saveStatus === "error" && <span className="text-xs text-red-500 font-semibold">✗ Save failed</span>}
        </div>

        <button
          onClick={() => setShowCompleteConfirm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
        >
          <CheckCircle2 className="w-4 h-4" /> Complete
        </button>
      </div>

      {/* Complete Confirmation Modal */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Complete Consultation?</h3>
                <p className="text-sm text-gray-500">This will lock the record permanently.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3">
              ⚠️ Once completed, no further edits can be made. The patient will receive their consultation summary.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {completing ? "Completing..." : "Yes, Complete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
