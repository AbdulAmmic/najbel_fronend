"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Calendar, Clock, Video, MapPin, Search,
    CheckCircle, XCircle, ChevronRight, RefreshCcw,
    MessageSquare, Play, X, Users, AlertCircle,
    Phone, Stethoscope
} from "lucide-react";
import { appointments as appointmentsApi } from "@/services/api";
import { formatDate, formatTime, calculateAge, isValidDate } from "@/utils/date";

// ─── Types ──────────────────────────────────────────────────

interface Appointment {
    id: number;
    patient: { id: number; name: string; age: string | number; gender: string };
    time: string;
    date: string;
    fullDate?: string;
    status: "pending" | "confirmed" | "cancelled" | "completed" | "checked-in" | "rescheduled";
    type: "in-person" | "virtual";
    reason: string;
    duration: string;
    priority: "low" | "medium" | "high";
}

// ─── Helpers ─────────────────────────────────────────────────

const avatarGrad = (name: string) => {
    const p = [
        "from-blue-500 to-indigo-600",
        "from-violet-500 to-purple-600",
        "from-emerald-500 to-teal-600",
        "from-rose-500 to-pink-600",
        "from-amber-500 to-orange-600",
        "from-cyan-500 to-sky-600",
    ];
    return p[(name.charCodeAt(0) || 0) % p.length];
};

const initials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const STATUS_STYLES: Record<string, string> = {
    confirmed:   "bg-blue-100 text-blue-700",
    pending:     "bg-amber-100 text-amber-700",
    rescheduled: "bg-orange-100 text-orange-700",
    completed:   "bg-emerald-100 text-emerald-700",
    cancelled:   "bg-red-100 text-red-600",
    "checked-in":"bg-purple-100 text-purple-700",
};

const PRIORITY_DOT: Record<string, string> = {
    high:   "bg-red-500",
    medium: "bg-amber-400",
    low:    "bg-emerald-500",
};

const FILTERS = ["All", "Pending", "Confirmed", "Completed", "Cancelled"] as const;
type FilterType = typeof FILTERS[number];

// ─── Appointment Card ────────────────────────────────────────

const ApptCard = ({
    apt, onAccept, onDecline, onReschedule, onStart, onSelect
}: {
    apt: Appointment;
    onAccept: (id: number) => void;
    onDecline: (id: number) => void;
    onReschedule: (id: number) => void;
    onStart: (apt: Appointment) => void;
    onSelect: (apt: Appointment) => void;
}) => {
    const grad = avatarGrad(apt.patient.name);
    const isToday = apt.date === "Today";

    return (
        <div
            className={`bg-white rounded-3xl border overflow-hidden shadow-sm active:scale-[0.99] transition-transform
                ${isToday ? "border-blue-100" : "border-gray-100"}`}
        >
            {isToday && <div className="h-0.5 bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-400" />}

            <div className="p-4">
                {/* Patient row */}
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md bg-gradient-to-br ${grad}`}>
                        {initials(apt.patient.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-[15px] leading-tight truncate">{apt.patient.name}</h3>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${STATUS_STYLES[apt.status] || "bg-gray-100 text-gray-600"}`}>
                                {apt.status}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                            {apt.patient.age ? `${apt.patient.age}y` : ""}{apt.patient.gender ? ` · ${apt.patient.gender}` : ""}
                        </p>
                    </div>
                    <button
                        onClick={() => onSelect(apt)}
                        className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {/* Reason box */}
                <div className="bg-gray-50 rounded-2xl px-3 py-2.5 mb-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Reason</p>
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{apt.reason}</p>
                </div>

                {/* Time + meta row */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[apt.priority] || "bg-gray-300"}`} />
                        <span className="text-[11px] text-gray-500 font-semibold capitalize">{apt.priority}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span className="text-[11px] font-semibold">{apt.time}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[11px] font-semibold">{apt.date}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                        {apt.type === "virtual"
                            ? <><Video className="w-3 h-3 text-purple-500" /><span className="text-[11px] text-purple-500 font-bold">Virtual</span></>
                            : <><MapPin className="w-3 h-3 text-blue-500" /><span className="text-[11px] text-blue-500 font-bold">In-Person</span></>
                        }
                    </div>
                </div>

                {/* Actions */}
                {apt.status === "pending" && (
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => onAccept(apt.id)}
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold active:scale-95 transition-transform shadow-sm shadow-emerald-200"
                        >
                            <CheckCircle className="w-3.5 h-3.5" /> Accept
                        </button>
                        <button
                            onClick={() => onReschedule(apt.id)}
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-blue-50 text-blue-700 text-xs font-bold active:scale-95 transition-transform"
                        >
                            <RefreshCcw className="w-3.5 h-3.5" /> Reschedule
                        </button>
                        <button
                            onClick={() => onDecline(apt.id)}
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-red-50 text-red-600 text-xs font-bold active:scale-95 transition-transform"
                        >
                            <XCircle className="w-3.5 h-3.5" /> Decline
                        </button>
                    </div>
                )}
                {(apt.status === "confirmed" || apt.status === "checked-in") && (
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onStart(apt)}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-bold active:scale-95 transition-transform shadow-md shadow-blue-200"
                        >
                            {apt.type === "virtual" ? <Video className="w-3.5 h-3.5" /> : <Stethoscope className="w-3.5 h-3.5" />}
                            {apt.type === "virtual" ? "Join Video" : "Start Consult"}
                        </button>
                        <button
                            onClick={() => onDecline(apt.id)}
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-gray-100 text-gray-600 text-xs font-bold active:scale-95 transition-transform"
                        >
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                    </div>
                )}
                {apt.status === "rescheduled" && (
                    <div className="flex items-center gap-2">
                        <span className="flex-1 text-center text-[11px] font-bold text-orange-600 bg-orange-50 py-2 rounded-2xl">
                            ⏳ Awaiting patient confirmation
                        </span>
                        <button onClick={() => onDecline(apt.id)} className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
                            <XCircle className="w-4 h-4 text-red-500" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Modal/Sheet ────────────────────────────────────────────

const BottomSheet = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-t-[32px] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="px-5 pt-2 pb-3 flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900">{title}</h2>
                <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            </div>
            <div className="px-5 pb-10">{children}</div>
        </div>
    </div>
);

// ─── Main Page ───────────────────────────────────────────────

export default function DoctorAppointments() {
    const router = useRouter();
    const [appts, setAppts]     = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter]   = useState<FilterType>("All");
    const [search, setSearch]   = useState("");
    const [selected, setSelected] = useState<Appointment | null>(null);

    const [cancelId, setCancelId]       = useState<number | null>(null);
    const [rescheduleId, setRescheduleId] = useState<number | null>(null);
    const [actionNote, setActionNote]   = useState("");
    const [newTime, setNewTime]         = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const data = await appointmentsApi.getAll();
            const list: Appointment[] = Array.isArray(data) ? data.map((a: any) => ({
                id: a.id,
                patient: {
                    id: a.patient_id,
                    name: a.patient?.user?.full_name || a.patient?.full_name || "Unknown Patient",
                    age: calculateAge(a.patient?.dob),
                    gender: a.patient?.gender || "",
                },
                time: formatTime(a.appointment_time || a.start_time),
                date: isValidDate(a.appointment_time || a.start_time) &&
                    new Date(a.appointment_time || a.start_time).toDateString() === new Date().toDateString()
                    ? "Today" : formatDate(a.appointment_time || a.start_time),
                fullDate: a.appointment_time || a.start_time,
                status: (a.status || "pending").toLowerCase() as Appointment["status"],
                type: (a.type || "in-person").toLowerCase() === "online" ? "virtual" : "in-person",
                reason: a.reason || "General Consultation",
                duration: "30 min",
                priority: (a.priority || "medium").toLowerCase() as Appointment["priority"],
            })) : [];
            setAppts(list.sort((a, b) =>
                new Date(a.fullDate || 0).getTime() - new Date(b.fullDate || 0).getTime()
            ));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleAccept = async (id: number) => {
        try {
            await appointmentsApi.confirm(id, { note: "" });
            setAppts(prev => prev.map(a => a.id === id ? { ...a, status: "confirmed" as const } : a));
        } catch { alert("Failed to accept"); }
    };

    const submitCancel = async () => {
        if (!cancelId) return;
        setActionLoading(true);
        try {
            await appointmentsApi.cancel(cancelId, { note: actionNote });
            setAppts(prev => prev.map(a => a.id === cancelId ? { ...a, status: "cancelled" as const } : a));
            setCancelId(null); setActionNote("");
        } catch { alert("Failed to cancel"); }
        finally { setActionLoading(false); }
    };

    const submitReschedule = async () => {
        if (!rescheduleId || !newTime) return;
        setActionLoading(true);
        try {
            await appointmentsApi.reschedule(rescheduleId, { new_time: new Date(newTime).toISOString(), note: actionNote });
            await fetchAll();
            setRescheduleId(null); setActionNote(""); setNewTime("");
        } catch { alert("Failed to reschedule"); }
        finally { setActionLoading(false); }
    };

    const handleStart = (apt: Appointment) => {
        if (apt.type === "virtual") router.push(`/dashboard/meeting/${apt.id}`);
        else router.push(`/dashboard/Doctor/consultations/${apt.id}`);
    };

    const today = new Date().toDateString();
    const todayCount     = appts.filter(a => isValidDate(a.fullDate) && new Date(a.fullDate || "").toDateString() === today).length;
    const pendingCount   = appts.filter(a => a.status === "pending").length;
    const confirmedCount = appts.filter(a => a.status === "confirmed" || a.status === "checked-in").length;
    const completedCount = appts.filter(a => a.status === "completed").length;

    const filtered = appts.filter(a => {
        const matchF = filter === "All" || a.status === filter.toLowerCase();
        const matchS = !search ||
            a.patient.name.toLowerCase().includes(search.toLowerCase()) ||
            a.reason.toLowerCase().includes(search.toLowerCase());
        return matchF && matchS;
    });

    return (
        <div className="min-h-screen bg-[#F4F6FB]">

            {/* ── Sticky header ── */}
            <div className="sticky top-0 z-30 bg-[#F4F6FB]/95 backdrop-blur-lg px-4 pt-4 pb-3">

                {/* Title row */}
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h1 className="text-xl font-black text-gray-900">Appointments</h1>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                            {loading ? "Loading…" : `${appts.length} scheduled`}
                        </p>
                    </div>
                    <button
                        onClick={fetchAll}
                        className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 active:scale-95 transition"
                    >
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                </div>

                {/* Stat pills */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
                    {[
                        { label: `${todayCount} Today`,     color: "text-blue-600",    bg: "bg-blue-50" },
                        { label: `${pendingCount} Pending`,  color: "text-amber-600",   bg: "bg-amber-50" },
                        { label: `${confirmedCount} Active`, color: "text-emerald-600", bg: "bg-emerald-50" },
                        { label: `${completedCount} Done`,   color: "text-gray-600",    bg: "bg-white" },
                    ].map(({ label, color, bg }) => (
                        <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${bg} border border-gray-100 flex-shrink-0`}>
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
                        placeholder="Search patient or reason…"
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

            {/* ── List ── */}
            <div className="px-4 pb-32 pt-2 space-y-3">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-3xl border border-gray-100 p-4 animate-pulse">
                            <div className="flex gap-3 mb-3">
                                <div className="w-12 h-12 rounded-2xl bg-gray-200" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded-lg w-2/3" />
                                    <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
                                </div>
                            </div>
                            <div className="h-12 bg-gray-50 rounded-2xl mb-3" />
                            <div className="h-10 bg-gray-100 rounded-2xl" />
                        </div>
                    ))
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-20 gap-4 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                            <Calendar className="w-9 h-9 text-gray-300" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-700 mb-1">No appointments found</p>
                            <p className="text-sm text-gray-400">
                                {search ? `No results for "${search}"` : "No appointments match your filter"}
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
                    filtered.map(apt => (
                        <ApptCard
                            key={apt.id}
                            apt={apt}
                            onAccept={handleAccept}
                            onDecline={id => { setCancelId(id); setActionNote(""); }}
                            onReschedule={id => { setRescheduleId(id); setActionNote(""); setNewTime(""); }}
                            onStart={handleStart}
                            onSelect={setSelected}
                        />
                    ))
                )}
            </div>

            {/* ── Cancel sheet ── */}
            {cancelId !== null && (
                <BottomSheet title="Cancel Appointment" onClose={() => setCancelId(null)}>
                    <p className="text-sm text-gray-500 mb-4">Provide a reason for the patient.</p>
                    <textarea
                        className="w-full border border-gray-200 rounded-2xl p-3.5 text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none mb-4 min-h-[100px] resize-none"
                        placeholder="Reason for cancellation…"
                        value={actionNote}
                        onChange={e => setActionNote(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCancelId(null)}
                            className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm"
                        >Go Back</button>
                        <button
                            disabled={actionLoading}
                            onClick={submitCancel}
                            className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-bold text-sm shadow-md shadow-red-200 disabled:opacity-50"
                        >{actionLoading ? "Cancelling…" : "Confirm Cancel"}</button>
                    </div>
                </BottomSheet>
            )}

            {/* ── Reschedule sheet ── */}
            {rescheduleId !== null && (
                <BottomSheet title="Reschedule Appointment" onClose={() => setRescheduleId(null)}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">New Date & Time</label>
                            <input
                                type="datetime-local"
                                className="w-full border border-gray-200 rounded-2xl p-3.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                value={newTime}
                                onChange={e => setNewTime(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Note for Patient</label>
                            <textarea
                                className="w-full border border-gray-200 rounded-2xl p-3.5 text-sm focus:ring-2 focus:ring-blue-400 outline-none min-h-[80px] resize-none"
                                placeholder="e.g. Emergency surgery – rescheduled to tomorrow."
                                value={actionNote}
                                onChange={e => setActionNote(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setRescheduleId(null)} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm">
                                Close
                            </button>
                            <button
                                disabled={actionLoading || !newTime}
                                onClick={submitReschedule}
                                className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-200 disabled:opacity-50"
                            >{actionLoading ? "Updating…" : "Confirm Reschedule"}</button>
                        </div>
                    </div>
                </BottomSheet>
            )}

            {/* ── Appointment detail sheet ── */}
            {selected && (
                <BottomSheet title="Appointment Details" onClose={() => setSelected(null)}>
                    <div className="space-y-4">
                        {/* Patient card */}
                        <div className={`rounded-3xl p-4 bg-gradient-to-br ${avatarGrad(selected.patient.name)} text-white`}>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center font-black text-lg">
                                    {initials(selected.patient.name)}
                                </div>
                                <div>
                                    <p className="font-black text-base">{selected.patient.name}</p>
                                    {selected.patient.age ? <p className="text-white/80 text-xs mt-0.5">{selected.patient.age}y · {selected.patient.gender}</p> : null}
                                </div>
                            </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-2.5">
                            {[
                                { label: "Date", value: selected.date, icon: Calendar },
                                { label: "Time", value: selected.time, icon: Clock },
                                { label: "Type", value: selected.type === "virtual" ? "Video Call" : "In-Person", icon: selected.type === "virtual" ? Video : MapPin },
                                { label: "Priority", value: selected.priority, icon: AlertCircle },
                            ].map(({ label, value, icon: Icon }) => (
                                <div key={label} className="bg-gray-50 rounded-2xl p-3.5">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                                    <div className="flex items-center gap-1.5">
                                        <Icon className="w-3.5 h-3.5 text-blue-500" />
                                        <p className="text-sm font-bold text-gray-900 capitalize">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reason */}
                        <div className="bg-blue-50 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-1">Reason for Visit</p>
                            <p className="text-sm font-semibold text-blue-900">{selected.reason}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                            {(selected.status === "confirmed" || selected.status === "checked-in") && (
                                <button
                                    onClick={() => { handleStart(selected); setSelected(null); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-200 active:scale-95"
                                >
                                    <Play className="w-4 h-4" /> Start Consultation
                                </button>
                            )}
                            {selected.status === "pending" && (
                                <button
                                    onClick={() => { handleAccept(selected.id); setSelected(null); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm active:scale-95"
                                >
                                    <CheckCircle className="w-4 h-4" /> Accept
                                </button>
                            )}
                            <button
                                onClick={() => setSelected(null)}
                                className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center active:scale-95"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                    </div>
                </BottomSheet>
            )}
        </div>
    );
}