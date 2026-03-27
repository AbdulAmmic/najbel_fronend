"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Phone, Mail, Calendar, Droplets, MapPin,
    Pill, FlaskConical, Stethoscope, Bed, UserCheck,
    X, AlertCircle, CheckCircle2, Send, User2, Activity,
    ClipboardList, Clock, ChevronDown, ChevronUp, Badge
} from "lucide-react";
import {
    patientService, prescriptions, consultations, referrals,
    beds, users, auth, labs
} from "@/services/api";

type ModalType = "prescribe" | "lab" | "consult" | "admit" | "refer" | null;
type TabType = "info" | "rx" | "labs" | "refs";

const getName   = (p: any) => p?.user?.full_name || p?.full_name || "Unknown Patient";
const getEmail  = (p: any) => p?.user?.email || p?.email || "—";
const getPhone  = (p: any) => p?.phone_number || p?.phone || "—";
const getGender = (p: any) => p?.gender || "—";
const getDob    = (p: any) => p?.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const getBlood  = (p: any) => p?.blood_group || "—";
const getAddr   = (p: any) => p?.address || "—";
const getAge    = (p: any) => {
    if (!p?.date_of_birth) return null;
    const diff = Date.now() - new Date(p.date_of_birth).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};
const initials  = (p: any) => getName(p).split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

const BLOOD_COLORS: Record<string, string> = {
    "A+": "bg-red-500", "A-": "bg-red-400", "B+": "bg-orange-500", "B-": "bg-orange-400",
    "AB+": "bg-purple-600", "AB-": "bg-purple-500", "O+": "bg-blue-600", "O-": "bg-blue-500",
};

export default function DoctorPatientDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    const [patient, setPatient]     = useState<any>(null);
    const [me, setMe]               = useState<any>(null);
    const [availBeds, setAvailBeds] = useState<any[]>([]);
    const [otherDocs, setOtherDocs] = useState<any[]>([]);
    const [loading, setLoading]     = useState(true);
    const [activeModal, setModal]   = useState<ModalType>(null);
    const [saving, setSaving]       = useState(false);
    const [form, setForm]           = useState<any>({});
    const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
    const [activeTab, setTab]       = useState<TabType>("info");
    const [rxList, setRxList]       = useState<any[]>([]);
    const [labList, setLabList]     = useState<any[]>([]);
    const [refList, setRefList]     = useState<any[]>([]);
    const [expandedRx, setExpandedRx] = useState<number | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        (async () => {
            try {
                const [pat, meData, bedsData, usersData, rxData, labData, refData] = await Promise.all([
                    patientService.getById(Number(id)),
                    auth.getMe(),
                    beds.getAll().catch(() => []),
                    users.getAll().catch(() => []),
                    prescriptions.getAll().catch(() => []),
                    labs.getAll().catch(() => []),
                    referrals.getAll().catch(() => []),
                ]);
                setPatient(pat);
                setMe(meData);
                setAvailBeds((Array.isArray(bedsData) ? bedsData : []).filter((b: any) => b.status === "available"));
                setOtherDocs((Array.isArray(usersData) ? usersData : []).filter((u: any) => u.role === "doctor" && u.id !== meData?.id));
                setRxList((Array.isArray(rxData) ? rxData : []).filter((r: any) => r.patient_id === pat?.id));
                setLabList((Array.isArray(labData) ? labData : []).filter((l: any) => l.patient_id === pat?.id));
                setRefList((Array.isArray(refData) ? refData : []).filter((r: any) => r.patient_id === pat?.id));
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, [id]);

    const sf = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

    const handleSubmit = async () => {
        setSaving(true);
        try {
            if (activeModal === "prescribe") {
                if (!form.medication || !form.dosage || !form.frequency || !form.duration) {
                    return showToast("Please fill all required fields.", false);
                }
                await prescriptions.create({ patient_id: patient.id, doctor_id: me?.id, medication: form.medication, dosage: form.dosage, frequency: form.frequency, duration: form.duration, instructions: form.instructions || "" });
                showToast("Prescription sent to pharmacy!");
            } else if (activeModal === "lab") {
                if (!form.test_name) return showToast("Please enter a test name.", false);
                await labs.create({ patient_id: patient.id, doctor_id: me?.id, test_name: form.test_name, urgency: form.urgency || "routine", notes: form.notes || "" });
                showToast("Lab request submitted!");
            } else if (activeModal === "consult") {
                if (!form.chief_complaint || !form.diagnosis) return showToast("Please fill all required fields.", false);
                await consultations.create({ patient_id: patient.id, doctor_id: me?.id, chief_complaint: form.chief_complaint, diagnosis: form.diagnosis, treatment_plan: form.treatment_plan || "", notes: form.notes || "" });
                showToast("Consultation note saved!");
            } else if (activeModal === "admit") {
                if (!form.bed_id) return showToast("Please select a bed.", false);
                await beds.admit(Number(form.bed_id), patient.id);
                showToast("Patient admitted!");
            } else if (activeModal === "refer") {
                if (!form.referred_doctor_id || !form.reason) return showToast("Fill all required fields.", false);
                await referrals.create({ patient_id: patient.id, referring_doctor_id: me?.id, referred_to_doctor_id: Number(form.referred_doctor_id), reason: form.reason, urgency: form.urgency || "routine", notes: form.notes || "" });
                showToast("Referral sent!");
            }
            setModal(null);
            setForm({});
        } catch (err: any) {
            showToast(err?.response?.data?.detail || "Action failed. Try again.", false);
        } finally { setSaving(false); }
    };

    const ACTIONS = [
        { id: "prescribe", label: "Prescribe",  icon: Pill,       color: "from-violet-500 to-purple-600",  bg: "bg-violet-50",  text: "text-violet-600" },
        { id: "lab",       label: "Lab Test",   icon: FlaskConical, color: "from-amber-400 to-orange-500", bg: "bg-amber-50",   text: "text-amber-600" },
        { id: "consult",   label: "Consult",    icon: Stethoscope, color: "from-blue-500 to-cyan-600",    bg: "bg-blue-50",    text: "text-blue-600" },
        { id: "admit",     label: "Admit",      icon: Bed,         color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50", text: "text-emerald-600" },
        { id: "refer",     label: "Refer",      icon: UserCheck,   color: "from-pink-500 to-rose-600",    bg: "bg-pink-50",    text: "text-pink-600" },
    ];

    const RX_STATUS_STYLE: Record<string, string> = {
        active: "bg-blue-50 text-blue-700",
        dispensed: "bg-emerald-50 text-emerald-700",
        cancelled: "bg-gray-100 text-gray-500",
        unavailable: "bg-red-50 text-red-600",
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
            <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!patient) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-gray-300 bg-[#F8FAFC]">
            <User2 className="w-14 h-14" />
            <p className="text-sm font-medium text-gray-400">Patient not found</p>
            <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline">← Go Back</button>
        </div>
    );

    const age = getAge(patient);
    const bloodGroup = getBlood(patient);
    const bloodColor = BLOOD_COLORS[bloodGroup] || "bg-gray-500";

    return (
        <div className="min-h-screen bg-[#F0F4FF]">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2 min-w-[220px] justify-center ${toast.ok ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}`}>
                    {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* ── Header ── */}
            <div className="bg-white border-b border-gray-100 px-5 pt-4 pb-0">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 transition active:scale-90">
                            <ArrowLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="font-bold text-gray-900 text-base leading-tight">{getName(patient)}</h1>
                            <p className="text-xs text-gray-400">Patient #{patient.id}</p>
                        </div>
                    </div>

                    {/* Hero profile */}
                    <div className="flex items-end gap-5 mb-5">
                        {/* Avatar with blood group badge */}
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-200">
                                {initials(patient)}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 ${bloodColor} text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md`}>
                                {bloodGroup}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0 pb-1">
                            <h2 className="text-lg font-black text-gray-900 leading-tight">{getName(patient)}</h2>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {age && <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-semibold">{age} yrs</span>}
                                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-semibold">{getGender(patient)}</span>
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-0 -mx-5 px-5 overflow-x-auto no-scrollbar">
                        {([
                            { id: "info", label: "Overview" },
                            { id: "rx", label: `Prescriptions (${rxList.length})` },
                            { id: "labs", label: `Labs (${labList.length})` },
                            { id: "refs", label: `Referrals (${refList.length})` },
                        ] as const).map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`whitespace-nowrap pb-3 px-1 mr-5 text-sm font-bold border-b-2 transition-all ${activeTab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                            >{t.label}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 sm:px-5 py-5 pb-36 space-y-4">

                {/* ── INFO TAB ── */}
                {activeTab === "info" && (
                    <>
                        {/* Contact card */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 pt-5 pb-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Contact & Details</p>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {[
                                    { icon: Mail, label: "Email", v: getEmail(patient) },
                                    { icon: Phone, label: "Phone", v: getPhone(patient) },
                                    { icon: Calendar, label: "Date of Birth", v: `${getDob(patient)}${age ? ` · ${age} years` : ""}` },
                                    { icon: Droplets, label: "Blood Group", v: bloodGroup },
                                    { icon: MapPin, label: "Address", v: getAddr(patient) },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                                        <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                                            <item.icon className="w-3.5 h-3.5 text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-gray-400 font-semibold">{item.label}</p>
                                            <p className="text-sm font-semibold text-gray-800 truncate">{item.v}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* ── PRESCRIPTIONS TAB ── */}
                {activeTab === "rx" && (
                    <div className="space-y-3">
                        {rxList.length === 0 ? (
                            <div className="flex flex-col items-center py-16 gap-3 text-gray-300">
                                <Pill className="w-10 h-10" />
                                <p className="text-sm text-gray-400 font-medium">No prescriptions yet</p>
                            </div>
                        ) : rxList.map((rx: any) => (
                            <div key={rx.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-4 py-4 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                                        <Pill className="w-5 h-5 text-violet-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-900 text-sm truncate">{rx.medication}</p>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 uppercase ${RX_STATUS_STYLE[rx.status] || "bg-gray-100 text-gray-500"}`}>{rx.status}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">{rx.dosage} · {rx.frequency} · {rx.duration}</p>
                                    </div>
                                    <button onClick={() => setExpandedRx(expandedRx === rx.id ? null : rx.id)} className="p-1 text-gray-400">
                                        {expandedRx === rx.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                </div>
                                {expandedRx === rx.id && (
                                    <div className="border-t border-gray-50 px-4 py-3 bg-gray-50/50 space-y-1.5">
                                        {rx.instructions && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">{rx.instructions}</p>}
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <Clock className="w-3 h-3" />
                                            {new Date(rx.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ── LABS TAB ── */}
                {activeTab === "labs" && (
                    <div className="space-y-3">
                        {labList.length === 0 ? (
                            <div className="flex flex-col items-center py-16 gap-3 text-gray-300">
                                <FlaskConical className="w-10 h-10" />
                                <p className="text-sm text-gray-400 font-medium">No lab requests yet</p>
                            </div>
                        ) : labList.map((l: any) => (
                            <div key={l.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                                    <FlaskConical className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-sm text-gray-900">{l.test_name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 capitalize">{l.urgency} · {new Date(l.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${l.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                                    {l.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── REFERRALS TAB ── */}
                {activeTab === "refs" && (
                    <div className="space-y-3">
                        {refList.length === 0 ? (
                            <div className="flex flex-col items-center py-16 gap-3 text-gray-300">
                                <UserCheck className="w-10 h-10" />
                                <p className="text-sm text-gray-400 font-medium">No referrals yet</p>
                            </div>
                        ) : refList.map((r: any) => (
                            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-bold text-sm text-gray-900">Referral #{r.id}</p>
                                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 capitalize">{r.urgency}</span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">{r.reason}</p>
                                <p className="text-[11px] text-gray-400 mt-2">{new Date(r.created_at).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Clinical Actions ── */}
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Clinical Actions</p>
                    <div className="grid grid-cols-5 gap-2">
                        {ACTIONS.map((a) => (
                            <button key={a.id} onClick={() => { setForm({}); setModal(a.id as ModalType); }}
                                className="flex flex-col items-center gap-2 active:scale-95 transition-all"
                            >
                                <div className={`w-full aspect-square max-w-[72px] mx-auto bg-gradient-to-br ${a.color} text-white rounded-2xl flex items-center justify-center shadow-md`}>
                                    <a.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">{a.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Modal ── */}
            {activeModal && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setModal(null)} />
                    <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
                        <div className="flex justify-center pt-3 sm:hidden">
                            <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
                        </div>

                        {/* Modal header with gradient accent */}
                        <div className={`mx-5 mt-4 mb-5 px-5 py-4 rounded-2xl bg-gradient-to-r ${ACTIONS.find(a => a.id === activeModal)?.color} text-white`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {(() => { const A = ACTIONS.find(a => a.id === activeModal); return A ? <A.icon className="w-5 h-5" /> : null; })()}
                                    <div>
                                        <h2 className="font-black text-base">{ACTIONS.find(a => a.id === activeModal)?.label}</h2>
                                        <p className="text-[11px] text-white/70">For {getName(patient)}</p>
                                    </div>
                                </div>
                                <button onClick={() => setModal(null)} className="p-1.5 bg-white/20 rounded-xl hover:bg-white/30">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="px-5 pb-6 space-y-4">
                            {activeModal === "prescribe" && (<>
                                <LF l="Medication *"><LI placeholder="e.g. Amoxicillin 500mg" v={form.medication} s={v => sf("medication", v)} /></LF>
                                <div className="grid grid-cols-2 gap-3">
                                    <LF l="Dosage *"><LI placeholder="1 tablet" v={form.dosage} s={v => sf("dosage", v)} /></LF>
                                    <LF l="Frequency *"><LI placeholder="3× daily" v={form.frequency} s={v => sf("frequency", v)} /></LF>
                                </div>
                                <LF l="Duration *"><LI placeholder="e.g. 7 days" v={form.duration} s={v => sf("duration", v)} /></LF>
                                <LF l="Instructions (optional)"><LT placeholder="Take after meals, avoid alcohol..." v={form.instructions} s={v => sf("instructions", v)} /></LF>
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex gap-2">
                                    <Pill className="w-4 h-4 shrink-0 mt-0.5" />
                                    Prescription will be queued at the pharmacy for processing.
                                </div>
                            </>)}

                            {activeModal === "lab" && (<>
                                <LF l="Test Name *"><LI placeholder="Full Blood Count, Malaria RDT, Urinalysis..." v={form.test_name} s={v => sf("test_name", v)} /></LF>
                                <LF l="Urgency"><LS opts={["routine", "urgent", "stat"]} v={form.urgency || "routine"} s={v => sf("urgency", v)} /></LF>
                                <LF l="Clinical Notes"><LT placeholder="Reason, relevant history..." v={form.notes} s={v => sf("notes", v)} /></LF>
                            </>)}

                            {activeModal === "consult" && (<>
                                <LF l="Chief Complaint *"><LI placeholder="Patient's presenting complaint" v={form.chief_complaint} s={v => sf("chief_complaint", v)} /></LF>
                                <LF l="Diagnosis *"><LI placeholder="Clinical diagnosis" v={form.diagnosis} s={v => sf("diagnosis", v)} /></LF>
                                <LF l="Treatment Plan"><LT placeholder="Recommended steps, follow-up..." v={form.treatment_plan} s={v => sf("treatment_plan", v)} /></LF>
                                <LF l="Notes"><LT placeholder="Additional observations..." v={form.notes} s={v => sf("notes", v)} /></LF>
                            </>)}

                            {activeModal === "admit" && (<>
                                <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-700 flex gap-2 items-start">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    Admitting {getName(patient)} will mark the selected bed as occupied.
                                </div>
                                {availBeds.length === 0 ? (
                                    <p className="text-sm text-red-500 text-center py-4">No available beds right now.</p>
                                ) : (
                                    <LF l="Select Bed *">
                                        <LS opts={availBeds.map((b: any) => b.id)} labels={availBeds.map((b: any) => `Bed ${b.bed_number}${b.ward_name ? ` · ${b.ward_name}` : ""}`)} v={form.bed_id || ""} s={v => sf("bed_id", v)} />
                                    </LF>
                                )}
                            </>)}

                            {activeModal === "refer" && (<>
                                {otherDocs.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">No other doctors found.</p>
                                ) : (
                                    <LF l="Refer To *">
                                        <LS opts={otherDocs.map((d: any) => d.id)} labels={otherDocs.map((d: any) => `Dr. ${d.full_name}`)} v={form.referred_doctor_id || ""} s={v => sf("referred_doctor_id", v)} />
                                    </LF>
                                )}
                                <LF l="Urgency"><LS opts={["routine", "urgent", "emergency"]} v={form.urgency || "routine"} s={v => sf("urgency", v)} /></LF>
                                <LF l="Reason *"><LT placeholder="Clinical reasons, specialist required, relevant history..." rows={4} v={form.reason} s={v => sf("reason", v)} /></LF>
                                <LF l="Additional Notes"><LT placeholder="Extra context..." v={form.notes} s={v => sf("notes", v)} /></LF>
                            </>)}

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setModal(null)} className="flex-1 py-4 bg-gray-100 text-gray-700 text-sm font-bold rounded-2xl transition active:scale-95">Cancel</button>
                                <button onClick={handleSubmit} disabled={saving || (activeModal === "admit" && availBeds.length === 0)}
                                    className={`flex-1 py-4 text-white text-sm font-bold rounded-2xl transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg bg-gradient-to-r ${ACTIONS.find(a => a.id === activeModal)?.color}`}
                                >
                                    {saving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                                    <Send className="w-4 h-4" />
                                    {saving ? "Saving..." : "Submit"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Form primitives ──────────────────────────────────────────
function LF({ l, children }: { l: string; children: React.ReactNode }) {
    return <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500">{l}</label>{children}</div>;
}
function LI({ v, s, ...rest }: any) {
    return <input {...rest} value={v || ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => s(e.target.value)} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 placeholder:text-gray-400 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />;
}
function LT({ v, s, rows = 3, ...rest }: any) {
    return <textarea {...rest} value={v || ""} rows={rows} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => s(e.target.value)} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 placeholder:text-gray-400 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none" />;
}
function LS({ v, s, opts, labels }: { v: any; s: (v: string) => void; opts: any[]; labels?: string[] }) {
    return (
        <select value={v} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => s(e.target.value)} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition appearance-none capitalize">
            <option value="">Select...</option>
            {opts.map((o, i) => <option key={o} value={o}>{labels ? labels[i] : o}</option>)}
        </select>
    );
}
