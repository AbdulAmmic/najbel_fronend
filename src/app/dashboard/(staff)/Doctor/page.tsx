"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Users, Calendar, Clock, FlaskConical, Pill, Activity,
    Heart, Thermometer, Droplets, Wind, ChevronRight,
    ArrowUpRight, Play, CheckCircle2, Video, Bed,
    Stethoscope, FileText, TrendingUp, AlertCircle,
    LayoutDashboard, Search
} from "lucide-react";
import {
    auth, appointments, labs, prescriptions, vitals,
    patientService, medicalRecords, beds
} from "@/services/api";

// ─── helpers ──────────────────────────────────────────────────
const fmt   = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const fmtT  = (d: string) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const init  = (n: string) => n?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

const STATUS_COLOR: Record<string, string> = {
    confirmed:    "bg-emerald-100 text-emerald-700",
    pending:      "bg-amber-100 text-amber-700",
    cancelled:    "bg-red-100 text-red-600",
    rescheduled:  "bg-sky-100 text-sky-700",
    active:       "bg-blue-100 text-blue-700",
    dispensed:    "bg-emerald-100 text-emerald-700",
    unavailable:  "bg-red-100 text-red-600",
    requested:    "bg-orange-100 text-orange-700",
    completed:    "bg-emerald-100 text-emerald-700",
    validated:    "bg-violet-100 text-violet-700",
};

type Section = "overview" | "history" | "vitals" | "labs" | "meds";

export default function DoctorDashboard() {
    const router = useRouter();
    const [loading, setLoading]  = useState(true);
    const [user, setUser]        = useState<any>(null);
    const [section, setSection]  = useState<Section>("overview");
    const [search, setSearch]    = useState("");

    // Data
    const [patients, setPatients]       = useState<any[]>([]);
    const [appts, setAppts]             = useState<any[]>([]);
    const [labResults, setLabResults]   = useState<any[]>([]);
    const [rxList, setRxList]           = useState<any[]>([]);
    const [vitalsList, setVitalsList]   = useState<any[]>([]);
    const [records, setRecords]         = useState<any[]>([]);
    const [bedsList, setBedsList]       = useState<any[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const [me, pt, ap, lb, rx, vt, rec, bd] = await Promise.all([
                    auth.getMe(),
                    patientService.getAll().catch(() => []),
                    appointments.getAll().catch(() => []),
                    labs.getAll().catch(() => []),
                    prescriptions.getAll().catch(() => []),
                    vitals.getAll().catch(() => []),
                    medicalRecords.getAll().catch(() => []),
                    beds.getAll().catch(() => []),
                ]);
                setUser(me);
                setPatients(Array.isArray(pt) ? pt : []);
                setAppts((Array.isArray(ap) ? ap : []).sort((a: any, b: any) =>
                    new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()
                ));
                setLabResults((Array.isArray(lb) ? lb : []).slice(0, 30));
                setRxList(Array.isArray(rx) ? rx : []);
                setVitalsList(Array.isArray(vt) ? vt : []);
                setRecords(Array.isArray(rec) ? rec : []);
                setBedsList(Array.isArray(bd) ? bd : []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, []);

    // Derived
    const today         = new Date().toISOString().split("T")[0];
    const todayAppts    = appts.filter(a => a.appointment_time?.startsWith(today));
    const waiting       = appts.filter(a => ["confirmed","checked-in"].includes(a.status?.toLowerCase()) && !a.completed);
    const pendingLabs   = labResults.filter(l => !["completed","validated"].includes(l.status));
    const activeRx      = rxList.filter(r => r.status === "active");
    const occupiedBeds  = bedsList.filter(b => b.status === "occupied").length;

    // Vitals — group latest per patient
    const latestVitals = vitalsList.reduce((acc: Record<number, any>, v: any) => {
        if (!acc[v.patient_id] || new Date(v.recorded_at) > new Date(acc[v.patient_id].recorded_at)) {
            acc[v.patient_id] = v;
        }
        return acc;
    }, {});
    const vitalsArr = Object.values(latestVitals)
        .sort((a: any, b: any) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
        .slice(0, 20);

    // Search filter for Overview
    const filteredPatients = patients.filter(p => {
        const name = p?.user?.full_name || p?.full_name || "";
        return !search || name.toLowerCase().includes(search.toLowerCase());
    }).slice(0, 30);

    const acceptAppt = async (id: number) => {
        try {
            await appointments.updateStatus(id, "confirmed");
            setAppts(prev => prev.map(a => a.id === id ? { ...a, status: "confirmed" } : a));
        } catch {}
    };

    const SECTIONS: { id: Section; label: string; icon: any; badge?: number }[] = [
        { id: "overview", label: "Overview",  icon: LayoutDashboard, badge: patients.length },
        { id: "history",  label: "History",   icon: FileText,        badge: records.length },
        { id: "vitals",   label: "Vitals",    icon: Activity,        badge: vitalsArr.length },
        { id: "labs",     label: "Labs",      icon: FlaskConical,    badge: pendingLabs.length },
        { id: "meds",     label: "Meds",      icon: Pill,            badge: activeRx.length },
    ];

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F6FA]">
            <div className="w-9 h-9 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F4F6FA]">

            {/* ══ HEADER ══════════════════════════════════════════════ */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-5 pt-5 pb-0">

                    {/* Top row */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[11px] text-gray-400 font-medium">
                                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                            </p>
                            <h1 className="text-xl font-black text-gray-900 leading-tight mt-0.5">
                                Dr. {user?.full_name?.split(" ")[0] || "Doctor"} 👋
                            </h1>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {todayAppts.length} today · {waiting.length} waiting · {occupiedBeds} beds occupied
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Link href="/dashboard/Doctor/appointments"
                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl font-semibold transition active:scale-95">
                                Schedule
                            </Link>
                            <Link href="/dashboard/Doctor/patients"
                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl font-semibold shadow-sm shadow-blue-200 transition active:scale-95">
                                Patients
                            </Link>
                        </div>
                    </div>

                    {/* KPI row */}
                    <div className="grid grid-cols-4 gap-2.5 mb-4">
                        {[
                            { label: "Patients",   v: patients.length,    icon: Users,       from: "from-blue-500",    to: "to-blue-600" },
                            { label: "Appts Today",v: todayAppts.length,  icon: Calendar,    from: "from-violet-500",  to: "to-purple-600" },
                            { label: "Pending Labs",v: pendingLabs.length, icon: FlaskConical,from: "from-amber-400",   to: "to-orange-500" },
                            { label: "Active Rx",  v: activeRx.length,    icon: Pill,        from: "from-emerald-500", to: "to-teal-600" },
                        ].map((k, i) => (
                            <div key={i} className={`bg-gradient-to-br ${k.from} ${k.to} text-white rounded-2xl p-3 shadow-md`}>
                                <k.icon className="w-4 h-4 opacity-80 mb-1" />
                                <div className="text-xl font-black leading-none">{k.v}</div>
                                <div className="text-[9px] font-bold opacity-75 mt-0.5 leading-tight">{k.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Section nav */}
                    <div className="-mx-5 px-5 overflow-x-auto no-scrollbar flex gap-0 border-t border-gray-50">
                        {SECTIONS.map(s => (
                            <button key={s.id} onClick={() => setSection(s.id)}
                                className={`relative flex items-center gap-1.5 whitespace-nowrap pb-3 pt-3 px-1 mr-5 text-sm font-bold border-b-2 transition-all ${
                                    section === s.id
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-400 hover:text-gray-700"
                                }`}
                            >
                                <s.icon className="w-3.5 h-3.5" />
                                {s.label}
                                {s.badge !== undefined && s.badge > 0 && (
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${section === s.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                                        {s.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══ CONTENT ═════════════════════════════════════════════ */}
            <div className="max-w-5xl mx-auto px-4 sm:px-5 py-5 pb-28 space-y-4">

                {/* ── OVERVIEW: Patient profiles + today's queue ── */}
                {section === "overview" && (
                    <>
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search patient name..."
                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium text-gray-700 placeholder:text-gray-400 outline-none focus:border-blue-400 shadow-sm transition"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Patient list */}
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                                    <h3 className="font-bold text-gray-900 text-sm">Patient Profiles</h3>
                                    <Link href="/dashboard/Doctor/patients" className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                                        View All <ArrowUpRight className="w-3 h-3" />
                                    </Link>
                                </div>
                                {filteredPatients.length === 0 ? (
                                    <div className="py-16 flex flex-col items-center gap-2 text-gray-300">
                                        <Users className="w-9 h-9" />
                                        <p className="text-sm text-gray-400">No patients found</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {filteredPatients.map(p => {
                                            const name    = p?.user?.full_name || p?.full_name || "Unknown";
                                            const email   = p?.user?.email || p?.email || "—";
                                            const gender  = p?.gender || "—";
                                            const blood   = p?.blood_group || "";
                                            return (
                                                <div key={p.id} onClick={() => router.push(`/dashboard/Doctor/patients/${p.id}`)}
                                                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 cursor-pointer transition-colors group"
                                                >
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-sm font-black shrink-0 shadow-sm">
                                                        {init(name)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm text-gray-900 truncate">{name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-gray-400">{email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium capitalize">{gender}</span>
                                                            {blood && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">{blood}</span>}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition shrink-0" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Today's queue + waiting */}
                            <div className="space-y-3">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                                        <h3 className="font-bold text-gray-900 text-sm">Today's Queue</h3>
                                        <span className="text-xs bg-blue-50 text-blue-700 font-black px-2 py-0.5 rounded-full">{todayAppts.length}</span>
                                    </div>
                                    {todayAppts.length === 0 ? (
                                        <p className="text-center py-8 text-xs text-gray-400">No appointments today</p>
                                    ) : (
                                        <div className="divide-y divide-gray-50">
                                            {todayAppts.slice(0, 6).map((a, i) => (
                                                <div key={a.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors">
                                                    <span className="text-xs font-bold text-gray-300 w-4 shrink-0">{i + 1}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-gray-900 truncate">{a.patient?.user?.full_name || "Patient"}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <Clock className="w-3 h-3 text-gray-300" />
                                                            <span className="text-[10px] text-gray-400">{fmtT(a.appointment_time)}</span>
                                                            {a.type === "online" && <Video className="w-2.5 h-2.5 text-blue-500" />}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[a.status?.toLowerCase()] || "bg-gray-100 text-gray-500"}`}>{a.status}</span>
                                                        {a.status === "pending" && (
                                                            <button onClick={() => acceptAppt(a.id)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 active:scale-90 transition">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        {["confirmed","checked-in"].includes(a.status?.toLowerCase()) && (
                                                            <button onClick={() => router.push(`/dashboard/consultations/${a.id}`)} className="p-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 active:scale-90 transition">
                                                                <Play className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Bed status mini */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                    <h3 className="font-bold text-gray-900 text-sm mb-3">Ward Beds</h3>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex-1 bg-red-50 rounded-xl p-2.5 text-center">
                                            <p className="text-lg font-black text-red-600">{occupiedBeds}</p>
                                            <p className="text-[9px] font-bold text-red-400">Occupied</p>
                                        </div>
                                        <div className="flex-1 bg-emerald-50 rounded-xl p-2.5 text-center">
                                            <p className="text-lg font-black text-emerald-600">{bedsList.filter(b => b.status === "available").length}</p>
                                            <p className="text-[9px] font-bold text-emerald-400">Available</p>
                                        </div>
                                    </div>
                                    <Link href="/dashboard/beds" className="flex items-center justify-center gap-1.5 text-xs text-blue-600 font-bold hover:underline">
                                        View Ward Map <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ── MEDICAL HISTORY ── */}
                {section === "history" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-black text-gray-900">Medical History</h2>
                            <span className="text-xs text-gray-400">{records.length} records</span>
                        </div>

                        {/* Recent consultations / visits */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-violet-500" /> Medical Records
                                </h3>
                                <Link href="/dashboard/records" className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                                    View All <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            </div>

                            {records.length === 0 ? (
                                <div className="py-16 flex flex-col items-center gap-2 text-gray-300">
                                    <FileText className="w-9 h-9" />
                                    <p className="text-sm text-gray-400">No records yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {records.slice(0, 20).map((r: any) => (
                                        <div key={r.id} className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50/60 transition-colors">
                                            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                                                <FileText className="w-4 h-4 text-violet-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="font-bold text-sm text-gray-900">{r.diagnosis || r.chief_complaint || "Medical Record"}</p>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">{fmt(r.created_at || r.date)}</span>
                                                </div>
                                                {r.treatment_plan && <p className="text-xs text-gray-500 mt-0.5 truncate">{r.treatment_plan}</p>}
                                                <p className="text-[10px] text-blue-500 font-semibold mt-1">Patient #{r.patient_id}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Past appointments summary */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-50">
                                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-500" /> Past Appointments
                                </h3>
                            </div>
                            {appts.filter(a => a.status === "completed").length === 0 ? (
                                <p className="py-10 text-center text-xs text-gray-400">No completed appointments yet</p>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {appts.filter(a => a.status === "completed").slice(0, 10).map(a => (
                                        <div key={a.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                                            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-sm font-black text-blue-600 shrink-0">
                                                {init(a.patient?.user?.full_name || "?")}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-gray-900 truncate">{a.patient?.user?.full_name || "Patient"}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{fmt(a.appointment_time)}</p>
                                            </div>
                                            <span className="text-[9px] bg-emerald-100 text-emerald-700 font-black px-2 py-0.5 rounded-full">Completed</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── VITALS TRACKING ── */}
                {section === "vitals" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-black text-gray-900">Vitals Tracking</h2>
                            <Link href="/dashboard/vitals" className="text-xs text-blue-600 font-semibold flex items-center gap-1">Record New <ArrowUpRight className="w-3 h-3" /></Link>
                        </div>

                        {vitalsArr.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-3 text-gray-300">
                                <Activity className="w-10 h-10" />
                                <p className="text-sm text-gray-400">No vitals recorded yet</p>
                                <Link href="/dashboard/vitals" className="text-xs text-blue-600 hover:underline">Record vitals →</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {vitalsArr.map((v: any) => {
                                    const patient = patients.find(p => p.id === v.patient_id);
                                    const name    = patient?.user?.full_name || patient?.full_name || `Patient #${v.patient_id}`;
                                    return (
                                        <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                            {/* Patient header */}
                                            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 bg-gray-50/50">
                                                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl flex items-center justify-center text-sm font-black shrink-0">{init(name)}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-gray-900 truncate">{name}</p>
                                                    <p className="text-[10px] text-gray-400">{fmt(v.recorded_at)}</p>
                                                </div>
                                            </div>

                                            {/* Metrics grid */}
                                            <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-gray-50">
                                                {[
                                                    { icon: Heart,        label: "Heart Rate",   val: v.heart_rate     ? `${v.heart_rate} bpm`    : "—", color: "text-red-500",    ok: v.heart_rate && v.heart_rate >= 60 && v.heart_rate <= 100 },
                                                    { icon: Droplets,     label: "Blood Pres.",  val: v.blood_pressure || "—",                      color: "text-blue-600",   ok: true },
                                                    { icon: Thermometer,  label: "Temperature",  val: v.temperature    ? `${v.temperature}°C`      : "—", color: "text-amber-500",  ok: v.temperature && v.temperature >= 36.1 && v.temperature <= 37.2 },
                                                    { icon: Wind,         label: "SpO₂",         val: v.oxygen_saturation ? `${v.oxygen_saturation}%` : "—", color: "text-cyan-600", ok: !v.oxygen_saturation || v.oxygen_saturation >= 95 },
                                                ].map((m, i) => (
                                                    <div key={i} className="flex items-start gap-2.5 p-3.5">
                                                        <div className={`w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 ${m.color}`}>
                                                            <m.icon className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 font-medium">{m.label}</p>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <p className={`text-sm font-black ${m.ok ? "text-gray-900" : "text-red-500"}`}>{m.val}</p>
                                                                {m.val !== "—" && !m.ok && <AlertCircle className="w-3 h-3 text-red-500" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── LAB / TEST RESULTS ── */}
                {section === "labs" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-black text-gray-900">Lab & Diagnostic Results</h2>
                            <Link href="/dashboard/laboratory/requests" className="text-xs text-blue-600 font-semibold flex items-center gap-1">All Labs <ArrowUpRight className="w-3 h-3" /></Link>
                        </div>

                        {/* Pending alert */}
                        {pendingLabs.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-amber-900">{pendingLabs.length} lab results pending review</p>
                                    <p className="text-xs text-amber-700 mt-0.5">Check and validate outstanding test results</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1fr_1fr] px-5 py-3 border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest gap-4">
                                <div>Test Name</div><div>Patient</div><div>Status</div><div>Date</div>
                            </div>
                            {labResults.length === 0 ? (
                                <div className="py-20 flex flex-col items-center gap-2 text-gray-300">
                                    <FlaskConical className="w-10 h-10" />
                                    <p className="text-sm text-gray-400">No lab results yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {labResults.map(l => {
                                        const patient = patients.find(p => p.id === l.patient_id);
                                        const name    = patient?.user?.full_name || patient?.full_name || `Patient #${l.patient_id}`;
                                        return (
                                            <div key={l.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                                                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                                                    <FlaskConical className="w-4 h-4 text-amber-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-gray-900">{l.test_name || "Lab Test"}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-[10px] text-gray-500 truncate">{name}</p>
                                                        {l.result && <p className="text-[10px] text-gray-400 truncate max-w-[140px]">Result: {l.result}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_COLOR[l.status] || "bg-gray-100 text-gray-500"}`}>
                                                        {l.status}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">{fmt(l.recorded_at || l.created_at)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── MEDICATION MANAGEMENT ── */}
                {section === "meds" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-black text-gray-900">Medication Management</h2>
                            <span className="text-xs text-gray-400">{rxList.length} total prescriptions</span>
                        </div>

                        {/* Active prescriptions */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    <Pill className="w-4 h-4 text-violet-500" /> Active Prescriptions
                                </h3>
                                <span className="text-xs bg-blue-50 text-blue-700 font-black px-2 py-0.5 rounded-full">{activeRx.length}</span>
                            </div>

                            {activeRx.length === 0 ? (
                                <p className="py-12 text-center text-sm text-gray-400">No active prescriptions</p>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {activeRx.map(rx => {
                                        const patient = patients.find(p => p.id === rx.patient_id);
                                        const name    = patient?.user?.full_name || patient?.full_name || `Patient #${rx.patient_id}`;
                                        return (
                                            <div key={rx.id} onClick={() => router.push(`/dashboard/Doctor/patients/${rx.patient_id}`)}
                                                className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/60 cursor-pointer transition-colors group"
                                            >
                                                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                                                    <Pill className="w-5 h-5 text-violet-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-black text-sm text-gray-900">{rx.medication}</p>
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_COLOR[rx.status] || "bg-gray-100 text-gray-500"}`}>{rx.status}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5">{rx.dosage} · {rx.frequency} · {rx.duration}</p>
                                                    <p className="text-[10px] font-semibold text-blue-500 mt-1">{name}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-[10px] text-gray-400">{fmt(rx.created_at)}</p>
                                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition mt-1 ml-auto" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* All prescriptions history */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-50">
                                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-gray-400" /> Prescription History
                                </h3>
                            </div>
                            {rxList.filter(r => r.status !== "active").length === 0 ? (
                                <p className="py-8 text-center text-xs text-gray-400">No history yet</p>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {rxList.filter(r => r.status !== "active").slice(0, 15).map(rx => {
                                        const patient = patients.find(p => p.id === rx.patient_id);
                                        const name    = patient?.user?.full_name || patient?.full_name || `Patient #${rx.patient_id}`;
                                        return (
                                            <div key={rx.id} className="flex items-center gap-3 px-5 py-3.5">
                                                <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                                                    <Pill className="w-3.5 h-3.5 text-gray-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-gray-700 truncate">{rx.medication}</p>
                                                    <p className="text-xs text-gray-400 truncate">{name} · {fmt(rx.created_at)}</p>
                                                </div>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_COLOR[rx.status] || "bg-gray-100 text-gray-500"}`}>{rx.status}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
