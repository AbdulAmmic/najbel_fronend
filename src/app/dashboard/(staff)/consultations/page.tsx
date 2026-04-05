"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Search, FileText, Calendar, Heart,
    Activity, Clock, Stethoscope, Pill, Thermometer,
    AlertCircle, ChevronRight, Filter, Download,
    CheckCircle, X, BedDouble, Share2, ArrowUpRight,
    Syringe, TrendingUp, Users
} from "lucide-react";
import { appointments, medicalRecords, patientService } from "@/services/api";

// ─── Types ─────────────────────────────────────────────────

interface VitalSigns { bp: string; hr: number; temp: number; spo2: number; }
interface Consultation {
    id: number;
    patient_id: number;
    patient_name: string;
    patient_age?: number;
    patient_gender?: string;
    diagnosis: string;
    notes: string;
    created_at: string;
    duration?: string;
    is_admitted?: boolean;
    referral_needed?: boolean;
    referral_to?: string;
    vital_signs?: VitalSigns;
    medications?: string[];
    follow_up?: string;
    status: string;
}

// ─── Helpers ────────────────────────────────────────────────

const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const fmtShort = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

const avatarBg = (name: string) => {
    const palette = [
        "from-blue-500 to-indigo-600",
        "from-violet-500 to-purple-700",
        "from-emerald-500 to-teal-700",
        "from-rose-500 to-pink-700",
        "from-amber-500 to-orange-700",
        "from-cyan-500 to-sky-700",
    ];
    const idx = (name.charCodeAt(0) || 0) % palette.length;
    return palette[idx];
};

const initials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

// ─── Status Badge ───────────────────────────────────────────

const StatusBadge = ({ c }: { c: Consultation }) => {
    if (c.is_admitted)
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1"><BedDouble className="w-2.5 h-2.5" />Admitted</span>;
    if (c.referral_needed)
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">Referred</span>;
    if (c.status === "pending")
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">Pending</span>;
    return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">Completed</span>;
};

// ─── Consultation Card ──────────────────────────────────────

const ConsultCard = ({ c, onView }: { c: Consultation; onView: (c: Consultation) => void }) => {
    const grad = avatarBg(c.patient_name);
    return (
        <div
            onClick={() => onView(c)}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.98] transition-all cursor-pointer hover:shadow-md hover:border-gray-200"
        >
            {c.is_admitted && <div className="h-0.5 bg-gradient-to-r from-red-400 via-orange-400 to-red-400" />}

            <div className="p-4">
                {/* Top row */}
                <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md bg-gradient-to-br ${grad}`}>
                        {initials(c.patient_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-gray-900 text-[15px] leading-tight truncate">{c.patient_name}</h3>
                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <StatusBadge c={c} />
                            {c.patient_age && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                    {c.patient_age}y · {c.patient_gender}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Diagnosis */}
                <div className="mt-3 px-3 py-2.5 bg-blue-50/60 rounded-2xl">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-0.5">Diagnosis</p>
                    <p className="text-sm font-bold text-blue-900 leading-snug">{c.diagnosis}</p>
                </div>

                {/* Vitals strip */}
                {c.vital_signs && (
                    <div className="grid grid-cols-4 gap-1.5 mt-3">
                        {[
                            { icon: Activity, val: c.vital_signs.bp, label: "BP", color: "text-red-500 bg-red-50" },
                            { icon: Heart, val: `${c.vital_signs.hr}`, label: "HR", color: "text-pink-500 bg-pink-50" },
                            { icon: Thermometer, val: `${c.vital_signs.temp}°`, label: "Temp", color: "text-orange-500 bg-orange-50" },
                            { icon: AlertCircle, val: `${c.vital_signs.spo2}%`, label: "SpO₂", color: "text-blue-500 bg-blue-50" },
                        ].map(({ icon: Icon, val, label, color }) => (
                            <div key={label} className={`rounded-2xl p-2 text-center ${color.split(" ")[1]}`}>
                                <Icon className={`w-3 h-3 mx-auto mb-0.5 ${color.split(" ")[0]}`} />
                                <p className="text-[10px] font-black text-gray-800">{val}</p>
                                <p className="text-[8px] text-gray-400 font-semibold">{label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[11px] font-semibold">{fmtShort(c.created_at)}</span>
                        {c.duration && <>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <Clock className="w-3 h-3" />
                            <span className="text-[11px] font-semibold">{c.duration}</span>
                        </>}
                    </div>
                    {c.referral_to && (
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                            → {c.referral_to}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Detail Sheet ───────────────────────────────────────────

const DetailSheet = ({ c, onClose }: { c: Consultation; onClose: () => void }) => {
    const grad = avatarBg(c.patient_name);
    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-5 pt-2 pb-4 flex items-center justify-between">
                    <h2 className="text-lg font-black text-gray-900">Consultation Details</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                <div className="px-5 pb-10 space-y-4">
                    {/* Patient card */}
                    <div className={`rounded-3xl p-4 bg-gradient-to-br ${grad} text-white`}>
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-black text-lg">
                                {initials(c.patient_name)}
                            </div>
                            <div>
                                <p className="font-black text-base">{c.patient_name}</p>
                                {c.patient_age && <p className="text-white/80 text-xs font-semibold mt-0.5">{c.patient_age} years · {c.patient_gender}</p>}
                                <p className="text-white/60 text-[10px] mt-1">ID: {c.patient_id}</p>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-white/70" />
                            <span className="text-white/80 text-xs font-semibold">{fmt(c.created_at)}</span>
                            {c.duration && <>
                                <span className="text-white/40">·</span>
                                <Clock className="w-3.5 h-3.5 text-white/70" />
                                <span className="text-white/80 text-xs font-semibold">{c.duration}</span>
                            </>}
                            <div className="ml-auto"><StatusBadge c={c} /></div>
                        </div>
                    </div>

                    {/* Diagnosis */}
                    <div className="bg-blue-50 rounded-3xl p-4">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Stethoscope className="w-3 h-3" /> Diagnosis
                        </p>
                        <p className="font-black text-blue-900 text-base">{c.diagnosis}</p>
                        {c.notes && <p className="text-blue-700/70 text-sm mt-2 leading-relaxed">{c.notes}</p>}
                    </div>

                    {/* Vitals */}
                    {c.vital_signs && (
                        <div>
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Vital Signs</p>
                            <div className="grid grid-cols-2 gap-2.5">
                                {[
                                    { icon: Activity, label: "Blood Pressure", val: c.vital_signs.bp, color: "bg-red-50 text-red-600", sub: "mmHg" },
                                    { icon: Heart, label: "Heart Rate", val: `${c.vital_signs.hr}`, color: "bg-pink-50 text-pink-600", sub: "bpm" },
                                    { icon: Thermometer, label: "Temperature", val: `${c.vital_signs.temp}°F`, color: "bg-orange-50 text-orange-600", sub: "" },
                                    { icon: AlertCircle, label: "Blood Oxygen", val: `${c.vital_signs.spo2}%`, color: "bg-blue-50 text-blue-600", sub: "SpO₂" },
                                ].map(({ icon: Icon, label, val, color }) => (
                                    <div key={label} className="bg-white border border-gray-100 rounded-3xl p-3.5">
                                        <div className={`w-8 h-8 rounded-xl ${color.split(" ")[0]} flex items-center justify-center mb-2`}>
                                            <Icon className={`w-4 h-4 ${color.split(" ")[1]}`} />
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-semibold">{label}</p>
                                        <p className="text-xl font-black text-gray-900 mt-0.5">{val}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Medications */}
                    {c.medications && c.medications.length > 0 && (
                        <div>
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5">Medications Prescribed</p>
                            <div className="space-y-2">
                                {c.medications.map((med, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3">
                                        <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                                            <Pill className="w-4 h-4 text-violet-600" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800">{med}</span>
                                        <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Follow up */}
                    {(c.follow_up || c.referral_to) && (
                        <div className="bg-white border border-gray-100 rounded-3xl p-4 space-y-2.5">
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Follow-Up</p>
                            {c.follow_up && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 font-medium">Next Appointment</span>
                                    <span className="text-sm font-bold text-gray-900">{c.follow_up}</span>
                                </div>
                            )}
                            {c.referral_to && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 font-medium">Referred To</span>
                                    <span className="text-sm font-bold text-purple-600">{c.referral_to}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-100 text-gray-700 text-sm font-bold active:scale-95 transition-transform">
                            <Download className="w-4 h-4" /> Export
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold active:scale-95 transition-transform shadow-md shadow-blue-200">
                            <Share2 className="w-4 h-4" /> Share
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ──────────────────────────────────────────────

const FILTERS = ["All", "Completed", "Admitted", "Referred", "Pending"] as const;
type FilterType = typeof FILTERS[number];

export default function ConsultationsPage() {
    const router = useRouter();
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterType>("All");
    const [selected, setSelected] = useState<Consultation | null>(null);
    const [patients, setPatients] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [appts, recs, pts] = await Promise.all([
                    appointments.getAll().catch(() => []),
                    medicalRecords.getAll().catch(() => []),
                    patientService.getAll().catch(() => []),
                ]);
                setPatients(Array.isArray(pts) ? pts : []);

                // Build consultation list from appointments
                const apptList: Consultation[] = (Array.isArray(appts) ? appts : []).map((a: any) => {
                    const p = Array.isArray(pts) ? pts.find((pt: any) => pt.id === a.patient_id) : null;
                    const pName = a.patient?.user?.full_name || a.patient?.full_name || p?.full_name || `Patient #${a.patient_id}`;
                    return {
                        id: a.id,
                        patient_id: a.patient_id,
                        patient_name: pName,
                        patient_age: p?.date_of_birth ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000)) : undefined,
                        patient_gender: p?.gender,
                        diagnosis: a.reason || a.chief_complaint || "General Consultation",
                        notes: a.notes || "",
                        created_at: a.appointment_time || a.created_at,
                        status: a.status || "pending",
                        is_admitted: p?.is_admitted || false,
                    } as Consultation;
                });

                // Merge medical records as consultations too
                const recList: Consultation[] = (Array.isArray(recs) ? recs : []).map((r: any) => {
                    const p = Array.isArray(pts) ? pts.find((pt: any) => pt.id === r.patient_id) : null;
                    const pName = r.patient?.user?.full_name || p?.full_name || `Patient #${r.patient_id}`;
                    return {
                        id: r.id + 100000,
                        patient_id: r.patient_id,
                        patient_name: pName,
                        patient_gender: p?.gender,
                        diagnosis: r.diagnosis || r.chief_complaint || "Medical Record",
                        notes: r.treatment_plan || r.notes || "",
                        created_at: r.created_at || r.date,
                        status: "completed",
                    } as Consultation;
                });

                const all = [...apptList, ...recList].sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                setConsultations(all);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filtered = consultations.filter(c => {
        const matchSearch = !search ||
            c.patient_name.toLowerCase().includes(search.toLowerCase()) ||
            c.diagnosis.toLowerCase().includes(search.toLowerCase());
        const matchFilter =
            filter === "All" ||
            (filter === "Admitted" && c.is_admitted) ||
            (filter === "Referred" && c.referral_needed) ||
            (filter === "Completed" && c.status === "completed" && !c.is_admitted) ||
            (filter === "Pending" && c.status === "pending");
        return matchSearch && matchFilter;
    });

    // Stats
    const total     = consultations.length;
    const admitted  = consultations.filter(c => c.is_admitted).length;
    const referred  = consultations.filter(c => c.referral_needed).length;
    const completed = consultations.filter(c => c.status === "completed").length;

    return (
        <div className="min-h-screen bg-[#F4F6FB]">

            {/* ── Sticky header ── */}
            <div className="sticky top-0 z-30 bg-[#F4F6FB]/95 backdrop-blur-lg px-4 pt-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h1 className="text-xl font-black text-gray-900">Consultations</h1>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                            {loading ? "Loading…" : `${total} total records`}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/dashboard/Doctor/appointments")}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-200 active:scale-95 transition"
                    >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        New Appt
                    </button>
                </div>

                {/* Stat pills */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-0.5">
                    {[
                        { icon: Users, label: `${total} Total`, color: "text-gray-600", bg: "bg-white" },
                        { icon: CheckCircle, label: `${completed} Done`, color: "text-emerald-600", bg: "bg-emerald-50" },
                        { icon: BedDouble, label: `${admitted} Admitted`, color: "text-red-600", bg: "bg-red-50" },
                        { icon: Syringe, label: `${referred} Referred`, color: "text-purple-600", bg: "bg-purple-50" },
                    ].map(({ icon: Icon, label, color, bg }) => (
                        <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${bg} border border-gray-100/80 flex-shrink-0`}>
                            <Icon className={`w-3 h-3 ${color}`} />
                            <span className={`text-[11px] font-bold ${color}`}>{label}</span>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search patient or diagnosis…"
                        className="w-full pl-10 pr-10 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                            <X className="w-3 h-3 text-gray-500" />
                        </button>
                    )}
                </div>

                {/* Filter chips */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold flex-shrink-0 transition-all active:scale-95 ${
                                filter === f
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                    : "bg-white text-gray-500 border border-gray-200"
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="px-4 pb-28 pt-2 space-y-3">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-3xl border border-gray-100 p-4 animate-pulse">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-2xl bg-gray-200" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
                                    <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                                </div>
                            </div>
                            <div className="h-12 bg-blue-50 rounded-2xl" />
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-20 gap-4 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                            <FileText className="w-9 h-9 text-gray-300" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-700 mb-1">No consultations found</p>
                            <p className="text-sm text-gray-400">
                                {search ? `No results for "${search}"` : "No records match your filter"}
                            </p>
                        </div>
                        {(search || filter !== "All") && (
                            <button
                                onClick={() => { setSearch(""); setFilter("All"); }}
                                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-2xl shadow-md shadow-blue-200 active:scale-95 transition"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    filtered.map(c => (
                        <ConsultCard key={c.id} c={c} onView={setSelected} />
                    ))
                )}
            </div>

            {/* ── Detail bottom sheet ── */}
            {selected && <DetailSheet c={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}