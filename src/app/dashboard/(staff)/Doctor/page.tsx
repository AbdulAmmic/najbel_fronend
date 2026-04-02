"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Users, Calendar, Clock, FlaskConical, Pill, Activity,
    Heart, Thermometer, Droplets, Wind, ChevronRight,
    ArrowUpRight, Play, CheckCircle2, Video, Bed,
    Stethoscope, FileText, TrendingUp, AlertCircle,
    LayoutDashboard, Search, Printer
} from "lucide-react";
import {
    auth, appointments, labs, prescriptions, vitals,
    patientService, medicalRecords, beds
} from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

// ─── helpers ──────────────────────────────────────────────────
const fmt   = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const fmtT  = (d: string) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const init  = (n: string) => n?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

const handlePrint = (item: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Robust result data parsing
    let results = [];
    try {
        if (item.result_data && item.result_data.startsWith('[')) {
            results = JSON.parse(item.result_data);
        }
    } catch (e) { console.error("Parse error", e); }

    const patientName = item.patient?.user?.full_name || item.patient?.full_name || 'Generic Patient';
    const patientPhone = item.patient?.user?.phone || item.patient?.phone || 'N/A';
    const doctorName = item.doctor?.user?.full_name || 'N/A';
    const docDate = item.validated_at || item.recorded_at;
    const requestDate = docDate ? new Date(docDate).toLocaleString('en-GB', { 
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    }) : 'N/A';

    // Fix "See details" label if table exists
    const mainResult = (item.result === "See details" && results.length > 0) 
        ? "Detailed Clinical Findings (See Table)" 
        : (item.result || 'Pending');

    const resultHtml = results.length > 0 ? `
        <div style="margin-top: 25px;">
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 800; margin-bottom: 8px;">Detailed Result Parameters</div>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background-color: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
                        <th style="padding: 12px 15px; text-align: left; font-size: 10px; color: #475569; text-transform: uppercase; font-weight: 800;">Parameter</th>
                        <th style="padding: 12px 15px; text-align: center; font-size: 10px; color: #475569; text-transform: uppercase; font-weight: 800;">Value</th>
                        <th style="padding: 12px 15px; text-align: center; font-size: 10px; color: #475569; text-transform: uppercase; font-weight: 800;">Unit</th>
                        <th style="padding: 12px 15px; text-align: right; font-size: 10px; color: #475569; text-transform: uppercase; font-weight: 800;">Normal Range</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map((r: any) => `
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 10px 15px; font-weight: 700; color: #1e293b; font-size: 12px;">${r.parameter}</td>
                            <td style="padding: 10px 15px; text-align: center; color: #2563eb; font-weight: 900; font-size: 14px;">${r.result}</td>
                            <td style="padding: 10px 15px; text-align: center; color: #64748b; font-size: 11px; font-weight: 600;">${r.unit || '-'}</td>
                            <td style="padding: 10px 15px; text-align: right; color: #475569; font-weight: 600; font-size: 11px;">${r.reference || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    ` : `
        <div style="padding: 40px; text-align: center; color: #64748b; border: 2px dashed #e2e8f0; border-radius: 16px; margin-top: 25px; background: #f8fafc;">
            <div style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #94a3b8; letter-spacing: 1px;">Summary Result</div>
            <div style="font-size: 24px; font-weight: 900; color: #1e293b; margin-top: 8px;">${mainResult}</div>
        </div>
    `;

    printWindow.document.write(`
        <html>
            <head>
                <title>Investigation Report - ${item.short_id}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Inter', -apple-system, sans-serif; padding: 50px; color: #1e293b; line-height: 1.5; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #2563eb; padding-bottom: 25px; margin-bottom: 30px; }
                    .clinic-name { font-size: 28px; font-weight: 900; color: #2563eb; letter-spacing: -0.5px; }
                    .report-title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-top: 4px; }
                    .patient-card { display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px; margin-bottom: 35px; background: #f8fafc; padding: 25px; border-radius: 16px; border: 1px solid #f1f5f9; }
                    .label { font-size: 9px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; }
                    .value { font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 4px; }
                    .conclusion-badge { background: #eff6ff; border-left: 4px solid #2563eb; padding: 15px 20px; border-radius: 0 12px 12px 0; margin-bottom: 30px; }
                    .footer { margin-top: 80px; padding-top: 25px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; font-weight: 600; }
                    @media print { body { padding: 20px; } .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="clinic-name">NAJBEL CLINIC</div>
                        <div class="report-title">Laboratory Investigation Report</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="label">Specimen ID</div>
                        <div class="value" style="color: #2563eb; font-size: 24px; font-weight: 900;">#${item.short_id}</div>
                    </div>
                </div>

                <div class="patient-card">
                    <div>
                        <div class="label">Patient Name</div>
                        <div class="value" style="font-size: 18px;">${patientName}</div>
                        <div style="margin-top: 15px; display: flex; gap: 20px;">
                            <div>
                                <div class="label">Patient ID</div>
                                <div class="value">PID-${item.patient?.id || 'N/A'}</div>
                            </div>
                            <div>
                                <div class="label">Requesting Physician</div>
                                <div class="value" style="color: #2563eb;">${doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`}</div>
                            </div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div class="label">Investigation</div>
                        <div class="value" style="font-size: 18px;">${item.test_name}</div>
                        <div style="margin-top: 15px;">
                            <div class="label">Report Generated</div>
                            <div class="value">${requestDate}</div>
                        </div>
                    </div>
                </div>

                <div class="conclusion-badge">
                    <div class="label">General Clinical Conclusion</div>
                    <div class="value" style="font-size: 20px; color: #1e40af;">${mainResult}</div>
                </div>

                ${resultHtml}

                <div style="margin-top: 45px; background: #fff; border: 1px solid #f1f5f9; padding: 20px; border-radius: 12px;">
                    <div class="label">Clinical Notes & Interpretation</div>
                    <div class="value" style="font-weight: 500; color: #334155; font-style: italic; margin-top: 8px;">
                        "${item.notes || 'The clinical findings for this investigation are within expected qualitative parameters for the requested panel.'}"
                    </div>
                </div>

                <div style="margin-top: 100px; display: flex; justify-content: flex-end; gap: 80px;">
                    <div style="text-align: center; min-width: 180px;">
                        <div style="border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; font-weight: 800; color: #1e293b; font-size: 13px;">
                            ${item.validator?.full_name || 'Authorized Signatory'}
                        </div>
                        <div class="label" style="margin-top: 8px;">Laboratory Scientist</div>
                    </div>
                    <div style="text-align: center; min-width: 180px;">
                        <div style="border-bottom: 2px solid #cbd5e1; height: 26px; margin-bottom: 8px;"></div>
                        <div class="label" style="margin-top: 8px;">Pathologist Signature</div>
                    </div>
                </div>

                <div class="footer">
                    <div>Najbel Clinic Clinical Diagnostics Center </div>
                    <div>Official Medical Record · Page 1 of 1</div>
                </div>
                <script>
                    window.onload = () => {
                        window.print();
                    };
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
};

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
    const [expandedLab, setExpandedLab]   = useState<number | null>(null);

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
    const readyLabs     = labResults.filter(l => l.status === "validated");
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

            {/* ══ MODERN COMMAND CENTER HEADER ══════════════════════════════════════════════ */}
            <div className="bg-white/80 backdrop-blur-2xl border-b border-white">
                <div className="max-w-6xl mx-auto px-6 pt-10 pb-0">

                    {/* Welcome Row */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
                        <div className="flex items-center gap-4 sm:gap-6">
                            <div className="relative group shrink-0">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[1.5rem] sm:rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000" />
                                <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-[1.5rem] sm:rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center text-blue-600 text-2xl sm:text-3xl font-black shadow-xl shrink-0 uppercase">
                                    {user?.full_name?.charAt(0) || "D"}
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-4 border-white shadow-lg" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none truncate">
                                        Dr. {user?.full_name?.split(" ")[1] || "Physician"}
                                    </h1>
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest border border-blue-100/50">Consultant</span>
                                </div>
                                <p className="text-slate-400 font-bold text-[10px] sm:text-xs tracking-widest mt-2 uppercase flex items-center gap-2">
                                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-50" />
                                    <span className="truncate">{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                    {todayAppts.length} Today
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto">
                            <Link href="/dashboard/Doctor/appointments"
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 sm:px-8 py-3 sm:py-4 rounded-[16px] sm:rounded-[20px] text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Schedule
                            </Link>
                            <Link href="/dashboard/Doctor/patients"
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-4 sm:px-8 py-3 sm:py-4 rounded-[16px] sm:rounded-[20px] text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95">
                                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Patients
                            </Link>
                        </div>
                    </div>

                    {/* KPI row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: "Active Patients",   v: patients.length,    icon: Users,       grad: "from-blue-600 to-indigo-700" },
                            { label: "Waitlist Queue", v: waiting.length,     icon: Clock,       grad: "from-violet-600 to-purple-800" },
                            { label: "Investigations", v: pendingLabs.length, icon: FlaskConical, grad: "from-amber-500 to-orange-700" },
                            { label: "Ward Occupancy", v: `${occupiedBeds}/${bedsList.length}`,  icon: Bed,         grad: "from-emerald-600 to-teal-800" },
                        ].map((k, i) => (
                            <div key={i} className="bg-white p-4 sm:p-5 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                                <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br ${k.grad} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                    <k.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-lg sm:text-xl font-black text-slate-900 leading-none">{k.v}</div>
                                    <div className="text-[8px] sm:text-[9px] font-extrabold text-slate-400 uppercase mt-1 sm:mt-1.5 tracking-widest truncate">{k.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Section Navigation */}
                    <div className="flex gap-1 p-1 bg-slate-50 rounded-[28px] w-full overflow-x-auto no-scrollbar border border-slate-100 mb-[-1px]">
                        {SECTIONS.map(s => (
                            <button 
                                key={s.id} 
                                onClick={() => setSection(s.id)}
                                className={`relative flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-[24px] text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                                    section === s.id ? "text-blue-600 bg-white shadow-md border border-slate-100" : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                <s.icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${section === s.id ? "text-blue-600" : "opacity-30"}`} />
                                {s.label}
                                {s.badge !== undefined && s.badge > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-lg text-[7px] sm:text-[8px] font-black ${section === s.id ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>
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

                                {/* Ready Investigations mini */}
                                {readyLabs.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-violet-100 shadow-sm p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-gray-900 text-sm">Ready Results</h3>
                                            <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                                        </div>
                                        <div className="bg-violet-50 rounded-xl p-3 flex items-center justify-between">
                                            <div>
                                                <p className="text-xl font-black text-violet-600">{readyLabs.length}</p>
                                                <p className="text-[9px] font-bold text-violet-400 uppercase">Validated</p>
                                            </div>
                                            <button 
                                                onClick={() => setSection("labs")}
                                                className="w-8 h-8 bg-white text-violet-600 rounded-lg flex items-center justify-center shadow-sm hover:translate-x-1 transition-transform"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

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

                        {/* Ready for Review alert */}
                        {readyLabs.length > 0 && (
                            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                                <CheckCircle2 className="w-5 h-5 text-violet-600 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-violet-900">{readyLabs.length} investigations ready for clinical review</p>
                                    <p className="text-xs text-violet-700 mt-0.5">Click to view detailed findings and print reports</p>
                                </div>
                                <div className="h-8 px-3 bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center">Ready</div>
                            </div>
                        )}

                        {/* Pending alert */}
                        {pendingLabs.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-amber-900">{pendingLabs.length} lab results still in progress</p>
                                    <p className="text-xs text-amber-700 mt-0.5">Tests being processed by the laboratory</p>
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
                                            <div key={l.id} className="border-b border-gray-50 last:border-0">
                                                <div 
                                                    onClick={() => setExpandedLab(expandedLab === l.id ? null : l.id)}
                                                    className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/60 cursor-pointer transition-colors group"
                                                >
                                                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors relative">
                                                        <FlaskConical className="w-4 h-4 text-amber-600" />
                                                        {l.status === 'validated' && <div className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full border-2 border-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">{l.test_name || "Lab Test"}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <p className="text-[10px] text-gray-500 truncate">{name}</p>
                                                            {l.result && !expandedLab && <p className="text-[10px] text-gray-400 truncate max-w-[140px]">Result: {l.result}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <div className="hidden sm:block text-[10px] font-bold text-gray-400 w-24">
                                                            {l.validated_at ? new Date(l.validated_at).toLocaleDateString() : 
                                                             l.recorded_at ? new Date(l.recorded_at).toLocaleDateString() : "—"}
                                                        </div>
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_COLOR[l.status] || "bg-gray-100 text-gray-500"}`}>
                                                            {l.status}
                                                        </span>
                                                        <span className={`text-[10px] text-gray-400 transition-transform duration-300 ${expandedLab === l.id ? 'rotate-90 text-blue-500' : ''}`}>
                                                            <ChevronRight className="w-4 h-4" />
                                                        </span>
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {expandedLab === l.id && (l.result_data || l.result) && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="px-5 pb-5"
                                                        >
                                                            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mt-1">
                                                                {l.result_data ? (
                                                                    <table className="w-full text-left text-[11px]">
                                                                        <thead className="bg-slate-50 border-b border-slate-100">
                                                                            <tr>
                                                                                <th className="px-3 py-2 font-black text-slate-400 uppercase">Parameter</th>
                                                                                <th className="px-3 py-2 font-black text-slate-400 uppercase text-center">Result</th>
                                                                                <th className="px-3 py-2 font-black text-slate-400 uppercase text-center">Unit</th>
                                                                                <th className="px-3 py-2 font-black text-slate-400 uppercase text-right">Range</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-50">
                                                                            {(l.result_data && l.result_data.startsWith('[') ? JSON.parse(l.result_data) : []).map((r: any, idx: number) => (
                                                                                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                                                                    <td className="px-3 py-2 font-bold text-slate-700">{r.parameter}</td>
                                                                                    <td className="px-3 py-2 font-black text-blue-600 text-center">{r.result}</td>
                                                                                    <td className="px-3 py-2 text-center text-slate-500">{r.unit || '-'}</td>
                                                                                    <td className="px-3 py-2 text-right text-slate-400 font-medium">{r.reference || '-'}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                ) : (
                                                                    <div className="p-4 bg-blue-50/30">
                                                                        <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Single Result</p>
                                                                        <p className="text-sm font-bold text-blue-900">{l.result}</p>
                                                                    </div>
                                                                )}
                                                                {l.notes && (
                                                                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Lab Interpretation</p>
                                                                        <p className="text-[10px] text-slate-600 italic">"{l.notes}"</p>
                                                                    </div>
                                                                )}
                                                                <div className="p-3 border-t border-slate-50 bg-slate-50/20 flex justify-between items-center">
                                                                    <div className="flex items-center gap-4">
                                                                        <Link 
                                                                            href={`/dashboard/Doctor/patients/${l.patient_id}`}
                                                                            className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest"
                                                                        >
                                                                            Full Patient Profile →
                                                                        </Link>
                                                                        {l.status === 'validated' && (
                                                                            <button
                                                                                onClick={() => handlePrint(l)}
                                                                                className="flex items-center gap-1.5 text-[10px] font-black text-violet-600 hover:text-violet-700 uppercase tracking-widest"
                                                                            >
                                                                                <Printer className="w-3.5 h-3.5" />
                                                                                Print Report
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    {l.validator && (
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Validated by {l.validator.full_name}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
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
