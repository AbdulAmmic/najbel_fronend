"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Pill, ShoppingBag, Building2 } from "lucide-react";

interface MedEntry {
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  is_internal: boolean; // true = billable (Najbel fulfills), false = external (patient buys)
  status?: "idle" | "sending" | "done" | "error";
}

const EMPTY_MED: MedEntry = {
  drug_name: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
  is_internal: false,
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://najbelbackend-ammicsystems4174-umj4fvky.leapcell.dev/api/v1";

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }
function authH() { return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }; }

export default function MedicationPanel({ consultationId }: { consultationId: number }) {
  const [meds, setMeds] = useState<MedEntry[]>([{ ...EMPTY_MED }]);
  const [submitting, setSubmitting] = useState(false);

  const update = (i: number, field: keyof MedEntry, value: string | boolean) => {
    setMeds(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  const addMed = () => setMeds(prev => [...prev, { ...EMPTY_MED }]);

  const removeMed = (i: number) => setMeds(prev => prev.filter((_, idx) => idx !== i));

  const submitPrescriptions = async () => {
    const readyMeds = meds.filter(m => m.drug_name.trim() && !m.status);
    if (readyMeds.length === 0) return;
    setSubmitting(true);

    for (let i = 0; i < meds.length; i++) {
      const med = meds[i];
      if (!med.drug_name.trim() || med.status) continue;

      setMeds(prev => prev.map((m, idx) => idx === i ? { ...m, status: "sending" } : m));

      try {
        const res = await fetch(`${API_BASE}/prescriptions/`, {
          method: "POST",
          headers: authH(),
          body: JSON.stringify({
            consultation_id: consultationId,
            items: [{
              drug_name: med.drug_name,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration,
              quantity: 1,
              is_internal: med.is_internal,
              instructions: med.instructions,
            }],
          }),
        });

        if (res.ok) {
          setMeds(prev => prev.map((m, idx) => idx === i ? { ...m, status: "done" } : m));
        } else {
          setMeds(prev => prev.map((m, idx) => idx === i ? { ...m, status: "error" } : m));
        }
      } catch {
        setMeds(prev => prev.map((m, idx) => idx === i ? { ...m, status: "error" } : m));
      }
    }

    setSubmitting(false);
  };

  const frequencyOptions = ["Once daily", "Twice daily", "Three times daily", "Four times daily", "Every 8 hours", "Every 12 hours", "As needed (PRN)", "Weekly", "Stat (immediately)"];
  const durationOptions = ["1 day", "3 days", "5 days", "7 days", "10 days", "14 days", "1 month", "3 months", "6 months", "Ongoing"];

  return (
    <div className="space-y-4">
      {meds.map((med, i) => (
        <div key={i} className={`p-4 rounded-2xl border-2 relative transition-all ${
          med.status === "done" ? "border-green-400 bg-green-50" :
          med.status === "error" ? "border-red-300 bg-red-50" :
          med.is_internal ? "border-amber-300 bg-amber-50/40" : "border-gray-200 bg-white"
        }`}>
          {/* Billable Toggle */}
          <div className="flex items-center justify-between mb-3">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              med.is_internal
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {med.is_internal
                ? <><Building2 className="w-3.5 h-3.5" /> Billable (Najbel fulfills)</>
                : <><ShoppingBag className="w-3.5 h-3.5" /> External (patient buys)</>
              }
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => update(i, "is_internal", !med.is_internal)}
                disabled={!!med.status}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                  med.is_internal ? "bg-amber-500" : "bg-gray-300"
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow ${
                  med.is_internal ? "translate-x-4.5" : "translate-x-0.5"
                }`} />
              </button>
              {meds.length > 1 && !med.status && (
                <button
                  onClick={() => removeMed(i)}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {med.status === "done" && <span className="text-xs font-bold text-green-600">✓ Sent</span>}
            </div>
          </div>

          {med.is_internal && (
            <div className="mb-2 text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
              💊 Billable medication — patient will receive payment request before dispensing
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            <input
              value={med.drug_name}
              onChange={e => update(i, "drug_name", e.target.value)}
              placeholder="Drug name (e.g. Amoxicillin)"
              disabled={!!med.status}
              className="text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all disabled:opacity-60"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={med.dosage}
                onChange={e => update(i, "dosage", e.target.value)}
                placeholder="Dosage (e.g. 500mg)"
                disabled={!!med.status}
                className="text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all disabled:opacity-60"
              />
              <select
                value={med.frequency}
                onChange={e => update(i, "frequency", e.target.value)}
                disabled={!!med.status}
                className="text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all disabled:opacity-60"
              >
                <option value="">Frequency...</option>
                {frequencyOptions.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={med.duration}
                onChange={e => update(i, "duration", e.target.value)}
                disabled={!!med.status}
                className="text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all disabled:opacity-60"
              >
                <option value="">Duration...</option>
                {durationOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input
                value={med.instructions}
                onChange={e => update(i, "instructions", e.target.value)}
                placeholder="Instructions (e.g. after meals)"
                disabled={!!med.status}
                className="text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all disabled:opacity-60"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <button
          onClick={addMed}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-medium hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Medication
        </button>
        <button
          onClick={submitPrescriptions}
          disabled={submitting || meds.every(m => m.status === "done")}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold shadow-md hover:bg-violet-700 transition-all disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pill className="w-4 h-4" />}
          {submitting ? "Prescribing..." : "Prescribe"}
        </button>
      </div>
    </div>
  );
}
