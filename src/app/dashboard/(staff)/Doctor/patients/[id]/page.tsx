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
    Download, Share2, Printer, ClipboardList, Send, User, User2, Badge, BadgeCheck, CheckCircle2, Stethoscope, Bed, Package, HeartPulse, AlertTriangle, Zap, MessageCircle
} from "lucide-react";
import ChatBox from "@/components/chat/ChatBox";
import {
    patientService, prescriptions, consultations, referrals,
    beds, users, auth, labs, labCatalog, pharmacy, nurseService, directiveService,
    medicalRecords, getDoctors
} from "@/services/api";

type ModalType = "prescribe" | "lab" | "consult" | "admit" | "refer" | "directive" | "discharge" | null;
type TabType = "info" | "rx" | "labs" | "refs" | "nursing" | "vitals" | "chats";

const getName = (p: any) => p?.user?.full_name || p?.full_name || "Unknown Patient";
const getEmail = (p: any) => p?.user?.email || p?.email || "—";
const getPhone = (p: any) => p?.phone_number || p?.phone || "—";
const getGender = (p: any) => p?.gender || "—";
const getDob = (p: any) => p?.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const getBlood = (p: any) => p?.blood_group || "—";
const getAddr = (p: any) => p?.address || "—";
const getAge = (p: any) => {
    if (!p?.date_of_birth) return null;
    const diff = Date.now() - new Date(p.date_of_birth).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};
const initials = (p: any) => getName(p).split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

const BLOOD_COLORS: Record<string, string> = {
    "A+": "bg-red-500", "A-": "bg-red-400", "B+": "bg-orange-500", "B-": "bg-orange-400",
    "AB+": "bg-purple-600", "AB-": "bg-purple-500", "O+": "bg-blue-600", "O-": "bg-blue-500",
};

export default function DoctorPatientDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    const [patient, setPatient] = useState<any>(null);
    const [me, setMe] = useState<any>(null);
    const [availBeds, setAvailBeds] = useState<any[]>([]);
    const [otherDocs, setOtherDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeModal, setModal] = useState<ModalType>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<any>({});
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const [activeTab, setTab] = useState<TabType>("info");
    const [rxList, setRxList] = useState<any[]>([]);
    const [labList, setLabList] = useState<any[]>([]);
    const [refList, setRefList] = useState<any[]>([]);
    const [catalog, setCatalog] = useState<any[]>([]);
    const [expandedRx, setExpandedRx] = useState<number | null>(null);
    const [expandedLab, setExpandedLab] = useState<number | null>(null);
    const [inventory, setInventory] = useState<any[]>([]);
    const [nurseLogs, setNurseLogs] = useState<any[]>([]);
    const [directives, setDirectives] = useState<any[]>([]);
    const [searchingDrug, setSearchingDrug] = useState("");
    const [assignedBedId, setAssignedBedId] = useState<number | null>(null);
    const [assignedBedNum, setAssignedBedNum] = useState<string | null>(null);
    const [myDoctorId, setMyDoctorId] = useState<number | null>(null);
    const [activeChatId, setActiveChatId] = useState<number | null>(null);

    useEffect(() => {
        if (labList.length > 0 && !expandedLab) {
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
            const [pat, meData, bedsData, usersData, rxData, labData, refData, catData, pharmacyData, nurseLogsData, dirsData, docProfiles, activeChatIdData] = await Promise.all([
                patientService.getById(Number(id)),
                auth.getMe(),
                beds.getAll().catch(() => []),
                users.getAll().catch(() => []),
                prescriptions.getAll().catch(() => []),
                labs.getAll().catch(() => []),
                referrals.getAll().catch(() => []),
                labCatalog.getAll().catch(() => []),
                pharmacy.getInventory().catch(() => []),
                nurseService.getActivityLogs(Number(id)).catch(() => []),
                directiveService.getAllByPatient(Number(id)).catch(() => []),
                getDoctors().catch(() => []),
                patientService.getActiveChatId(Number(id)).catch(() => 1)
            ]);
            
            setPatient(pat);
            setMe(meData);
            setActiveChatId(activeChatIdData);
            setAvailBeds((Array.isArray(bedsData) ? bedsData : []).filter((b: any) => b.status === "available"));

            const allDocs = Array.isArray(docProfiles) ? docProfiles : [];
            setOtherDocs(allDocs.filter((d: any) => d.email !== meData?.email));
            
            const pId = pat?.id;
            const rxRaw = Array.isArray(rxData) ? rxData : [];
            setRxList(rxRaw.filter((r: any) => r.patient_id === pId));
            
            const labRaw = Array.isArray(labData) ? labData : [];
            const sortedLabs = [...labRaw]
                .filter((l: any) => l.patient_id === pId)
                .sort((a: any, b: any) => {
                    const statusOrder: Record<string, number> = { 'completed': 1, 'validated': 2, 'processing': 3, 'sample_collected': 4, 'requested': 5 };
                    const orderA = statusOrder[a.status] || 99;
                    const orderB = statusOrder[b.status] || 99;
                    if (orderA !== orderB) return orderA - orderB;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });
            setLabList(sortedLabs);
            
            const refRaw = Array.isArray(refData) ? refData : [];
            setRefList(refRaw.filter((r: any) => r.patient_id === pId));
            
            setCatalog(Array.isArray(catData) ? catData : []);
            setInventory(Array.isArray(pharmacyData) ? pharmacyData : []);
            setNurseLogs(Array.isArray(nurseLogsData) ? nurseLogsData : []);
            setDirectives(Array.isArray(dirsData) ? dirsData : []);

            // Identify doctor profile ID for logging
            const docs = Array.isArray(docProfiles) ? docProfiles : [];
            const currentDoc = docs.find((d: any) => d.email === meData?.email);
            if (currentDoc) setMyDoctorId(currentDoc.id);

            // Identify patient's assigned bed robustly
            const allBeds = Array.isArray(bedsData) ? bedsData : [];
            const patientBed = allBeds.find((b: any) => b.patient_id === pId);
            if (patientBed) {
                setAssignedBedId(patientBed.id);
                setAssignedBedNum(patientBed.bed_number);
            }
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
                
                // Aligning with backend Referral model fields: from_doctor_id, to_doctor_id
                // Note: Urgency 'stat' and 'urgent' both map to backend Enums
                const urgency = form.urgency === "stat" ? "emergency" : (form.urgency || "routine");
                
                await referrals.create({ 
                    patient_id: patient.id, 
                    from_doctor_id: myDoctorId || me?.id, 
                    to_doctor_id: Number(form.referred_doctor_id), 
                    reason: form.reason, 
                    urgency: urgency, 
                    notes: form.notes || "" 
                });
                showToast("Referral sent!");
            } else if (activeModal === "directive") {
                if (!form.instruction) return showToast("Instruction is required.", false);
                await directiveService.create({
                    patient_id: patient.id,
                    instruction: form.instruction,
                    urgency: form.urgency || "routine",
                    doctor_notes: form.doctor_notes || ""
                });
                showToast("Clinical directive issued to nursing staff!");
            }
            fetchData();
            setModal(null);
            setForm({});
        } catch (e: any) {
            console.error(e);
            showToast(e?.response?.data?.detail || "Failed to process request", false);
        } finally { setSaving(false); }
    };
    const handleAcceptReferral = async (refId: number) => {
        try {
            setSaving(true);
            await referrals.accept(refId);
            showToast("Referral accepted! You now have clinical access.");
            fetchData();
        } catch (e: any) {
            showToast(e?.response?.data?.detail || "Failed to accept referral", false);
        } finally {
            setSaving(false);
        }
    };

    const handleDischargeRequest = () => {
        setForm({});
        setModal("discharge");
    };

    const submitDischarge = async () => {
        const bedId = assignedBedId || patient?.bed_id || patient?.assigned_bed_id;
        if (!bedId) return showToast("Bed reference not found for this patient.", false);
        if (!form.discharge_summary) return showToast("Discharge summary is required.", false);
        
        setSaving(true);
        try {
            await beds.discharge(bedId);
            
            // Log as a formal Medical Record (more flexible than Consultation which requires an appointment)
            await medicalRecords.create({
                patient_id: patient.id,
                doctor_id: myDoctorId || me?.id, // Fallback to user_id if doctor_id lookup failed
                visit_date: new Date().toISOString(),
                symptoms: "In-Patient Discharge Assessment",
                diagnosis: "Final Ward Evaluation",
                treatment: form.discharge_summary,
                notes: "Formal clinic discharge issued. Bed release finalized."
            });
            
            showToast("Discharge finalized and records updated!");
            fetchData();
            setModal(null);
        } catch (e: any) {
            console.error(e);
            showToast(e?.response?.data?.detail || "Discharge failed", false);
        } finally {
            setSaving(false);
        }
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
        { id: "prescribe", label: "Prescribe", icon: Pill, color: "from-violet-500 to-purple-600", bg: "bg-violet-50", text: "text-violet-600" },
        { id: "directive", label: "Directive", icon: Zap, color: "from-indigo-500 to-blue-600", bg: "bg-indigo-50", text: "text-indigo-600" },
        { id: "lab", label: "Lab Test", icon: FlaskConical, color: "from-amber-400 to-orange-500", bg: "bg-amber-50", text: "text-amber-600" },
        { id: "consult", label: "Consult", icon: Stethoscope, color: "from-blue-500 to-cyan-600", bg: "bg-blue-50", text: "text-blue-600" },
        { id: "admit", label: "Admit", icon: Bed, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50", text: "text-emerald-600" },
        { id: "refer", label: "Refer", icon: UserCheck, color: "from-pink-500 to-rose-600", bg: "bg-pink-50", text: "text-pink-600" },
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
        <div className="min-h-screen bg-[#F4F7FE] flex flex-col font-sans selection:bg-blue-100">
            {toast && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[500] px-6 py-4 rounded-[24px] shadow-2xl text-sm font-black flex items-center gap-3 min-w-[320px] justify-center animate-in fade-in slide-in-from-top-4 ${toast.ok ? "bg-slate-900 text-white" : "bg-rose-600 text-white"}`}>
                    {toast.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5" />}
                    {toast.msg}
                </div>
            )}

            <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-[100] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
                                {initials(patient)}
                            </div>
                            {patient.is_admitted && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{getName(patient)}</h1>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                <span>MRN #{patient.id}</span>
                                <span>•</span>
                                <span>{getGender(patient)}</span>
                                <span>•</span>
                                <span>{age || 'N/A'} yrs</span>
                                <span>•</span>
                                <span className={`px-2 py-0.5 rounded-full text-white text-[10px] font-medium ${bloodColor}`}>
                                    {bloodGroup}
                                </span>
                                {patient.is_admitted && (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-medium">
                                        Admitted {assignedBedNum ? `· Bed ${assignedBedNum}` : "· In-Patient"}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {patient.is_admitted && (
                        <button onClick={handleDischargeRequest} className="h-11 px-6 bg-rose-600/10 text-rose-500 hover:bg-rose-600 hover:text-white border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50">
                            DISCHARGE PATIENT
                        </button>
                    )}
                    <div className="text-right">
                        <p className="text-xs text-gray-400">Attending</p>
                        <p className="text-sm font-medium text-gray-800">Dr. {me?.full_name}</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
                    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            {ACTIONS.map((action) => (
                                <button
                                    key={action.id}
                                    onClick={() => { setForm({}); setModal(action.id as ModalType); }}
                                    className="flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all group"
                                >
                                    <div className={`w-8 h-8 rounded-xl ${action.bg} ${action.text} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                                        <action.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700">{action.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-1 bg-white p-1 rounded-2xl border border-gray-100 w-fit">
                            {([
                                { id: "info", label: "Profile", icon: User },
                                { id: "rx", label: "Medications", icon: Pill },
                                { id: "labs", label: "Investigations", icon: FlaskConical },
                                { id: "nursing", label: "Clinical Notes", icon: FileText },
                                { id: "refs", label: "Referrals", icon: UserCheck },
                                { id: "chats", label: "Chats", icon: MessageCircle },
                            ] as const).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setTab(tab.id as TabType)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                                        activeTab === tab.id
                                            ? "bg-gray-900 text-white shadow-sm"
                                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                    {tab.id === 'rx' && rxList.length > 0 && (
                                        <span className={`text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'} px-1.5 py-0.5 rounded-full`}>
                                            {rxList.length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">

                            {activeTab === "info" && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                        <div className="px-6 py-5 border-b border-gray-50">
                                            <h3 className="text-sm font-semibold text-gray-900">Demographics & Contact</h3>
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            {[
                                                { icon: Mail, label: "Email", value: getEmail(patient) },
                                                { icon: Phone, label: "Phone", value: getPhone(patient) },
                                                { icon: Calendar, label: "Date of Birth", value: `${getDob(patient)}${age ? ` (${age} years)` : ""}` },
                                                { icon: Droplets, label: "Blood Group", value: bloodGroup },
                                                { icon: MapPin, label: "Address", value: getAddr(patient) },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center gap-4 px-6 py-4">
                                                    <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
                                                        <item.icon className="w-4 h-4 text-gray-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                                                        <p className="text-sm font-medium text-gray-800">{item.value}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {directives.length > 0 && (
                                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Zap className="w-5 h-5 text-indigo-500" />
                                                    <h3 className="text-sm font-semibold text-gray-900">Active Directives</h3>
                                                </div>
                                                <button onClick={() => setModal("directive")} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                                                    + New
                                                </button>
                                            </div>
                                            <div className="divide-y divide-gray-50">
                                                {directives.slice(0, 3).map((d: any) => (
                                                    <div key={d.id} className="px-6 py-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                                    d.urgency === 'stat' ? 'bg-red-100 text-red-700' :
                                                                    d.urgency === 'urgent' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                    {d.urgency}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400">{new Date(d.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                                                d.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                                d.status === 'acknowledged' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {d.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-800 font-medium">{d.instruction}</p>
                                                        {d.doctor_notes && (
                                                            <p className="text-xs text-gray-500 mt-2 italic">"{d.doctor_notes}"</p>
                                                        )}
                                                    </div>
                                                ))}
                                                {directives.length > 3 && (
                                                    <div className="px-6 py-3 text-center text-xs text-gray-400">
                                                        + {directives.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "rx" && (
                                <div className="space-y-3">
                                    {rxList.length === 0 ? (
                                        <div className="flex flex-col items-center py-16 gap-3 text-gray-300 bg-white rounded-3xl border border-gray-100">
                                            <Pill className="w-10 h-10" />
                                            <p className="text-sm text-gray-400 font-medium">No prescriptions yet</p>
                                        </div>
                                    ) : rxList.map((rx: any) => (
                                        <div key={rx.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                            <div className="px-5 py-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                                                        <Pill className="w-5 h-5 text-violet-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-gray-900">Prescription #{rx.id}</p>
                                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${RX_STATUS_STYLE[rx.status] || "bg-gray-100 text-gray-500"}`}>
                                                                {rx.status.replace(/_/g, ' ')}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500">{rx.items?.length || 0} medications</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!['completed', 'failed', 'cancelled'].includes(rx.status) && (
                                                        <button onClick={() => handleCancelRx(rx.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => setExpandedRx(expandedRx === rx.id ? null : rx.id)} className="p-2 text-gray-400 hover:text-gray-600">
                                                        {expandedRx === rx.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                            {expandedRx === rx.id && (
                                                <div className="border-t border-gray-50 px-5 py-4 bg-gray-50/30 space-y-3">
                                                    <div className="space-y-2">
                                                        {rx.items?.map((item: any, idx: number) => (
                                                            <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">{item.drug_name}</p>
                                                                    <p className="text-xs text-gray-500">{item.dosage} · {item.frequency} · {item.duration}</p>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${RX_STATUS_STYLE[item.status] || "bg-gray-100 text-gray-500"}`}>
                                                                        {item.status}
                                                                    </span>
                                                                    {item.status === 'pending' && (
                                                                        <button onClick={() => handleCancelItem(item.id)} className="text-red-400 hover:text-red-600">
                                                                            <X className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {rx.instructions && (
                                                        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                                            <p className="text-xs text-amber-700">Note: {rx.instructions}</p>
                                                        </div>
                                                    )}
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

                            {activeTab === "labs" && (
                                <div className="space-y-4">
                                    {labList.length === 0 ? (
                                        <div className="flex flex-col items-center py-16 gap-3 text-gray-300 bg-white rounded-3xl border border-gray-100">
                                            <FlaskConical className="w-10 h-10" />
                                            <p className="text-sm text-gray-400 font-medium">No lab requests yet</p>
                                        </div>
                                    ) : labList.map((l: any) => (
                                        <div key={l.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                            <div className="px-5 py-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                                                        <FlaskConical className="w-5 h-5 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            <span className="text-blue-600 mr-2">#{l.short_id}</span>
                                                            {l.test_name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 capitalize">{l.urgency} · {l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${
                                                        ['validated', 'completed'].includes(l.status) ? "bg-emerald-100 text-emerald-700" :
                                                        l.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                                                    }`}>
                                                        {l.status}
                                                    </span>
                                                    {(l.result || l.result_data) && (
                                                        <button onClick={() => setExpandedLab(expandedLab === l.id ? null : l.id)} className="p-2 text-gray-400 hover:text-gray-600">
                                                            {expandedLab === l.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    )}
                                                    {l.status === "requested" && (
                                                        <button onClick={() => handleCancelLab(l.id)} className="text-xs font-medium text-red-500 hover:text-red-700">
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {expandedLab === l.id && (l.result || l.result_data) && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-50">
                                                        <div className="p-5 bg-gray-50/30">
                                                            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                                                <div className="bg-gray-50 px-5 py-3 flex justify-between items-center border-b border-gray-100">
                                                                    <div className="flex items-center gap-2">
                                                                        <FileSearch className="w-4 h-4 text-gray-500" />
                                                                        <span className="text-xs font-medium text-gray-700">Lab Report</span>
                                                                    </div>
                                                                    <button onClick={() => handlePrint(l)} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700">
                                                                        <Printer className="w-3.5 h-3.5" />
                                                                        Print
                                                                    </button>
                                                                </div>
                                                                <div className="p-5">
                                                                    {l.result_data ? (
                                                                        <div className="overflow-x-auto">
                                                                            <table className="w-full text-sm">
                                                                                <thead>
                                                                                    <tr className="border-b border-gray-100">
                                                                                        <th className="text-left py-2 text-xs font-medium text-gray-400">Parameter</th>
                                                                                        <th className="text-center py-2 text-xs font-medium text-gray-400">Value</th>
                                                                                        <th className="text-center py-2 text-xs font-medium text-gray-400">Unit</th>
                                                                                        <th className="text-right py-2 text-xs font-medium text-gray-400">Range</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {(l.result_data && l.result_data.startsWith('[') ? JSON.parse(l.result_data) : []).map((r: any, idx: number) => (
                                                                                        <tr key={idx} className="border-b border-gray-50">
                                                                                            <td className="py-2.5 font-medium text-gray-800">{r.parameter}</td>
                                                                                            <td className="py-2.5 text-center font-semibold text-blue-600">{r.result}</td>
                                                                                            <td className="py-2.5 text-center text-gray-400 text-xs">{r.unit || '-'}</td>
                                                                                            <td className="py-2.5 text-right text-gray-400 text-xs">{r.reference || '-'}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                             </table>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="py-6 text-center bg-gray-50 rounded-xl">
                                                                            <p className="text-lg font-semibold text-indigo-600">{l.result}</p>
                                                                        </div>
                                                                    )}
                                                                    {l.notes && (
                                                                        <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                                                                            <p className="text-xs text-blue-700">{l.notes}</p>
                                                                        </div>
                                                                    )}

                                                                    <div className="mt-5 pt-4 border-t border-gray-100">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                                                                                <span className="text-xs font-medium text-gray-500">Doctor's Comment</span>
                                                                            </div>
                                                                            {l.doctor_comments && commentingLabId !== l.id && (
                                                                                <button onClick={() => { setCommentingLabId(l.id); setDoctorComment(l.doctor_comments || ""); }} className="text-xs text-indigo-600 hover:text-indigo-700">
                                                                                    Edit
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        {l.doctor_comments && commentingLabId !== l.id ? (
                                                                            <div className="bg-indigo-50/50 rounded-xl p-3">
                                                                                <p className="text-sm text-indigo-900">{l.doctor_comments}</p>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="space-y-2">
                                                                                <textarea className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:bg-white focus:border-indigo-300 outline-none transition-all h-20 resize-none" placeholder="Add clinical interpretation..." value={doctorComment} onChange={e => setDoctorComment(e.target.value)} onFocus={() => setCommentingLabId(l.id)} />
                                                                                {commentingLabId === l.id && (
                                                                                    <div className="flex gap-2">
                                                                                        <button onClick={() => handleDoctorComment(l.id)} disabled={saving || !doctorComment.trim()} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-medium hover:bg-indigo-700 disabled:opacity-50">
                                                                                            Save
                                                                                        </button>
                                                                                        <button onClick={() => { setCommentingLabId(null); setDoctorComment(""); }} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200">
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

                            {activeTab === "refs" && (
                                <div className="grid gap-4">
                                    {refList.length === 0 ? (
                                        <div className="flex flex-col items-center py-16 gap-3 text-gray-300 bg-white rounded-3xl border border-gray-100">
                                            <UserCheck className="w-10 h-10" />
                                            <p className="text-sm text-gray-400 font-medium">No referrals on record</p>
                                        </div>
                                    ) : refList.map((r: any) => (
                                        <div key={r.id} className={`bg-white rounded-2xl border ${r.status === 'pending' && r.to_doctor_id === myDoctorId ? 'border-indigo-200 ring-2 ring-indigo-50 shadow-lg' : 'border-gray-100 shadow-sm'} p-5 transition-all`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                        <UserCheck className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className={`text-[10px] font-black uppercase tracking-widest ${
                                                            r.status === 'accepted' ? 'text-emerald-500' :
                                                            r.status === 'pending' ? 'text-indigo-500' : 'text-gray-400'
                                                        }`}>{r.status}</p>
                                                        <p className="text-[11px] font-black text-slate-400 mt-0.5 uppercase tracking-tighter">Case Ref ID: #{r.id}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(r.created_at).toLocaleDateString()}</span>
                                                    <div className="bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                                                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">{r.urgency}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4">
                                                <p className="text-sm font-bold text-slate-800 leading-relaxed italic">"{r.reason}"</p>
                                            </div>
                                            
                                            {r.status === 'pending' && r.to_doctor_id === myDoctorId && (
                                                <div className="flex gap-2 pt-4 border-t border-slate-50">
                                                    <button 
                                                        onClick={() => handleAcceptReferral(r.id)}
                                                        disabled={saving}
                                                        className="flex-1 py-3 bg-indigo-600 text-[10px] font-black text-white uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                                                    >
                                                        Accept Referral
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                setSaving(true);
                                                                await referrals.reject(r.id);
                                                                showToast("Referral declined.");
                                                                fetchData();
                                                            } catch (e) { showToast("Failed to reject", false); }
                                                            finally { setSaving(false); }
                                                        }}
                                                        disabled={saving}
                                                        className="px-6 py-3 bg-white border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-xl hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all disabled:opacity-50"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === "nursing" && (
                                <div className="space-y-8">
                                    {nurseLogs.length === 0 ? (
                                        <div className="flex flex-col items-center py-16 gap-3 text-gray-300 bg-white rounded-3xl border border-gray-100">
                                            <ClipboardList className="w-10 h-10" />
                                            <p className="text-sm text-gray-400 font-medium">No clinical notes yet</p>
                                        </div>
                                    ) : (
                                        <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-gray-200 before:rounded-full">
                                            {nurseLogs.map((log: any, idx: number) => (
                                                <div key={idx} className="relative">
                                                    <div className={`absolute -left-[22px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                                                        log.action_type === 'vitals_recorded' ? 'bg-blue-500' :
                                                        log.action_type === 'patient_escalated' ? 'bg-rose-500' :
                                                        log.action_type === 'medication_administered' ? 'bg-emerald-500' : 'bg-gray-400'
                                                    }`} />
                                                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-500 capitalize">{log.action_type?.replace(/_/g, ' ')}</p>
                                                                <p className="text-xs font-semibold text-gray-800 mt-0.5">RN. {log.nurse_name || "Nurse"}</p>
                                                            </div>
                                                            <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                                                        </div>
                                                        <div className="bg-gray-50 rounded-xl p-3">
                                                            <p className="text-sm text-gray-700">{log.note_content || log.details}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "chats" && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Coordination</h2>
                                            <p className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Secure Channel: {getName(patient)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                        <div className="lg:col-span-3">
                                            <ChatBox 
                                                currentUser={`Dr. ${me?.full_name || "Doctor"}`} 
                                                recipientName={getName(patient)} 
                                                consultationId={Number(activeChatId) || patient?.id || Number(id)}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm border-b-4 border-b-indigo-500">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                                        <MessageCircle className="w-5 h-5 shadow-sm" />
                                                    </div>
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chat Context</h4>
                                                </div>
                                                
                                                <div className="space-y-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                            <User2 className="w-4 h-4 shadow-sm" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Active Provider</p>
                                                            <p className="text-xs font-black text-slate-900">Dr. {me?.full_name}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3 text-emerald-600">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shadow-sm">
                                                            <BadgeCheck className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black opacity-60 uppercase tracking-tight">Clinical Access</p>
                                                            <p className="text-xs font-black">Authorized</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-6 bg-slate-900 rounded-[32px] text-white shadow-xl">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <AlertTriangle className="w-5 h-5 text-indigo-300" />
                                                    <h4 className="text-[9px] font-black text-indigo-300 uppercase tracking-widest text-indigo-400">Compliance</h4>
                                                </div>
                                                <p className="text-[11px] font-medium leading-relaxed text-indigo-100 opacity-60 italic">
                                                    "All communication is recorded for clinical oversight. Maintain HIPAA standards."
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                <aside className="w-80 bg-white border-l border-slate-200 hidden xl:flex flex-col shrink-0 overflow-y-auto no-scrollbar">
                    <div className="p-8 space-y-10">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-indigo-600 rounded-full" />
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Context</h3>
                            </div>
                            <div className="grid gap-3">
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-[28px]">
                                    <div className="flex items-center gap-3 mb-2"><AlertCircle className="w-4 h-4 text-rose-500" /><span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Safety Alerts</span></div>
                                    <p className="text-[11px] font-bold text-rose-900 leading-relaxed italic">{patient?.allergies || "No drug sensitivities reported."}</p>
                                </div>
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-[28px]">
                                    <div className="flex items-center gap-3 mb-2"><TrendingUp className="w-4 h-4 text-blue-500" /><span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Biometrics</span></div>
                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        <div className="bg-white/50 p-2 rounded-xl"><p className="text-[8px] font-black text-slate-400 uppercase">GRP</p><p className="text-sm font-black text-slate-900">{bloodGroup}</p></div>
                                        <div className="bg-white/50 p-2 rounded-xl"><p className="text-[8px] font-black text-slate-400 uppercase">GEN</p><p className="text-sm font-black text-slate-900">{patient?.genotype || "AA"}</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            <AnimatePresence>
                {activeModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setModal(null)} />
                        <motion.div initial={{ y: 20, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.98 }} className="relative bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden">
                            <div className={`p-6 bg-gradient-to-r ${ACTIONS.find(a => a.id === activeModal)?.color || "from-slate-500 to-slate-600"} text-white`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                            {(() => { const A = ACTIONS.find(a => a.id === activeModal); return A ? <A.icon className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />; })()}
                                        </div>
                                        <h2 className="text-xl font-bold">{ACTIONS.find(a => a.id === activeModal)?.label || "Discharge"}</h2>
                                    </div>
                                    <button onClick={() => setModal(null)} className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                                {activeModal === "prescribe" && (
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-gray-500">Added Medications</p>
                                            {(form.items || []).length === 0 ? (
                                                <div className="p-6 border-2 border-dashed border-gray-100 rounded-2xl text-center text-gray-400 text-sm">No medications added</div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {form.items.map((item: any, idx: number) => (
                                                        <div key={idx} className="bg-gray-50 p-3 rounded-xl flex justify-between items-center">
                                                            <div>
                                                                <p className="font-medium text-gray-900">{item.drug_name}</p>
                                                                <p className="text-xs text-gray-500">{item.dosage} · {item.frequency} · {item.duration}</p>
                                                            </div>
                                                            <button onClick={() => { const cur = [...form.items]; cur.splice(idx, 1); sf("items", cur); }} className="text-red-400 hover:text-red-600">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input type="text" placeholder="Search medicine..." className="w-full bg-white border border-gray-200 rounded-xl p-3 pl-9 text-sm outline-none focus:border-indigo-300" value={searchingDrug} onChange={e => setSearchingDrug(e.target.value)} />
                                                {searchingDrug && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-10 max-h-48 overflow-y-auto">
                                                        {inventory.filter(i => i.name.toLowerCase().includes(searchingDrug.toLowerCase())).slice(0, 5).map(item => (
                                                            <button key={item.id} onClick={() => { sf("medication", item.name); sf("unit_price", item.unit_price); sf("is_internal", true); sf("inventory_item_id", item.id); setSearchingDrug(""); }} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between text-sm border-b border-gray-50 last:border-0">
                                                                <span>{item.name}</span>
                                                                <span className="text-gray-400">₦{item.unit_price}</span>
                                                            </button>
                                                        ))}
                                                        <button onClick={() => { sf("medication", searchingDrug); sf("is_internal", false); sf("unit_price", 0); setSearchingDrug(""); }} className="w-full px-4 py-2 text-left text-indigo-600 text-sm hover:bg-gray-50">Add "{searchingDrug}"</button>
                                                    </div>
                                                )}
                                            </div>

                                            {form.medication && (
                                                <div className="space-y-3 animate-in fade-in">
                                                    <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-gray-100">
                                                        <Pill className="w-4 h-4 text-indigo-500" />
                                                        <span className="text-sm font-medium">{form.medication}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input placeholder="Dosage" className="bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-300" value={form.dosage || ""} onChange={e => sf("dosage", e.target.value)} />
                                                        <input placeholder="Frequency" className="bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-300" value={form.frequency || ""} onChange={e => sf("frequency", e.target.value)} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input placeholder="Duration" className="bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-300" value={form.duration || ""} onChange={e => sf("duration", e.target.value)} />
                                                        <input type="number" placeholder="Qty" className="bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-300" value={form.quantity || 1} onChange={e => sf("quantity", parseInt(e.target.value) || 1)} />
                                                    </div>
                                                    <button onClick={() => {
                                                        if (!form.dosage || !form.frequency) return showToast("Complete dosage and frequency", false);
                                                        const newItem = { drug_name: form.medication, dosage: form.dosage, frequency: form.frequency, duration: form.duration || "unspecified", quantity: form.quantity || 1, unit_price: form.unit_price || 0, is_internal: !!form.is_internal, inventory_item_id: form.inventory_item_id };
                                                        sf("items", [...(form.items || []), newItem]);
                                                        sf("medication", ""); sf("dosage", ""); sf("frequency", ""); sf("duration", ""); sf("quantity", 1); sf("is_internal", false); sf("inventory_item_id", null);
                                                    }} className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                                                        Add to Prescription
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Clinical Notes</label>
                                            <textarea rows={2} placeholder="Instructions for pharmacist..." className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-300" value={form.instructions || ""} onChange={e => sf("instructions", e.target.value)} />
                                        </div>
                                    </div>
                                )}

                                {activeModal === "lab" && (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 mb-2">Select Tests</p>
                                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                                {catalog.map(c => (
                                                    <button key={c.id} onClick={() => { const cur = form.test_names || []; sf("test_names", cur.includes(c.name) ? cur.filter((n: string) => n !== c.name) : [...cur, c.name]); }} className={`p-3 rounded-xl border text-xs font-medium transition-all text-center ${form.test_names?.includes(c.name) ? "bg-amber-600 border-amber-600 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-amber-200"}`}>
                                                        {c.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Other Test</label>
                                            <input type="text" placeholder="Type test name..." className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-300" value={form.test_name || ""} onChange={e => sf("test_name", e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Clinical Indication</label>
                                            <textarea rows={2} placeholder="Reason for investigation..." className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-300" value={form.notes || ""} onChange={e => sf("notes", e.target.value)} />
                                        </div>
                                    </div>
                                )}

                                {activeModal === "consult" && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Chief Complaint *</label>
                                            <input type="text" placeholder="Primary issue..." className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-300" value={form.chief_complaint || ""} onChange={e => sf("chief_complaint", e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Diagnosis *</label>
                                            <textarea rows={2} placeholder="Clinical assessment..." className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-300" value={form.diagnosis || ""} onChange={e => sf("diagnosis", e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Treatment Plan</label>
                                            <textarea rows={2} placeholder="Proposed interventions..." className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-300" value={form.treatment_plan || ""} onChange={e => sf("treatment_plan", e.target.value)} />
                                        </div>
                                    </div>
                                )}

                                {activeModal === "admit" && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 mb-1 block">Select Bed *</label>
                                        <select className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-300" value={form.bed_id || ""} onChange={e => sf("bed_id", e.target.value)}>
                                            <option value="">Select Bed</option>
                                            {availBeds.map((b: any) => <option key={b.id} value={b.id}>Bed {b.bed_number} - {b.ward_name}</option>)}
                                        </select>
                                    </div>
                                )}

                                {activeModal === "refer" && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Refer To *</label>
                                            <select className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-300" value={form.referred_doctor_id || ""} onChange={e => sf("referred_doctor_id", e.target.value)}>
                                                <option value="">Select Doctor</option>
                                                {otherDocs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Urgency</label>
                                            <select className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-300" value={form.urgency || "routine"} onChange={e => sf("urgency", e.target.value)}>
                                                <option value="routine">Routine</option>
                                                <option value="urgent">Urgent</option>
                                                <option value="emergency">Emergency</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Reason *</label>
                                            <textarea rows={2} placeholder="Clinical grounds..." className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-300" value={form.reason || ""} onChange={e => sf("reason", e.target.value)} />
                                        </div>
                                    </div>
                                )}

                                {activeModal === "directive" && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Directive *</label>
                                            <textarea rows={2} placeholder="e.g., Administer 500mg IV Paracetamol every 6h..." className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-300" value={form.instruction || ""} onChange={e => sf("instruction", e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-2 block">Urgency</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['routine', 'urgent', 'stat'].map(u => (
                                                    <button key={u} onClick={() => sf("urgency", u)} className={`py-2 rounded-xl text-xs font-medium border transition-all ${form.urgency === u ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200'}`}>
                                                        {u}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Physician Notes</label>
                                            <textarea rows={2} placeholder="Specific instructions..." className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-indigo-300" value={form.doctor_notes || ""} onChange={e => sf("doctor_notes", e.target.value)} />
                                        </div>
                                    </div>
                                )}

                                {activeModal === "discharge" && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-[28px] flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 font-black"><AlertTriangle className="w-6 h-6" /></div>
                                            <div>
                                                <p className="text-[10px] font-black text-rose-600 uppercase">Discharge Confirmation</p>
                                                <p className="text-xs font-bold text-rose-900 leading-tight">Proceeding with formal discharge. This will free up the assigned bed.</p>
                                            </div>
                                        </div>
                                        <LF l="Discharge Summary & Instructions *">
                                            <LT 
                                                placeholder="Enter final clinical assessment, post-discharge medication, and follow-up instructions..." 
                                                v={form.discharge_summary} 
                                                s={(v: string) => sf("discharge_summary", v)} 
                                                rows={6}
                                            />
                                        </LF>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 border-t border-slate-50 bg-slate-50 flex gap-4">
                                <button 
                                    className="flex-1 bg-slate-900 text-white h-16 rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50" 
                                    onClick={activeModal === "discharge" ? submitDischarge : handleSubmit} 
                                    disabled={saving}
                                >
                                    {saving ? "Processing..." : activeModal === "discharge" ? "Complete Discharge" : "Submit Request"}
                                </button>
                                <button className="px-8 bg-white text-slate-500 h-16 rounded-3xl font-black uppercase tracking-widest text-[11px] border border-slate-200 hover:bg-slate-100 transition-all active:scale-95" onClick={() => setModal(null)}>
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

const LF = ({ l, children }: any) => (
    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">{l}</label>{children}</div>
);
const LT = ({ v, s, placeholder, rows = 3 }: any) => (
    <textarea rows={rows} placeholder={placeholder} value={v || ""} onChange={e => s(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 resize-none" />
);