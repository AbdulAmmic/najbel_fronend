"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Search, Phone, MessageSquare, ChevronRight,
    Users, UserCheck, BedDouble, X,
    Stethoscope, SlidersHorizontal
} from "lucide-react";
import { patientService } from "@/services/api";

// ─── Helpers ──────────────────────────────────────────────

const initials = (p: any) => {
    const name = p.full_name || "P";
    return name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
};
const name = (p: any) => p.full_name || "Unknown";
const phone = (p: any) => p.phone_number || "—";
const bg = (n: string, admitted: boolean) => {
    if (admitted) return { from: "#ef4444", to: "#f97316" };
    const palette = [
        { from: "#6366f1", to: "#8b5cf6" },
        { from: "#0891b2", to: "#06b6d4" },
        { from: "#059669", to: "#10b981" },
        { from: "#d97706", to: "#f59e0b" },
        { from: "#be185d", to: "#db2777" },
        { from: "#7c3aed", to: "#a855f7" },
        { from: "#1d4ed8", to: "#3b82f6" },
    ];
    return palette[n.charCodeAt(0) % palette.length];
};

const bloodColors: Record<string, string> = {
    "A+": "bg-red-100 text-red-600",
    "A-": "bg-red-100 text-red-700",
    "B+": "bg-orange-100 text-orange-600",
    "B-": "bg-orange-100 text-orange-700",
    "AB+": "bg-purple-100 text-purple-600",
    "AB-": "bg-purple-100 text-purple-700",
    "O+": "bg-blue-100 text-blue-600",
    "O-": "bg-blue-100 text-blue-700",
};

// ─── Skeleton Card ─────────────────────────────────────────

const SkeletonCard = () => (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
        <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
                <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
            </div>
        </div>
    </div>
);

// ─── Patient Card ──────────────────────────────────────────

const PatientCard = ({ patient, onChat, onView }: {
    patient: any;
    onChat: (e: React.MouseEvent, id: number) => void;
    onView: (id: number) => void;
}) => {
    const n = name(patient);
    const colors = bg(n, patient.is_admitted);
    const blood = patient.blood_group || null;
    const bloodClass = blood ? bloodColors[blood] || "bg-gray-100 text-gray-600" : "";
    const isAdmitted = patient.is_admitted;

    return (
        <div
            onClick={() => onView(patient.id)}
            className="bg-white rounded-3xl border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform cursor-pointer shadow-sm shadow-gray-100/80 hover:shadow-md hover:shadow-gray-200/60 hover:border-gray-200"
        >
            {/* Admitted banner */}
            {isAdmitted && (
                <div className="h-0.5 w-full bg-gradient-to-r from-red-400 via-orange-400 to-red-400" />
            )}

            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
                    >
                        {initials(patient)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 text-[15px] leading-tight truncate">{n}</h3>
                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        </div>

                        {/* Badges row */}
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {patient.gender && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                                    {patient.gender}
                                </span>
                            )}
                            {blood && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bloodClass}`}>
                                    {blood}
                                </span>
                            )}
                            {isAdmitted ? (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                                    <BedDouble className="w-2.5 h-2.5" />
                                    Admitted · {patient.ward_name || "Ward"}
                                </span>
                            ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
                                    Outpatient
                                </span>
                            )}
                        </div>

                        {/* Phone */}
                        {phone(patient) !== "—" && (
                            <p className="text-xs text-gray-400 font-medium truncate leading-none">
                                📞 {phone(patient)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Admitted detail */}
                {isAdmitted && (patient.room_number || patient.bed_number) && (
                    <div className="mt-3 pt-3 border-t border-dashed border-red-100 grid grid-cols-3 gap-2">
                        {[
                            { label: "Ward", value: patient.ward_name || "—" },
                            { label: "Room", value: patient.room_number || "—" },
                            { label: "Bed", value: patient.bed_number || "—" },
                        ].map(({ label, value }) => (
                            <div key={label} className="text-center">
                                <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                                <p className="text-xs font-bold text-red-600">{value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Action strip */}
                <div className="mt-3 flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${phone(patient)}`);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-semibold transition-colors active:scale-95"
                    >
                        <Phone className="w-3.5 h-3.5" />
                        Call
                    </button>
                    <button
                        onClick={(e) => onChat(e, patient.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold transition-colors active:scale-95"
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Message
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onView(patient.id); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors active:scale-95"
                    >
                        <Stethoscope className="w-3.5 h-3.5" />
                        Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ─────────────────────────────────────────────

export default function MyPatientsPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "admitted" | "outpatient">("all");
    const [showFilter, setShowFilter] = useState(false);

    useEffect(() => {
        patientService.getAll()
            .then(data => setPatients(Array.isArray(data) ? data : []))
            .catch(() => setPatients([]))
            .finally(() => setLoading(false));
    }, []);

    const handleChat = (e: React.MouseEvent, patientId: number) => {
        e.stopPropagation();
        router.push(`/dashboard/Doctor/chat`);
    };

    const handleView = (patientId: number) => {
        router.push(`/dashboard/Doctor/patients/${patientId}`);
    };

    const filtered = patients.filter(p => {
        const n = (p.full_name || "").toLowerCase();
        const ph = (p.phone_number || "").toLowerCase();
        const matchSearch = !search || n.includes(search.toLowerCase()) || ph.includes(search.toLowerCase());
        const matchFilter =
            filter === "all" ||
            (filter === "admitted" && p.is_admitted) ||
            (filter === "outpatient" && !p.is_admitted);
        return matchSearch && matchFilter;
    });

    const admitted = patients.filter(p => p.is_admitted).length;
    const outpatient = patients.length - admitted;

    const FILTER_OPTIONS: { key: "all" | "admitted" | "outpatient"; label: string }[] = [
        { key: "all", label: "All" },
        { key: "admitted", label: "Admitted" },
        { key: "outpatient", label: "Outpatient" },
    ];

    return (
        <div className="min-h-screen bg-[#F4F6FB]">

            {/* ── Sticky compact header ── */}
            <div className="sticky top-0 z-30 bg-[#F4F6FB]/95 backdrop-blur-lg px-4 pt-4 pb-3">

                {/* Title row */}
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">Patients</h1>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                            {loading ? "Loading…" : `${patients.length} registered`}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowFilter(!showFilter)}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-sm ${showFilter ? "bg-blue-600 text-white shadow-blue-200" : "bg-white text-gray-500 shadow-gray-100"}`}
                    >
                        <SlidersHorizontal className="w-4.5 h-4.5" />
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search patients…"
                        className="w-full pl-10 pr-10 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Filter pills */}
                {showFilter && (
                    <div className="flex gap-2 mt-3">
                        {FILTER_OPTIONS.map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => setFilter(opt.key)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${filter === opt.key
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                    : "bg-white text-gray-500 border border-gray-200"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Summary pills */}
                <div className="flex gap-2 mt-3">
                    {[
                        { icon: Users, label: `${patients.length} Total`, color: "text-gray-700", bg: "bg-white" },
                        { icon: BedDouble, label: `${admitted} Admitted`, color: "text-red-600", bg: "bg-red-50" },
                        { icon: UserCheck, label: `${outpatient} Outpatient`, color: "text-emerald-600", bg: "bg-emerald-50" },
                    ].map(({ icon: Icon, label, color, bg }) => (
                        <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${bg} border border-gray-100 flex-shrink-0`}>
                            <Icon className={`w-3 h-3 ${color}`} />
                            <span className={`text-[11px] font-bold ${color}`}>{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="px-4 pb-28 space-y-3 pt-2">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-20 gap-4 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                            <Users className="w-9 h-9 text-gray-300" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-700 mb-1">No patients found</p>
                            <p className="text-sm text-gray-400">
                                {search ? `No results for "${search}"` : "No patients match your filter"}
                            </p>
                        </div>
                        {(search || filter !== "all") && (
                            <button
                                onClick={() => { setSearch(""); setFilter("all"); }}
                                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-2xl shadow-md shadow-blue-200 active:scale-95 transition-transform"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    filtered.map(patient => (
                        <PatientCard
                            key={patient.id}
                            patient={patient}
                            onChat={handleChat}
                            onView={handleView}
                        />
                    ))
                )}
            </div>
        </div>
    );
}