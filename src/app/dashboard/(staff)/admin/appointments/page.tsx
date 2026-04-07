"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Calendar, Search, Filter, ChevronDown, Clock,
    CheckCircle2, XCircle, AlertCircle, RefreshCw,
    User, Stethoscope, Phone, MoreHorizontal,
    TrendingUp, CalendarDays, Users, Loader2,
    ChevronLeft, ChevronRight as ChevRight, X,
    ArrowUpRight, ListFilter
} from "lucide-react";
import { appointments as appointmentsApi, auth } from "@/services/api";

// ─── Types ─────────────────────────────────────────────────
type Status = "confirmed" | "pending" | "cancelled" | "completed" | "rescheduled" | "checked-in" | "all";

interface Appointment {
    id: number;
    patient_id: number;
    patient_name?: string;
    doctor_id?: number;
    doctor_name?: string;
    appointment_time: string;
    status: string;
    reason?: string;
    notes?: string;
    meeting_link?: string;
}

// ─── Status config ─────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    confirmed:   { label: "Confirmed",   color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100",  icon: CheckCircle2 },
    "checked-in": { label: "Checked In", color: "text-blue-700",    bg: "bg-blue-50 border-blue-100",        icon: User },
    completed:   { label: "Completed",   color: "text-violet-700",  bg: "bg-violet-50 border-violet-100",    icon: CheckCircle2 },
    pending:     { label: "Pending",     color: "text-amber-700",   bg: "bg-amber-50 border-amber-100",      icon: Clock },
    rescheduled: { label: "Rescheduled", color: "text-indigo-700",  bg: "bg-indigo-50 border-indigo-100",    icon: RefreshCw },
    cancelled:   { label: "Cancelled",   color: "text-rose-700",    bg: "bg-rose-50 border-rose-100",        icon: XCircle },
};

const getStatusCfg = (status: string) =>
    STATUS_CONFIG[status?.toLowerCase()] || { label: status, color: "text-gray-600", bg: "bg-gray-50 border-gray-100", icon: AlertCircle };

// ─── Formatters ────────────────────────────────────────────
const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const fmtDateTime = (iso: string) => `${fmtDate(iso)} · ${fmtTime(iso)}`;
const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

// ─── Status Pill ───────────────────────────────────────────
const StatusPill = ({ status }: { status: string }) => {
    const cfg = getStatusCfg(status);
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-lg border ${cfg.bg} ${cfg.color}`}>
            <Icon className="w-2.5 h-2.5" /> {cfg.label}
        </span>
    );
};

// ─── Main ──────────────────────────────────────────────────
export default function AdminAppointmentsPage() {
    const [all, setAll] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<Status>("all");
    const [doctorFilter, setDoctorFilter] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState<"all" | "today" | "week">("all");
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const PER_PAGE = 12;

    useEffect(() => {
        appointmentsApi.getAdminAll()
            .then((data: any) => setAll(Array.isArray(data) ? data : []))
            .catch(() => setAll([]))
            .finally(() => setLoading(false));
    }, []);

    // Unique doctor names for filter
    const doctors = useMemo(() => {
        const names = new Set(all.map(a => a.doctor_name).filter(Boolean));
        return Array.from(names) as string[];
    }, [all]);

    // Filtered + searched list (only accepted/confirmed and above)
    const filtered = useMemo(() => {
        const ACCEPTED_STATUSES = ["confirmed", "checked-in", "completed", "rescheduled", "pending", "cancelled"];
        return all
            .filter(a => ACCEPTED_STATUSES.includes(a.status?.toLowerCase()))
            .filter(a => {
                if (statusFilter !== "all" && a.status?.toLowerCase() !== statusFilter) return false;
                if (doctorFilter !== "all" && a.doctor_name !== doctorFilter) return false;
                if (dateFilter === "today" && !isToday(a.appointment_time)) return false;
                if (dateFilter === "week") {
                    const d = new Date(a.appointment_time);
                    const now = new Date();
                    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
                    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
                    if (d < weekStart || d > weekEnd) return false;
                }
                if (search) {
                    const q = search.toLowerCase();
                    return (
                        a.patient_name?.toLowerCase().includes(q) ||
                        a.doctor_name?.toLowerCase().includes(q) ||
                        a.reason?.toLowerCase().includes(q) ||
                        String(a.id).includes(q)
                    );
                }
                return true;
            })
            .sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime());
    }, [all, statusFilter, doctorFilter, dateFilter, search]);

    // Pagination
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    // Stats
    const stats = useMemo(() => ({
        total: all.length,
        confirmed: all.filter(a => a.status === "confirmed").length,
        today: all.filter(a => isToday(a.appointment_time)).length,
        pending: all.filter(a => a.status === "pending").length,
        completed: all.filter(a => a.status === "completed").length,
    }), [all]);

    const activeFiltersCount = [
        statusFilter !== "all",
        doctorFilter !== "all",
        dateFilter !== "all",
    ].filter(Boolean).length;

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading appointments...</p>
            </div>
        </div>
    );

    return (
        <div className="px-3 sm:px-6 pb-8 space-y-5 max-w-7xl mx-auto">

            {/* ── Page Header ─────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Appointments</h1>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">All doctor-handled bookings across the clinic</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-gray-400">
                        {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                    </span>
                    <button
                        onClick={() => { setLoading(true); appointmentsApi.getAdminAll().then((d: any) => setAll(Array.isArray(d) ? d : [])).finally(() => setLoading(false)); }}
                        className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* ── Stats Row ─────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total", value: stats.total, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Today", value: stats.today, icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { label: "Confirmed", value: stats.confirmed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Pending", value: stats.pending, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-4.5 h-4.5 ${color}`} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Search + Filters ─────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 space-y-3">
                <div className="flex gap-2">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search patient, doctor, reason..."
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-100 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                        )}
                    </div>
                    {/* Filter toggle */}
                    <button
                        onClick={() => setShowFilters(f => !f)}
                        className={`relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-bold transition-all ${showFilters ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"}`}
                    >
                        <ListFilter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filters</span>
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filter panels */}
                {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-gray-50">
                        {/* Status filter */}
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Status</p>
                            <div className="flex flex-wrap gap-1.5">
                                {(["all", "confirmed", "checked-in", "pending", "completed", "rescheduled", "cancelled"] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => { setStatusFilter(s); setPage(1); }}
                                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border transition-all ${statusFilter === s
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                                        }`}
                                    >
                                        {s === "all" ? "All" : getStatusCfg(s).label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date filter */}
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Date Range</p>
                            <div className="flex gap-1.5">
                                {(["all", "today", "week"] as const).map(d => (
                                    <button
                                        key={d}
                                        onClick={() => { setDateFilter(d); setPage(1); }}
                                        className={`flex-1 text-[10px] font-black uppercase px-2 py-1.5 rounded-lg border transition-all ${dateFilter === d
                                            ? "bg-indigo-600 text-white border-indigo-600"
                                            : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                                        }`}
                                    >
                                        {d === "all" ? "All Time" : d === "today" ? "Today" : "This Week"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Doctor filter */}
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Doctor</p>
                            <select
                                value={doctorFilter}
                                onChange={e => { setDoctorFilter(e.target.value); setPage(1); }}
                                className="w-full text-xs font-semibold border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                            >
                                <option value="all">All Doctors</option>
                                {doctors.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {/* Active filter chips */}
                {activeFiltersCount > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-gray-400 font-bold">Active:</span>
                        {statusFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-lg">
                                {getStatusCfg(statusFilter).label}
                                <button onClick={() => setStatusFilter("all")}><X className="w-2.5 h-2.5" /></button>
                            </span>
                        )}
                        {doctorFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-lg">
                                {doctorFilter}
                                <button onClick={() => setDoctorFilter("all")}><X className="w-2.5 h-2.5" /></button>
                            </span>
                        )}
                        {dateFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-lg">
                                {dateFilter === "today" ? "Today" : "This Week"}
                                <button onClick={() => setDateFilter("all")}><X className="w-2.5 h-2.5" /></button>
                            </span>
                        )}
                        <button onClick={() => { setStatusFilter("all"); setDoctorFilter("all"); setDateFilter("all"); }} className="text-[10px] font-bold text-rose-500 hover:text-rose-700 ml-1">
                            Clear all
                        </button>
                    </div>
                )}
            </div>

            {/* ── Appointment Cards ─────────────────────────── */}
            {paginated.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <CalendarDays className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-semibold text-sm">No appointments found</p>
                    <p className="text-xs mt-1">Try adjusting your filters</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Desktop table header */}
                    <div className="hidden lg:grid grid-cols-[80px_1fr_1fr_160px_120px_40px] gap-4 px-4 py-2">
                        {["ID", "Patient", "Doctor", "Date & Time", "Status", ""].map(h => (
                            <p key={h} className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{h}</p>
                        ))}
                    </div>

                    {paginated.map(appt => {
                        const cfg = getStatusCfg(appt.status);
                        const today = isToday(appt.appointment_time);
                        const isOpen = expandedId === appt.id;

                        return (
                            <div
                                key={appt.id}
                                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                                    today ? "border-blue-100 ring-1 ring-blue-50" : "border-gray-100"
                                }`}
                            >
                                {/* Today badge */}
                                {today && (
                                    <div className="px-4 py-1.5 bg-blue-600 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Today</span>
                                    </div>
                                )}

                                {/* Main row — desktop grid / mobile stack */}
                                <div
                                    className="grid grid-cols-1 lg:grid-cols-[80px_1fr_1fr_160px_120px_40px] gap-3 lg:gap-4 px-4 py-3.5 cursor-pointer"
                                    onClick={() => setExpandedId(isOpen ? null : appt.id)}
                                >
                                    {/* ID */}
                                    <div className="flex items-center">
                                        <span className="text-xs font-black text-gray-400">#{String(appt.id).padStart(4, "0")}</span>
                                    </div>

                                    {/* Patient */}
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                                            {(appt.patient_name || "P")[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-bold text-gray-900 truncate">{appt.patient_name || `Patient #${appt.patient_id}`}</p>
                                            <p className="text-[10px] text-gray-400 lg:hidden">{fmtDateTime(appt.appointment_time)}</p>
                                        </div>
                                    </div>

                                    {/* Doctor */}
                                    <div className="hidden lg:flex items-center gap-2">
                                        <Stethoscope className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                                        <span className="text-xs font-semibold text-gray-600 truncate">
                                            {appt.doctor_name ? `Dr. ${appt.doctor_name}` : `—`}
                                        </span>
                                    </div>

                                    {/* Date & Time */}
                                    <div className="hidden lg:flex flex-col justify-center">
                                        <p className="text-xs font-bold text-gray-700">{fmtDate(appt.appointment_time)}</p>
                                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                            <Clock className="w-2.5 h-2.5" /> {fmtTime(appt.appointment_time)}
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center">
                                        <StatusPill status={appt.status} />
                                    </div>

                                    {/* Expand chevron */}
                                    <div className="hidden lg:flex items-center justify-center">
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                    </div>
                                </div>

                                {/* Expanded detail */}
                                {isOpen && (
                                    <div className="border-t border-gray-50 px-4 py-3 bg-gray-50/50 space-y-3">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                            {appt.doctor_name && (
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Doctor</p>
                                                    <p className="text-xs font-semibold text-gray-700">Dr. {appt.doctor_name}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Date & Time</p>
                                                <p className="text-xs font-semibold text-gray-700">{fmtDateTime(appt.appointment_time)}</p>
                                            </div>
                                            {appt.reason && (
                                                <div className="col-span-2">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Reason</p>
                                                    <p className="text-xs text-gray-600 leading-relaxed">{appt.reason}</p>
                                                </div>
                                            )}
                                            {appt.notes && (
                                                <div className="col-span-2">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Notes</p>
                                                    <p className="text-xs text-gray-500 leading-relaxed">{appt.notes}</p>
                                                </div>
                                            )}
                                            {appt.meeting_link && (
                                                <div className="col-span-2">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Meeting Link</p>
                                                    <a href={appt.meeting_link} target="_blank" rel="noopener noreferrer"
                                                        className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">
                                                        📹 Join Meeting <ArrowUpRight className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Pagination ────────────────────────────────── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-gray-400 font-semibold">
                        Page {page} of {totalPages} · {filtered.length} total
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm disabled:opacity-40 hover:bg-gray-50 transition-all active:scale-95"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-9 h-9 rounded-xl text-xs font-black transition-all active:scale-95 ${p === page
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                        : "bg-white border border-gray-100 text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm disabled:opacity-40 hover:bg-gray-50 transition-all active:scale-95"
                        >
                            <ChevRight className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
