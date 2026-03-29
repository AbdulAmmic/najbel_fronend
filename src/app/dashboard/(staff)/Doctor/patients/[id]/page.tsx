"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ArrowLeft, Phone, Mail, Calendar, MapPin, 
    Clock, Activity, Heart, Thermometer, Droplets, 
    Wind, Plus, FlaskConical, Pill, FileText, 
    ChevronRight, ChevronDown, ChevronUp, Check, 
    X, UserCheck, AlertCircle, MessageSquare, 
    TrendingUp, Search, MoreHorizontal, FileSearch,
    Download, Share2, Printer, ClipboardList, Send, User2, Badge, CheckCircle2, Stethoscope, Bed, Package
} from "lucide-react";
import {
    patientService, prescriptions, consultations, referrals,
    beds, users, auth, labs, labCatalog, pharmacy
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
    const [catalog, setCatalog]     = useState<any[]>([]);
    const [expandedRx, setExpandedRx] = useState<number | null>(null);
    const [expandedLab, setExpandedLab]   = useState<number | null>(null);
    const [inventory, setInventory] = useState<any[]>([]);
    const [searchingDrug, setSearchingDrug] = useState("");

    useEffect(() => {
        if (labList.length > 0 && !expandedLab) {
            // Auto-expand the most recent validated result if any
            const mostRecent = labList.find((l: any) => l.status === 'validated' || l.status === 'completed');
            if (mostRecent) setExpandedLab(mostRecent.id);
        }
    }, [labList]);

    const handlePrint = (item: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const patientName = item.patient?.user?.full_name || item.patient?.full_name || patient?.user?.full_name || patient?.full_name || 'N/A';
        const patientPhone = item.patient?.user?.phone_number || item.patient?.phone_number || patient?.user?.phone_number || patient?.phone_number || 'N/A';

        const results = item.result_data && item.result_data.startsWith('[') ? JSON.parse(item.result_data) : [];
        const resultHtml = results.length > 0 ? `
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 2px solid #edf2f7;">
                        <th style="padding: 10px; text-align: left; font-size: 10px; color: #718096; text-transform: uppercase; font-weight: 800;">PARAMETER</th>
                        <th style="padding: 10px; text-align: center; font-size: 10px; color: #718096; text-transform: uppercase; font-weight: 800;">RESULT</th>
                        <th style="padding: 10px; text-align: center; font-size: 10px; color: #718096; text-transform: uppercase; font-weight: 800;">UNIT</th>
                        <th style="padding: 10px; text-align: right; font-size: 10px; color: #718096; text-transform: uppercase; font-weight: 800;">REF. RANGE</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map((r: any) => `
                        <tr style="border-bottom: 1px solid #f7fafc;">
                            <td style="padding: 10px; font-weight: 700; color: #2d3748; font-size: 12px;">${r.parameter}</td>
                            <td style="padding: 10px; text-align: center; color: #3182ce; font-weight: 800; font-size: 13px;">${r.result}</td>
                            <td style="padding: 10px; text-align: center; color: #a0aec0; font-size: 11px;">${r.unit || '-'}</td>
                            <td style="padding: 10px; text-align: right; color: #718096; font-weight: 600; font-size: 11px;">${r.reference || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : `<div style="padding: 30px; text-align: center; color: #718096; border: 1px dashed #e2e8f0; border-radius: 12px; margin-top: 15px;">
                <div style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #a0aec0;">Clinical Result</div>
                <div style="font-size: 20px; font-weight: 800; color: #2d3748; margin-top: 5px;">${item.result || 'Pending'}</div>
             </div>`;

        printWindow.document.write(`
            <html>
                <head>
                    <title>NAJBEL - Lab Report #${item.short_id}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 20px; color: #2d3748; line-height: 1.4; }
                        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #f1f5f9; padding-bottom: 20px; align-items: flex-end; }
                        .clinic-name { font-size: 24px; font-weight: 900; color: #1e293b; letter-spacing: -1px; }
                        .report-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-top: 4px; }
                        .patient-box { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9; }
                        .label { font-size: 8px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; }
                        .value { font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 2px; }
                        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
                        .stamp { border: 1.5px solid #e2e8f0; color: #94a3b8; padding: 6px 12px; display: inline-block; font-weight: 800; text-transform: uppercase; font-size: 9px; border-radius: 6px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <div class="clinic-name">NAJBEL CLINIC</div>
                            <div class="report-title">Formal Laboratory Report</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="label">LAB REFERENCE</div>
                            <div class="value" style="color: #2563eb; font-size: 24px; font-weight: 900;">#${item.short_id}</div>
                        </div>
                    </div>

                    <div class="patient-box">
                        <div>
                            <div class="label">Beneficiary Name</div>
                            <div class="value">${patientName}</div>
                            <div style="margin-top: 12px;">
                                <div class="label">Patient ID & Contact</div>
                                <div class="value">PID-${patient?.id} | ${patientPhone}</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div class="label">Investigation Conducted</div>
                            <div class="value">${item.test_name}</div>
                            <div style="margin-top: 12px;">
                                <div class="label">Issued Date</div>
                                <div class="value">${new Date().toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <div class="label">General Clinical Conclusion</div>
                        <div class="value" style="font-size: 18px; color: #2563eb;">${item.result || 'Pending Interpretation'}</div>
                    </div>

                    ${resultHtml}

                    <div style="margin-top: 40px; background: #fff; border-left: 4px solid #2563eb; padding: 20px; background: #f0f7ff; border-radius: 0 16px 16px 0;">
                        <div class="label" style="color: #2563eb;">Technician Findings & Interpretation</div>
                        <div style="font-size: 14px; font-weight: 600; color: #1e40af; margin-top: 8px; font-style: italic;">
                            "${item.notes || 'Routine diagnostic verification performed. No significant deviations from expected baseline observed.'}"
                        </div>
                    </div>

                    <div class="footer">
                        <div>
                            <div class="label">Primary Investigator</div>
                            <div class="value">${item.validator?.full_name || 'Chief Pathologist'}</div>
                            <div class="label" style="margin-top: 4px;">Laboratory Services Dept.</div>
                        </div>
                        <div class="stamp">
                            Electronically Verified<br>
                            Najbel Clinic Lab
                        </div>
                    </div>
                </body>
                <script>window.print();</script>
            </html>
        `);
        printWindow.document.close();
    };
    const [commentingLabId, setCommentingLabId] = useState<number | null>(null);
    const [doctorComment, setDoctorComment] = useState("");

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = async () => {
        try {
            const [pat, meData, bedsData, usersData, rxData, labData, refData, catData, pharmacyData] = await Promise.all([
                patientService.getById(Number(id)),
                auth.getMe(),
                beds.getAll().catch(() => []),
                users.getAll().catch(() => []),
                prescriptions.getAll().catch(() => []),
                labs.getAll().catch(() => []),
                referrals.getAll().catch(() => []),
                labCatalog.getAll().catch(() => []),
                pharmacy.getInventory().catch(() => []),
            ]);
            const labsResponse = Array.isArray(labData) ? labData : [];
            const sortedLabs = [...labsResponse]
                .filter((l: any) => l.patient_id === pat?.id)
                .sort((a: any, b: any) => {
                    const statusOrder: Record<string, number> = { 'completed': 1, 'validated': 2, 'processing': 3, 'sample_collected': 4, 'requested': 5 };
                    const orderA = statusOrder[a.status] || 99;
                    const orderB = statusOrder[b.status] || 99;
                    if (orderA !== orderB) return orderA - orderB;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });

            setPatient(pat);
            setMe(meData);
            setAvailBeds((Array.isArray(bedsData) ? bedsData : []).filter((b: any) => b.status === "available"));
            setOtherDocs((Array.isArray(usersData) ? usersData : []).filter((u: any) => u.role === "doctor" && u.id !== meData?.id));
            setRxList((Array.isArray(rxData) ? rxData : []).filter((r: any) => r.patient_id === pat?.id));
            setLabList(sortedLabs);
            setRefList((Array.isArray(refData) ? refData : []).filter((r: any) => r.patient_id === pat?.id));
            setCatalog(Array.isArray(catData) ? catData : []);
            setInventory(Array.isArray(pharmacyData) ? pharmacyData : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const sf = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

    const handleSubmit = async () => {
        setSaving(true);
        try {
            if (activeModal === "prescribe") {
                const items = form.items || [];
                if (items.length === 0) return showToast("Add at least one medicine.", false);
                await prescriptions.create({ 
                    patient_id: patient.id, 
                    doctor_id: me?.id, 
                    items: items,
                    instructions: form.instructions || "" 
                });
                showToast("Prescription items sent to billing/pharmacy!");
            } else if (activeModal === "lab") {
                if (form.test_names.length === 0 && !form.test_name) return showToast("Please select or enter at least one test.", false);

                const testsToRequest = form.test_names.length > 0
                    ? form.test_names.map((testName: string) => ({
                        patient_id: patient.id,
                        doctor_id: me?.id,
                        test_name: testName,
                        urgency: form.urgency || "routine",
                        notes: form.notes || ""
                    }))
                    : [{
                        patient_id: patient.id,
                        doctor_id: me?.id,
                        test_name: form.test_name,
                        urgency: form.urgency || "routine",
                        notes: form.notes || ""
                    }];

                await Promise.all(testsToRequest.map((test: any) => labs.create(test)));
                showToast("Lab request(s) submitted!");
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
            fetchData();
            setModal(null);
            setForm({});
        } catch (e: any) {
            console.error(e);
            showToast(e?.response?.data?.detail || "Failed to process request", false);
        } finally { setSaving(false); }
    };

    const handleCancelLab = async (id: number) => {
        if (!confirm("Are you sure you want to cancel this lab request?")) return;
        setSaving(true);
        try {
            await labs.update(id, { status: "cancelled" });
            const data = await labs.getResultsByPatient(patient.id);
            setLabList(data);
            showToast("Lab request cancelled.");
        } catch (e: any) {
            console.error(e);
            showToast(e?.response?.data?.detail || "Failed to cancel request", false);
        } finally { setSaving(false); }
    };

    const handleDoctorComment = async (labId: number) => {
        if (!doctorComment.trim()) return;
        setSaving(true);
        try {
            await labs.update(labId, { doctor_comments: doctorComment });
            const data = await labs.getResultsByPatient(patient.id);
            setLabList(data);
            setCommentingLabId(null);
            setDoctorComment("");
            showToast("Comment added successfully!");
        } catch (e: any) {
            console.error(e);
            showToast(e?.response?.data?.detail || "Failed to add comment", false);
        } finally { setSaving(false); }
    };

    const handleCancelRx = async (id: number) => {
        if (!confirm("Are you sure you want to cancel this entire prescription?")) return;
        setSaving(true);
        try {
            await pharmacy.cancelPrescription(id);
            showToast("Prescription cancelled.");
            fetchData();
        } catch (e: any) {
            console.error(e);
            showToast(e?.response?.data?.detail || "Failed to cancel prescription", false);
        } finally { setSaving(false); }
    };

    const handleCancelItem = async (itemId: number) => {
        if (!confirm("Remove this medication from the current prescription? It will remain in history as 'cancelled'.")) return;
        setSaving(true);
        try {
            await pharmacy.updateItemStatus(itemId, "cancelled");
            showToast("Medication removed from active order.");
            fetchData();
        } catch (e: any) {
            console.error(e);
            showToast(e?.response?.data?.detail || "Failed to remove medication", false);
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
        pending_payment: "bg-amber-50 text-amber-700",
        sent_to_pharmacy: "bg-indigo-50 text-indigo-700",
        dispensing: "bg-blue-50 text-blue-700",
        dispensed: "bg-emerald-50 text-emerald-700",
        completed: "bg-emerald-50 text-emerald-700",
        partial: "bg-orange-50 text-orange-700",
        failed: "bg-red-50 text-red-700",
        cancelled: "bg-gray-100 text-gray-500",
        out_of_stock: "bg-red-50 text-red-600",
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
                                            <p className="font-bold text-gray-900 text-sm truncate">Prescription #{rx.id}</p>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 uppercase ${RX_STATUS_STYLE[rx.status] || "bg-gray-100 text-gray-500"}`}>{rx.status.replace(/_/g, ' ')}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">{rx.items?.length || 0} Medications</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!['completed', 'failed', 'cancelled'].includes(rx.status) && (
                                            <button 
                                                onClick={() => handleCancelRx(rx.id)}
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Cancel Prescription"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button onClick={() => setExpandedRx(expandedRx === rx.id ? null : rx.id)} className="p-1 text-gray-400">
                                            {expandedRx === rx.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                {expandedRx === rx.id && (
                                    <div className="border-t border-gray-50 px-4 py-3 bg-gray-50/50 space-y-2">
                                        <div className="space-y-2">
                                            {rx.items?.map((item: any, idx: number) => (
                                                <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-900">{item.drug_name}</p>
                                                        <p className="text-[10px] text-gray-500">{item.dosage} · {item.frequency} · {item.duration}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase ${RX_STATUS_STYLE[item.status] || "bg-gray-100 text-gray-500"}`}>
                                                            {item.status.replace(/_/g, ' ')}
                                                        </span>
                                                        {item.status === 'pending' && (
                                                            <button 
                                                                onClick={() => handleCancelItem(item.id)}
                                                                className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                title="Remove Medication"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {rx.instructions && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 italic">Note: {rx.instructions}</p>}
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
                            <div key={l.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all">
                                <div className="p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                                        <FlaskConical className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-gray-900">
                                            <span className="text-blue-600 mr-2">#{l.short_id}</span>
                                            {l.test_name}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5 capitalize">{l.urgency} · {l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${['validated', 'completed'].includes(l.status) ? "bg-emerald-100 text-emerald-700" : l.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                                                {l.status}
                                            </span>
                                            {(l.result || l.result_data) && (
                                                <button 
                                                    onClick={() => setExpandedLab(expandedLab === l.id ? null : l.id)}
                                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {expandedLab === l.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                        {l.status === "requested" && (
                                            <button onClick={() => handleCancelLab(l.id)} className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                                                Cancel Request
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {expandedLab === l.id && (l.result || l.result_data) && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden bg-slate-50/30 border-t border-slate-50"
                                        >
                                            <div className="p-4">
                                                <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
                                                    {/* Report Header */}
                                                    <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                                                <FileSearch className="w-4 h-4 text-white" />
                                                            </div>
                                                            <span className="text-sm font-black text-white uppercase tracking-widest">Clinical Analysis Report</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Beneficiary</span>
                                                            <span className="text-xs font-bold text-slate-100">{getName(patient)}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end pl-4 ml-4 border-l border-white/10">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Technician</span>
                                                            <span className="text-xs font-bold text-slate-100">{l.validator?.full_name || 'Processing...'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Report Body */}
                                                    <div className="p-6">
                                                        {l.result_data ? (
                                                                <div className="overflow-hidden border-t border-slate-100">
                                                                    <table className="w-full text-left border-collapse">
                                                                        <thead>
                                                                            <tr className="bg-slate-50/50">
                                                                                <th className="px-4 py-2 font-black text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-100">Parameter</th>
                                                                                <th className="px-4 py-2 font-black text-slate-400 uppercase tracking-widest text-[9px] text-center border-b border-slate-100">Value</th>
                                                                                <th className="px-4 py-2 font-black text-slate-400 uppercase tracking-widest text-[9px] text-center border-b border-slate-100">Unit</th>
                                                                                <th className="px-4 py-2 font-black text-slate-400 uppercase tracking-widest text-[9px] text-right border-b border-slate-100">Range</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-50">
                                                                            {(l.result_data && l.result_data.startsWith('[') ? JSON.parse(l.result_data) : []).map((r: any, idx: number) => (
                                                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                                                    <td className="px-4 py-2.5 font-bold text-slate-700 text-xs tracking-tight">{r.parameter}</td>
                                                                                    <td className="px-4 py-2.5 text-center">
                                                                                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 font-black rounded text-[13px] tracking-tighter">{r.result}</span>
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-center text-[10px] text-slate-400 font-bold uppercase">
                                                                                        {r.unit || '-'}
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-slate-400 text-right text-[10px] font-medium">
                                                                                        {r.reference || '-'}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                        ) : (
                                                            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center text-center">
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Clinical Indicator</p>
                                                                <p className="text-3xl font-black text-indigo-600 tracking-tight">{l.result}</p>
                                                            </div>
                                                        )}
                                                        <div className="mt-4 flex justify-end">
                                                            <button 
                                                                onClick={() => handlePrint(l)}
                                                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                                            >
                                                                <Printer className="w-4 h-4" />
                                                                Print Lab Report
                                                            </button>
                                                        </div>

                                                        {/* Tech Summary */}
                                                        {(l.notes || (l.result && l.result_data)) && (
                                                            <div className="mt-4 p-4 bg-blue-50/30 border border-blue-100/50 rounded-xl flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className="w-1 h-3 bg-blue-400 rounded-full" />
                                                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Tech Conclusion</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-600 italic leading-relaxed">
                                                                        "{l.notes || l.result || "No specific comments."}"
                                                                    </p>
                                                                </div>
                                                                {l.validator && (
                                                                    <div className="text-right shrink-0">
                                                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Signed By</p>
                                                                        <p className="text-[10px] font-bold text-slate-700">{l.validator.full_name}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Doctor's Comment Section */}
                                                        <div className="mt-6 border-t border-slate-100 pt-6">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Interpretation</span>
                                                                </div>
                                                                {l.doctor_comments && commentingLabId !== l.id && (
                                                                    <button 
                                                                        onClick={() => {
                                                                            setCommentingLabId(l.id);
                                                                            setDoctorComment(l.doctor_comments || "");
                                                                        }}
                                                                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                                                                    >
                                                                        Edit Comment
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {l.doctor_comments && commentingLabId !== l.id ? (
                                                                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 shadow-sm">
                                                                    <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                                                                        {l.doctor_comments}
                                                                    </p>
                                                                    <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-indigo-400">
                                                                        <Check className="w-3 h-3" />
                                                                        Reviewed by Dr. {users.getMeSync()?.full_name || "Self"}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    <textarea 
                                                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-medium text-slate-700 focus:bg-white focus:border-indigo-400 outline-none transition-all h-24 resize-none"
                                                                        placeholder="Add clinical interpretation..."
                                                                        value={doctorComment}
                                                                        onChange={e => setDoctorComment(e.target.value)}
                                                                        onFocus={() => setCommentingLabId(l.id)}
                                                                    />
                                                                    {commentingLabId === l.id && (
                                                                        <div className="flex gap-2">
                                                                            <button 
                                                                                onClick={() => handleDoctorComment(l.id)}
                                                                                disabled={saving || !doctorComment.trim()}
                                                                                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                                                            >
                                                                                {saving ? "Saving..." : "Save Interpretation"}
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => {
                                                                                    setCommentingLabId(null);
                                                                                    setDoctorComment("");
                                                                                }}
                                                                                className="px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                                                            >
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── REFERRALS TAB ── */}
                {activeTab === "refs" && (
                    <div className="grid gap-4">
                        {refList.length === 0 ? (
                            <div className="flex flex-col items-center py-20 gap-3 text-slate-300">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner">
                                    <UserCheck className="w-10 h-10 opacity-20" />
                                </div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Sent Referrals</p>
                            </div>
                        ) : refList.map((r: any) => (
                            <div key={r.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-xl transition-all border-l-4 border-l-pink-500">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center">
                                            <UserCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 leading-tight">Referral Request</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: REF-{r.id}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black px-3 py-1.5 rounded-full bg-pink-50 text-pink-700 uppercase tracking-widest border border-pink-100">{r.urgency}</span>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reason for Referral</p>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{r.reason}</p>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        <span>{new Date(r.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Clinical Actions ── */}
                <div className="mt-12 bg-white/40 backdrop-blur-xl p-8 rounded-[40px] border border-white/50 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Clinical Directives</h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 bg-white/50 px-3 py-1 rounded-full border border-white">Authorized Access</span>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                        {ACTIONS.map((a) => (
                            <button key={a.id} onClick={() => { setForm({}); setModal(a.id as ModalType); }}
                                className="flex flex-col items-center gap-3 active:scale-90 transition-all group"
                            >
                                <div className={`w-full aspect-square bg-gradient-to-br ${a.color} text-white rounded-[24px] flex items-center justify-center shadow-lg group-hover:shadow-2xl group-hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <a.icon className="w-7 h-7" />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 text-center uppercase tracking-widest">{a.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Modal ── */}
            <AnimatePresence>
                {activeModal && (
                    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
                            onClick={() => setModal(null)} 
                        />
                        <motion.div 
                            initial={{ y: 100, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 100, opacity: 0, scale: 0.95 }}
                            className="relative bg-white w-full sm:max-w-lg rounded-[40px] shadow-2xl z-10 overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className={`p-8 bg-gradient-to-r ${ACTIONS.find(a => a.id === activeModal)?.color} text-white relative`}>
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    {(() => { const A = ACTIONS.find(a => a.id === activeModal); return A ? <A.icon className="w-32 h-32" /> : null; })()}
                                </div>
                                <div className="relative flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                                            {(() => { const A = ACTIONS.find(a => a.id === activeModal); return A ? <A.icon className="w-7 h-7" /> : null; })()}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black tracking-tight">{ACTIONS.find(a => a.id === activeModal)?.label}</h2>
                                            <p className="text-white/70 font-bold text-xs uppercase tracking-widest mt-1">Patient: {getName(patient)}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setModal(null)} className="w-10 h-10 bg-white/20 rounded-xl hover:bg-white/30 flex items-center justify-center transition-all active:scale-95">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {activeModal === "prescribe" && (
                                    <div className="space-y-6">
                                        {/* Current Items List */}
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Added Medications</p>
                                            {(form.items || []).length === 0 ? (
                                                <div className="p-8 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center text-slate-300">
                                                    <Package className="w-8 h-8 opacity-20 mb-2" />
                                                    <p className="text-[10px] font-bold uppercase tracking-widest">No medications added yet</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {form.items.map((item: any, idx: number) => (
                                                        <div key={idx} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center justify-between group">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-bold text-gray-900 text-sm truncate">{item.drug_name}</p>
                                                                    {item.is_internal && <span className="text-[8px] font-black px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full uppercase">In-Stock</span>}
                                                                </div>
                                                                <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-tight">{item.dosage} · {item.frequency} · {item.duration}</p>
                                                            </div>
                                                            <button 
                                                                onClick={() => {
                                                                    const cur = [...form.items];
                                                                    cur.splice(idx, 1);
                                                                    sf("items", cur);
                                                                }} 
                                                                className="w-8 h-8 rounded-full bg-white text-red-500 shadow-sm flex items-center justify-center ml-4 group-hover:bg-red-500 group-hover:text-white transition-all"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Search & Add Section */}
                                        <div className="bg-slate-900 p-6 rounded-[32px] space-y-4 shadow-2xl shadow-slate-200">
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Search medicine catalog..." 
                                                    className="w-full bg-slate-800 border-none rounded-2xl p-4 pl-12 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={searchingDrug}
                                                    onChange={e => setSearchingDrug(e.target.value)}
                                                />
                                                {searchingDrug && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[50]">
                                                        {inventory.filter(i => i.name.toLowerCase().includes(searchingDrug.toLowerCase())).slice(0, 5).map(item => (
                                                            <button 
                                                                key={item.id} 
                                                                onClick={() => {
                                                                    sf("medication", item.name);
                                                                    sf("unit_price", item.unit_price);
                                                                    sf("is_internal", true);
                                                                    sf("inventory_item_id", item.id);
                                                                    setSearchingDrug("");
                                                                }}
                                                                className="w-full px-5 py-3 hover:bg-slate-50 flex items-center justify-between transition-colors border-b border-slate-50 last:border-0"
                                                            >
                                                                <div className="text-left">
                                                                    <p className="text-xs font-bold text-slate-900">{item.name}</p>
                                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.category}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[10px] font-black text-blue-600 uppercase">₦ {item.unit_price}</p>
                                                                    <p className={`text-[9px] font-bold ${item.quantity > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{item.quantity > 0 ? `${item.quantity} in stock` : 'Out of Stock'}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                        <div className="px-5 py-3 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase">Use External Item:</p>
                                                            <button 
                                                                onClick={() => {
                                                                    sf("medication", searchingDrug);
                                                                    sf("is_internal", false);
                                                                    sf("unit_price", 0);
                                                                    setSearchingDrug("");
                                                                }}
                                                                className="text-[10px] font-black text-blue-600 uppercase underline"
                                                            >
                                                                Add "{searchingDrug}"
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {form.medication && (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                                    <div className="flex items-center gap-3 bg-slate-800 p-4 rounded-2xl">
                                                        <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center">
                                                            <Pill className="w-5 h-5" />
                                                        </div>
                                                        <p className="text-white text-xs font-black uppercase tracking-wider">{form.medication}</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input placeholder="Dosage" className="bg-slate-800 border-none rounded-2xl p-4 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500" value={form.dosage || ""} onChange={e => sf("dosage", e.target.value)} />
                                                        <input placeholder="Frequency" className="bg-slate-800 border-none rounded-2xl p-4 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500" value={form.frequency || ""} onChange={e => sf("frequency", e.target.value)} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input placeholder="Duration" className="bg-slate-800 border-none rounded-2xl p-4 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500" value={form.duration || ""} onChange={e => sf("duration", e.target.value)} />
                                                        <input type="number" placeholder="Qty" className="bg-slate-800 border-none rounded-2xl p-4 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500" value={form.quantity || 1} onChange={e => sf("quantity", parseInt(e.target.value) || 1)} />
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            if (!form.dosage || !form.frequency) return showToast("Complete dosage/freq", false);
                                                            const newItem = {
                                                                drug_name: form.medication,
                                                                dosage: form.dosage,
                                                                frequency: form.frequency,
                                                                duration: form.duration || "unspecified",
                                                                quantity: form.quantity || 1,
                                                                unit_price: form.unit_price || 0,
                                                                is_internal: !!form.is_internal,
                                                                inventory_item_id: form.inventory_item_id
                                                            };
                                                            sf("items", [...(form.items || []), newItem]);
                                                            // Clear current editing fields
                                                            sf("medication", "");
                                                            sf("dosage", "");
                                                            sf("frequency", "");
                                                            sf("duration", "");
                                                            sf("quantity", 1);
                                                            sf("is_internal", false);
                                                            sf("inventory_item_id", null);
                                                        }}
                                                        className="w-full bg-blue-600 text-white h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                                    >
                                                        Add to Prescription
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <LF l="Clinical Notes (Overall)"><LT placeholder="Instruction for pharmacist..." v={form.instructions} s={(v: string) => sf("instructions", v)} /></LF>
                                    </div>
                                )}

                                {activeModal === "lab" && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Investigation(s)</p>
                                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                                            {catalog.map(c => (
                                                <button key={c.id} onClick={() => {
                                                    const cur = form.test_names || [];
                                                    sf("test_names", cur.includes(c.name) ? cur.filter((n:string)=>n!==c.name) : [...cur, c.name]);
                                                }} className={`p-4 rounded-2xl border-2 text-[11px] font-black uppercase tracking-wider transition-all text-center ${form.test_names?.includes(c.name) ? "bg-amber-600 border-amber-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-500 hover:border-amber-200"}`}>
                                                    {c.name}
                                                </button>
                                            ))}
                                        </div>
                                        <LF l="Other Test Name"><LI placeholder="Type here..." v={form.test_name} s={(v:string)=>sf("test_name",v)} /></LF>
                                        <LF l="Clinical Indication"><LT placeholder="Reason for investigation..." v={form.notes} s={(v:string)=>sf("notes",v)} /></LF>
                                    </div>
                                )}

                                {activeModal === "consult" && (
                                    <div className="space-y-4">
                                        <LF l="Chief Complaint *"><LI placeholder="Primary issue..." v={form.chief_complaint} s={(v: string) => sf("chief_complaint", v)} /></LF>
                                        <LF l="Diagnosis *"><LT placeholder="Clinical assessment..." v={form.diagnosis} s={(v: string) => sf("diagnosis", v)} /></LF>
                                        <LF l="Treatment Plan"><LT placeholder="Proposed interventions..." v={form.treatment_plan} s={(v: string) => sf("treatment_plan", v)} /></LF>
                                    </div>
                                )}

                                {activeModal === "admit" && (
                                    <div className="space-y-4">
                                        <LF l="Select Bed *">
                                            <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500" value={form.bed_id || ""} onChange={e => sf("bed_id", e.target.value)}>
                                                <option value="">Select Bed</option>
                                                {availBeds.map((b: any) => (
                                                    <option key={b.id} value={b.id}>Bed {b.bed_number} - {b.ward_name}</option>
                                                ))}
                                            </select>
                                        </LF>
                                    </div>
                                )}

                                {activeModal === "refer" && (
                                    <div className="space-y-4">
                                        <LF l="Refer To specialist *">
                                            <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-pink-500" value={form.referred_doctor_id || ""} onChange={e => sf("referred_doctor_id", e.target.value)}>
                                                <option value="">Select Doctor</option>
                                                {otherDocs.map(d => <option key={d.id} value={d.id}>Dr. {d.full_name}</option>)}
                                            </select>
                                        </LF>
                                        <LF l="Urgency"><select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-pink-500" value={form.urgency || "routine"} onChange={e => sf("urgency", e.target.value)}><option value="routine">Routine</option><option value="urgent">Urgent</option><option value="emergency">Emergency</option></select></LF>
                                        <LF l="Reason *"><LT placeholder="Clinical grounds..." v={form.reason} s={(v: string) => sf("reason", v)} /></LF>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex gap-4">
                                <button className="flex-1 bg-slate-900 text-white h-16 rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50" onClick={handleSubmit} disabled={saving}>
                                    {saving ? "Processing..." : `Complete ${ACTIONS.find(a => a.id === activeModal)?.label}`}
                                </button>
                                <button className="px-8 bg-white text-slate-500 h-16 rounded-3xl font-black uppercase tracking-widest text-[11px] border border-slate-200 hover:bg-slate-100 transition-all active:scale-95" onClick={() => setModal(null)}>
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bottom Nav Spacer */}
            <div className="h-20" />
        </div>
    );
}

// ── Components ──
const LF = ({ l, children }: any) => (
    <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">{l}</label>
        {children}
    </div>
);
const LI = ({ v, s, placeholder, type = "text" }: any) => (
    <input 
        type={type} 
        placeholder={placeholder} 
        value={v || ""} 
        onChange={e => s(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300"
    />
);
const LT = ({ v, s, placeholder, rows = 3 }: any) => (
    <textarea 
        rows={rows} 
        placeholder={placeholder} 
        value={v || ""} 
        onChange={e => s(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 resize-none"
    />
);
