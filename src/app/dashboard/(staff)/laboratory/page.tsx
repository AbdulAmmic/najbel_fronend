"use client";

import { useState, useEffect, Fragment } from "react";
import {
    Activity,
    Search,
    Filter,
    CheckCircle,
    Clock,
    TestTube,
    Microscope,
    FileText,
    AlertCircle,
    Plus,
    X,
    Printer,
    ArrowLeft,
    Lock,
    Unlock,
    ChevronRight,
    Download,
    Send,
    Shield,
    Bed
} from "lucide-react";
import { labs, users } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useWebSocket } from "@/contexts/WebSocketContext";


const LAB_TEMPLATES: Record<string, any[]> = {
    "CBC": [
        { parameter: "White Blood Cells (WBC)", result: "", unit: "10^9/L", reference: "4.0 - 11.0" },
        { parameter: "Red Blood Cells (RBC)", result: "", unit: "10^12/L", reference: "4.5 - 5.5" },
        { parameter: "Hemoglobin (HGB)", result: "", unit: "g/dL", reference: "13.0 - 17.0" },
        { parameter: "Hematocrit (HCT)", result: "", unit: "%", reference: "40 - 50" },
        { parameter: "Mean Corpuscular Vol (MCV)", result: "", unit: "fL", reference: "80 - 100" },
        { parameter: "Platelets (PLT)", result: "", unit: "10^9/L", reference: "150 - 450" },
    ],
    "FBC": [
        { parameter: "White Blood Cells (WBC)", result: "", unit: "10^9/L", reference: "4.0 - 11.0" },
        { parameter: "Red Blood Cells (RBC)", result: "", unit: "10^12/L", reference: "4.5 - 5.5" },
        { parameter: "Hemoglobin (HGB)", result: "", unit: "g/dL", reference: "13.0 - 17.0" },
        { parameter: "Hematocrit (HCT)", result: "", unit: "%", reference: "40 - 50" },
        { parameter: "Platelets (PLT)", result: "", unit: "10^9/L", reference: "150 - 450" },
    ],
    "Lipid Profile": [
        { parameter: "Total Cholesterol", result: "", unit: "mg/dL", reference: "< 200" },
        { parameter: "Triglycerides", result: "", unit: "mg/dL", reference: "< 150" },
        { parameter: "HDL Cholesterol", result: "", unit: "mg/dL", reference: "> 40" },
        { parameter: "LDL Cholesterol", result: "", unit: "mg/dL", reference: "< 130" },
    ],
    "Urinalysis": [
        { parameter: "Color", result: "", unit: "", reference: "Pale Yellow" },
        { parameter: "Appearance", result: "", unit: "", reference: "Clear" },
        { parameter: "Specific Gravity", result: "", unit: "", reference: "1.005 - 1.030" },
        { parameter: "pH", result: "", unit: "", reference: "5.0 - 8.0" },
        { parameter: "Protein", result: "", unit: "", reference: "Negative" },
        { parameter: "Glucose", result: "", unit: "", reference: "Negative" },
    ],
    "Malaria MP": [
        { parameter: "Parasite seen", result: "", unit: "", reference: "Negative" },
        { parameter: "Density", result: "", unit: "per ul", reference: "-" },
    ],
    "Widal": [
        { parameter: "Salmonella Typhi O", result: "", unit: "Titre", reference: "< 1:80" },
        { parameter: "Salmonella Typhi H", result: "", unit: "Titre", reference: "< 1:80" },
    ],
    "FBS": [
        { parameter: "Fasting Blood Sugar (FBS)", result: "", unit: "mmol/L", reference: "3.9 - 6.1" },
    ],
    "Sugar": [
        { parameter: "Random Blood Sugar", result: "", unit: "mmol/L", reference: "3.9 - 11.0" },
    ]
};

export default function LaboratoryPage() {
    const [activeTab, setActiveTab] = useState<'pending' | 'processing' | 'validation' | 'history'>('pending');
    const [labResults, setLabResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [expandedItem, setExpandedItem] = useState<number | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const { lastMessage } = useWebSocket();

    // Action Modal State
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionData, setActionData] = useState<any>({});

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        patient_id: "",
        test_name: "",
        priority: "normal", // normal, urgent
        notes: ""
    });

    // History Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyPatient, setHistoryPatient] = useState<any>(null);
    const [patientHistory, setPatientHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [expandedHistoryItem, setExpandedHistoryItem] = useState<number | null>(null);

    // Role Protection
    useEffect(() => {
        const user = users.getMeSync();
        if (user && (user.role === 'doctor' || user.role === 'patient')) {
            router.push(`/dashboard/${user.role === 'doctor' ? 'Doctor' : 'Patient'}`);
        }
    }, [router]);

    const fetchLabs = async () => {
        try {
            const data = await labs.getAll();
            setLabResults(data);
        } catch (error) {
            console.error("Failed to load lab results", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabs();

        // Check params
        const patientId = searchParams.get('patient_id');
        if (patientId) {
            setCreateForm(prev => ({ ...prev, patient_id: patientId }));
            setIsCreateModalOpen(true);
        }
        const tab = searchParams.get('tab');
        if (tab && ['pending', 'processing', 'validation', 'history'].includes(tab)) {
            setActiveTab(tab as any);
        }
    }, [searchParams]);

    useEffect(() => {
        if (lastMessage && lastMessage.includes('lab')) { // Assuming 'lab' in message
            fetchLabs();
        }
    }, [lastMessage]);

    const handleUpdateStatus = async (status: string, additionalData: any = {}) => {
        if (!selectedItem) return;
        try {
            setLoading(true);
            const results = JSON.stringify(actionData.result_data);
            await labs.update(selectedItem.id, {
                status,
                result: actionData.result || "",
                notes: actionData.notes || "",
                result_data: results,
                ...additionalData
            });
            fetchLabs();
            setIsActionModalOpen(false);
            setSelectedItem(null);
            setActionData({});
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async () => {
        if (!createForm.patient_id || !createForm.test_name) {
            alert("Please fill in Patient ID and Test Name");
            return;
        }
        try {
            await labs.create({
                patient_id: parseInt(createForm.patient_id),
                test_name: createForm.test_name,
                priority: createForm.priority,
                status: 'requested',
                notes: createForm.notes
            });
            setIsCreateModalOpen(false);
            setCreateForm({ patient_id: "", test_name: "", priority: "normal", notes: "" });
            router.replace('/dashboard/laboratory');
            fetchLabs();
        } catch (e) {
            console.error("Failed to create lab request", e);
            alert("Failed to create lab request");
        }
    };

    const handleOpenHistory = async (patient: any) => {
        if (!patient) return;
        setHistoryPatient(patient);
        setIsHistoryModalOpen(true);
        setLoadingHistory(true);
        try {
            const data = await labs.getResultsByPatient(patient.id);
            // Only show validated results in history
            setPatientHistory((data || []).filter((r: any) => r.status === 'validated' || r.status === 'completed'));
        } catch (e) {
            console.error("Failed to load patient history", e);
        } finally {
            setLoadingHistory(false);
        }
    };

    const openActionModal = (item: any) => {
        setSelectedItem(item);
        if (activeTab === 'processing') {
            let initialData = [];
            if (item.result_data) {
                initialData = JSON.parse(item.result_data);
            } else {
                // Try to find a template
                const templateKey = Object.keys(LAB_TEMPLATES).find(k => 
                    item.test_name.toUpperCase().includes(k.toUpperCase())
                );
                initialData = templateKey ? [...LAB_TEMPLATES[templateKey]] : [{ parameter: item.test_name, result: "", unit: item.units || "", reference: item.reference_range || "" }];
            }
            setActionData({ 
                result_data: initialData, 
                result: item.result || "",
                notes: item.notes || ""
            });
        } else {
            setActionData({});
        }
        setIsActionModalOpen(true);
    };

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

    // Filter & Sort Logic
    const sortedResults = [...labResults]
        .filter(r => {
            if (activeTab === 'pending') return r.status === 'requested';
            if (activeTab === 'processing') return r.status === 'sample_collected' || r.status === 'processing';
            if (activeTab === 'validation') return r.status === 'completed';
            if (activeTab === 'history') return r.status === 'validated';
            return false;
        })
        .sort((a, b) => {
            // 1. Urgent first
            if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
            if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;

            // 2. Status priority
            const statusOrder: Record<string, number> = {
                'validated': 5,
                'completed': 4,
                'processing': 3,
                'sample_collected': 2,
                'requested': 1
            };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
                return statusOrder[b.status] - statusOrder[a.status];
            }

            // 3. Newest first
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

    const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
    const paginatedResults = sortedResults.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page on tab change
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'requested': return 'bg-slate-100 text-slate-500 border border-slate-200';
            case 'sample_collected': return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
            case 'processing': return 'bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100';
            case 'completed': return 'bg-amber-50 text-amber-600 border border-amber-100';
            case 'validated': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading Laboratory System...</div>;

    return (
        <div className="p-6 max-w-[1800px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Laboratory Information System</h1>
                    <p className="text-gray-500 mt-2">Manage test requests, sample tracking, and result validation</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
                >
                    <Plus className="w-5 h-5" />
                    New Request
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow group">
                    <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        <Clock className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending</p>
                        <p className="text-3xl font-black text-slate-900 leading-tight">{labResults.filter(r => r.status === 'requested').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow group">
                    <div className="h-14 w-14 bg-fuchsia-50 text-fuchsia-600 rounded-2xl flex items-center justify-center group-hover:bg-fuchsia-600 group-hover:text-white transition-all duration-300">
                        <TestTube className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Processing</p>
                        <p className="text-3xl font-black text-slate-900 leading-tight">{labResults.filter(r => ['sample_collected', 'processing'].includes(r.status)).length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow group">
                    <div className="h-14 w-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                        <Microscope className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">To Release</p>
                        <p className="text-3xl font-black text-slate-900 leading-tight">{labResults.filter(r => r.status === 'completed').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow group">
                    <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                        <CheckCircle className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Validated</p>
                        <p className="text-3xl font-black text-slate-900 leading-tight">{labResults.filter(r => r.status === 'validated').length}</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-gray-100">
                    <div className="flex gap-8 px-8">
                        {['pending', 'processing', 'validation', 'history'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    } capitalize`}
                            >
                                {tab.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Test Info</th>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lab ID</th>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Patient</th>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Doctor</th>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Priority</th>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                <th className="px-8 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedResults.map((item: any) => (
                                <Fragment key={item.id}>
                                    <tr className="hover:bg-gray-50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                                <TestTube className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.test_name}</div>
                                                <div className="text-[10px] font-mono text-gray-400 mt-0.5">INTERNAL REF: {item.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="px-3 py-1 bg-blue-50/50 border border-blue-100 rounded-lg inline-flex flex-col items-center">
                                            <div className="text-[10px] font-black text-blue-400 uppercase leading-none">ID CODE</div>
                                            <div className="text-sm font-black text-blue-700 font-mono tracking-widest">{item.short_id}</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-between group/row">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm text-gray-900 font-bold">{item.patient?.user?.full_name || `Patient #${item.patient_id}`}</div>
                                                    {item.patient?.is_admitted && (
                                                        <div className="px-1.5 py-0.5 bg-rose-50 text-[8px] font-black text-rose-600 border border-rose-100 rounded-md flex items-center gap-1 shrink-0 animate-pulse">
                                                            <Bed className="w-2 h-2" />
                                                            BED
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-gray-400">UID: P-{item.patient_id}</div>
                                            </div>
                                            <button 
                                                onClick={() => handleOpenHistory(item.patient)}
                                                className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-1.5"
                                                title="View Patient History"
                                            >
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-black uppercase">History</span>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div>
                                            <div className="text-sm text-gray-900 font-bold">Dr. {item.doctor?.user?.full_name || "N/A"}</div>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Requesting Physician</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1.5 items-start">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${getStatusColor(item.status)}`}>
                                                {item.status.replace('_', ' ')}
                                            </span>
                                            {item.invoice && (
                                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border ${
                                                    item.invoice.status === 'paid' 
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                        : 'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                    {item.invoice.status === 'paid' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                                    {item.invoice.status === 'paid' ? 'Paid & Ready' : 'Awaiting Payment'}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <button 
                                            onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                                            className="group flex flex-col items-start"
                                        >
                                            <div className="flex items-center gap-1">
                                                {item.priority === 'urgent' ? (
                                                    <div className="animate-pulse flex items-center gap-1 text-rose-600">
                                                        <AlertCircle className="w-4 h-4 fill-rose-50" />
                                                        <span className="text-[10px] font-black uppercase">CRITICAL</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Normal</span>
                                                )}
                                                {['history', 'validation'].includes(activeTab) && (
                                                    <div className={`transition-transform duration-200 ${expandedItem === item.id ? 'rotate-180' : ''}`}>
                                                        <ChevronRight className="w-3 h-3 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="text-xs text-gray-900 font-bold">
                                            {item.validated_at ? new Date(item.validated_at).toLocaleDateString("en-GB") : 
                                             new Date(item.recorded_at).toLocaleDateString("en-GB")}
                                        </div>
                                        <div className="text-[10px] text-gray-400">
                                            {new Date(item.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2 text-xs font-bold uppercase tracking-tight">
                                            {activeTab === 'pending' && (
                                                <button
                                                    onClick={() => openActionModal(item)}
                                                    disabled={item.invoice && item.invoice.status !== 'paid'}
                                                    className={`px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
                                                        item.invoice && item.invoice.status !== 'paid' 
                                                            ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
                                                            : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200'
                                                    }`}
                                                >
                                                    {item.invoice && item.invoice.status !== 'paid' ? <Lock className="w-4 h-4" /> : <TestTube className="w-4 h-4" />}
                                                    Collect Sample
                                                    <ChevronRight className="w-3 h-3" />
                                                </button>
                                            )}
                                            {activeTab === 'processing' && (
                                                <button
                                                    onClick={() => openActionModal(item)}
                                                    className="px-4 py-2 bg-fuchsia-600 border-2 border-fuchsia-600 text-white rounded-xl hover:bg-fuchsia-700 hover:shadow-lg hover:shadow-fuchsia-200 transition-all flex items-center gap-2"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    Record Data
                                                </button>
                                            )}
                                            {activeTab === 'validation' && (
                                                <button
                                                    onClick={() => openActionModal(item)}
                                                    className="px-4 py-2 bg-amber-500 border-2 border-amber-500 text-white rounded-xl hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-200 transition-all flex items-center gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Validate & Send
                                                </button>
                                            )}
                                            {activeTab === 'history' && (
                                                <button 
                                                    onClick={() => handlePrint(item)}
                                                    className="px-4 py-2 bg-slate-800 border-2 border-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all flex items-center gap-2"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                    Print Report
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                {expandedItem === item.id && ['history', 'validation'].includes(activeTab) && (
                                    <tr className="bg-slate-50/50">
                                        <td colSpan={6} className="px-8 py-6">
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                                            >
                                                <div className="p-4 bg-slate-900 flex justify-between items-center text-white">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                                            <FileText className="w-4 h-4 text-white" />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{activeTab === 'validation' ? 'Validation Preview' : 'Result History'}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase">Patient Name</p>
                                                        <p className="text-[10px] font-bold">{item.patient?.user?.full_name || item.patient?.full_name || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                <div className="p-6">
                                                    <table className="w-full text-xs text-left">
                                                        <thead className="bg-slate-50 border-b border-slate-100">
                                                            <tr>
                                                                <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[10px]">Parameter</th>
                                                                <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">Result</th>
                                                                <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">Unit</th>
                                                                <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Reference</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {(item.result_data && item.result_data.startsWith('[') ? JSON.parse(item.result_data) : []).map((r: any, idx: number) => (
                                                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                                                    <td className="px-4 py-3 font-bold text-slate-700">{r.parameter}</td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-black rounded-lg text-sm">{r.result}</span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center text-slate-500 font-semibold uppercase">{r.unit || '-'}</td>
                                                                    <td className="px-4 py-3 text-slate-400 text-right">
                                                                        {r.reference ? <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-500 border border-slate-200">{r.reference}</span> : '-'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    
                                                    <div className="mt-6 flex justify-between items-center border-t border-slate-100 pt-6">
                                                        <div className="flex items-center gap-4">
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Laboratory Scientist</p>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase">
                                                                        {(item.validator?.full_name || 'LS')[0]}
                                                                    </div>
                                                                    <p className="text-xs font-bold text-slate-900">{item.validator?.full_name || 'Verification Pending'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {activeTab === 'history' && (
                                                            <button 
                                                                onClick={() => handlePrint(item)}
                                                                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                                            >
                                                                <Printer className="w-4 h-4" />
                                                                Print Lab Report
                                                            </button>
                                                        )}
                                                        {activeTab === 'validation' && (
                                                            <button 
                                                                onClick={() => openActionModal(item)}
                                                                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-black hover:bg-amber-600 transition-all shadow-lg active:scale-95"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                                Validate This Result
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </td>
                                    </tr>
                                )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Showing <span className="text-blue-600">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-blue-600">{Math.min(currentPage * itemsPerPage, sortedResults.length)}</span> of {sortedResults.length} tests
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    currentPage === 1 
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                        : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-blue-400 hover:text-blue-600 shadow-sm'
                                }`}
                            >
                                Previous
                            </button>
                            <div className="flex gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                                            currentPage === i + 1
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                                : 'bg-white border-2 border-slate-50 text-slate-400 hover:border-slate-200'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    currentPage === totalPages 
                                        ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                                        : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-blue-400 hover:text-blue-600 shadow-sm'
                                }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dynamic Action Modal (Process/Result/Validate) */}
            <AnimatePresence>
                {isActionModalOpen && selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {activeTab === 'pending' ? 'Sample Collection' :
                                        activeTab === 'processing' ? 'Laboratory Analysis' :
                                            'Result Validation'}
                                </h3>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(selectedItem.status)}`}>
                                    {selectedItem.status}
                                </div>
                            </div>

                            {/* Collection Form */}
                            {activeTab === 'pending' && (
                                <div className="space-y-6">
                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                        <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Test for</p>
                                        <p className="text-sm font-black text-indigo-900 uppercase">{selectedItem.test_name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Assign Sample ID / Barcode</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                autoFocus
                                                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold text-lg transition-all"
                                                placeholder="e.g. LAB-2024-001"
                                                onChange={(e) => setActionData({ ...actionData, sample_id: e.target.value })}
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                                                <TestTube className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUpdateStatus('sample_collected', { sample_id: actionData.sample_id, status: 'processing' })}
                                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Unlock className="w-5 h-5" />
                                        Initialize Analysis
                                    </button>
                                </div>
                            )}

                            {/* Result Entry Form */}
                            {activeTab === 'processing' && (
                                <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Investigation</div>
                                            <div className="text-xs font-bold text-slate-900">{selectedItem.test_name}</div>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Technician</div>
                                            <div className="text-xs font-bold text-slate-900">Entering Results...</div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-3xl border border-slate-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">General Clinical Conclusion</div>
                                            <span className="text-[9px] font-bold text-slate-300">Displayed as main result</span>
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder="e.g. Normal, Reactive, Positive, 4.0 mmol/L..."
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                            value={actionData.result || ""}
                                            onChange={e => setActionData({...actionData, result: e.target.value})}
                                        />
                                    </div>

                                    <button 
                                        onClick={() => handleOpenHistory(selectedItem.patient)}
                                        className="w-full py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all mb-2 flex items-center justify-center gap-2"
                                    >
                                        <Clock className="w-4 h-4" />
                                        Compare with Patient History
                                    </button>

                                    {actionData.result_data?.map((row: any, index: number) => (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={index} 
                                            className="p-5 bg-white border-2 border-slate-50 rounded-2xl space-y-4 relative group hover:border-fuchsia-100 transition-all"
                                        >
                                            {actionData.result_data.length > 1 && (
                                                <button 
                                                    onClick={() => {
                                                        const newData = [...actionData.result_data];
                                                        newData.splice(index, 1);
                                                        setActionData({...actionData, result_data: newData});
                                                    }}
                                                    className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-rose-500 bg-slate-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Parameter</label>
                                                    <input
                                                        type="text"
                                                        value={row.parameter}
                                                        className="w-full text-sm font-bold text-slate-700 bg-slate-50 border-none focus:ring-2 ring-fuchsia-500/20 rounded-xl px-3 py-2 outline-none transition-all"
                                                        onChange={(e) => {
                                                            const newData = [...actionData.result_data];
                                                            newData[index].parameter = e.target.value;
                                                            setActionData({...actionData, result_data: newData});
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Value</label>
                                                    <input
                                                        type="text"
                                                        value={row.result || ""}
                                                        autoFocus={index === actionData.result_data.length - 1}
                                                        className="w-full text-sm font-black text-fuchsia-600 bg-fuchsia-50 border-none focus:ring-2 ring-fuchsia-500/20 rounded-xl px-3 py-2 outline-none transition-all"
                                                        onChange={(e) => {
                                                            const newData = [...actionData.result_data];
                                                            newData[index].result = e.target.value;
                                                            setActionData({...actionData, result_data: newData});
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Unit</label>
                                                    <input
                                                        type="text"
                                                        value={row.unit}
                                                        placeholder="e.g. g/dL"
                                                        className="w-full text-xs font-medium text-slate-500 bg-slate-50 border-none focus:ring-2 ring-fuchsia-500/20 rounded-xl px-3 py-1.5 outline-none transition-all"
                                                        onChange={(e) => {
                                                            const newData = [...actionData.result_data];
                                                            newData[index].unit = e.target.value;
                                                            setActionData({...actionData, result_data: newData});
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Normal Range</label>
                                                    <input
                                                        type="text"
                                                        value={row.reference}
                                                        placeholder="e.g. 11.5 - 16.0"
                                                        className="w-full text-xs font-medium text-slate-500 bg-slate-50 border-none focus:ring-2 ring-fuchsia-500/20 rounded-xl px-3 py-1.5 outline-none transition-all"
                                                        onChange={(e) => {
                                                            const newData = [...actionData.result_data];
                                                            newData[index].reference = e.target.value;
                                                            setActionData({...actionData, result_data: newData});
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}

                                    <button 
                                        onClick={() => setActionData({
                                            ...actionData, 
                                            result_data: [...actionData.result_data, { parameter: "", result: "", unit: "", reference: "" }]
                                        })}
                                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-fuchsia-200 hover:text-fuchsia-500 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Custom Column
                                    </button>

                                    <div className="space-y-3 pt-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Notes / Interpretation</label>
                                        <textarea
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none h-28 resize-none text-sm font-medium transition-all"
                                            placeholder="Enter specific clinical interpretation or scientist's remarks..."
                                            value={actionData.notes || ""}
                                            onChange={e => setActionData({ ...actionData, notes: e.target.value })}
                                        />
                                    </div>

                                    <button 
                                        onClick={() => handleUpdateStatus('completed')}
                                        className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                    >
                                        Submit for Validation
                                    </button>
                                </div>
                            )}

                            {/* Validation Confirmation */}
                            {activeTab === 'validation' && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Verifying Results for</p>
                                                <p className="text-xl font-black text-amber-900 leading-tight uppercase tracking-tight">{selectedItem.test_name}</p>
                                            </div>
                                            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-50">
                                                <Shield className="w-6 h-6" />
                                            </div>
                                        </div>

                                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-amber-100 text-xs shadow-sm">
                                            <table className="w-full">
                                                <thead className="bg-amber-100/50">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left font-black text-amber-700 text-[10px] uppercase">Parameter</th>
                                                        <th className="px-3 py-2 text-center font-black text-amber-700 text-[10px] uppercase">Value</th>
                                                        <th className="px-3 py-2 text-center font-black text-amber-700 text-[10px] uppercase">Unit</th>
                                                        <th className="px-3 py-2 text-right font-black text-amber-700 text-[10px] uppercase">Range</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-amber-50">
                                                    {(selectedItem.result_data && selectedItem.result_data.startsWith('[') ? JSON.parse(selectedItem.result_data) : []).map((r: any, idx: number) => (
                                                        <tr key={idx}>
                                                            <td className="px-3 py-2 text-amber-800 font-bold uppercase tracking-tight">{r.parameter}</td>
                                                            <td className="px-3 py-2 text-amber-900 font-black text-center">{r.result}</td>
                                                            <td className="px-3 py-2 text-amber-500 font-bold text-center">{r.unit || '-'}</td>
                                                            <td className="px-3 py-2 text-amber-400 text-right font-medium">{r.reference || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        <div className="p-4 bg-white/50 border border-amber-100 rounded-2xl">
                                            <p className="text-[10px] font-black text-amber-400 uppercase mb-1">Conclusion</p>
                                            <p className="text-sm font-bold text-amber-900">{selectedItem.result}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => handleUpdateStatus('validated')}
                                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-3"
                                        >
                                            <Send className="w-5 h-5" />
                                            Release to Doctor
                                        </button>
                                        <div className="px-6 text-center">
                                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                                                BY CLICKING RELEASE, RESULTS WILL BE IMMEDIATELY VISIBLE IN THE DOCTOR CONSOLE AND PATIENT PORTAL.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => setIsActionModalOpen(false)}
                                className="w-full mt-2 py-2 text-gray-500 hover:bg-gray-50 rounded-xl font-medium"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Request Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100"
                        >
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">New Lab Request</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manual Entry Portal</p>
                                </div>
                                <button 
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm transition-all text-slate-400 hover:text-rose-500"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Patient ID</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold transition-all"
                                                placeholder="UID"
                                                value={createForm.patient_id}
                                                onChange={e => setCreateForm({ ...createForm, patient_id: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Priority Level</label>
                                        <select
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold appearance-none transition-all"
                                            value={createForm.priority}
                                            onChange={e => setCreateForm({ ...createForm, priority: e.target.value })}
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Investigation Type</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold transition-all"
                                            placeholder="e.g. Full Blood Count, Malaria..."
                                            value={createForm.test_name}
                                            onChange={e => setCreateForm({ ...createForm, test_name: e.target.value })}
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                            <Search className="w-5 h-5 text-slate-300" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Indication / Notes</label>
                                    <textarea
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none h-28 resize-none font-medium transition-all"
                                        placeholder="Enter specific clinical requirements..."
                                        value={createForm.notes}
                                        onChange={e => setCreateForm({ ...createForm, notes: e.target.value })}
                                    />
                                </div>
                                <button
                                    onClick={handleCreateRequest}
                                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3"
                                >
                                    <Plus className="w-6 h-6" />
                                    Generate Lab Request
                                </button>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest"
                                >
                                    Discard Request
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Patient History Modal */}
            <AnimatePresence>
                {isHistoryModalOpen && historyPatient && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-8 bg-gradient-to-br from-indigo-600 to-blue-700 text-white relative">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="w-5 h-5 text-indigo-200" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Clinical Archive</span>
                                        </div>
                                        <h3 className="text-3xl font-black tracking-tight">{historyPatient.user?.full_name}</h3>
                                        <p className="text-indigo-100/70 text-sm font-medium mt-1 uppercase tracking-wider">Patient History Log · PID-{historyPatient.id}</p>
                                    </div>
                                    <button 
                                        onClick={() => setIsHistoryModalOpen(false)}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50">
                                {loadingHistory ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Retrieving Records...</p>
                                    </div>
                                ) : patientHistory.length === 0 ? (
                                    <div className="py-20 text-center space-y-4">
                                        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                                            <Clock className="w-10 h-10" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400">No previous validated tests found for this patient.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {patientHistory.map((h: any) => (
                                            <div key={h.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                                <div 
                                                    onClick={() => setExpandedHistoryItem(expandedHistoryItem === h.id ? null : h.id)}
                                                    className="p-6 flex items-center justify-between cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                            <TestTube className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{h.test_name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-bold text-slate-400">{new Date(h.created_at).toLocaleDateString()}</span>
                                                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                                <span className="text-[10px] font-black text-blue-500 uppercase">#{h.short_id}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{h.status}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">Dr. {h.validator?.full_name || 'System'}</p>
                                                        </div>
                                                        <div className={`transition-transform duration-300 ${expandedHistoryItem === h.id ? 'rotate-180' : ''}`}>
                                                            <ChevronRight className="w-5 h-5 text-slate-300" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {expandedHistoryItem === h.id && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="border-t border-slate-50 bg-slate-50/30 p-6 pt-0"
                                                        >
                                                            <div className="mt-4 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                                                                <table className="w-full text-left border-collapse">
                                                                    <thead>
                                                                        <tr className="bg-slate-50/50">
                                                                            <th className="px-4 py-2 font-black text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-100">Parameter</th>
                                                                            <th className="px-4 py-2 font-black text-slate-400 uppercase tracking-widest text-[9px] text-center border-b border-slate-100">Result</th>
                                                                            <th className="px-4 py-2 font-black text-slate-400 uppercase tracking-widest text-[9px] text-center border-b border-slate-100">Unit</th>
                                                                            <th className="px-4 py-2 font-black text-slate-400 uppercase tracking-widest text-[9px] text-right border-b border-slate-100">Range</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-50">
                                                                        {(h.result_data && h.result_data.startsWith('[') ? JSON.parse(h.result_data) : []).map((r: any, idx: number) => (
                                                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                                                <td className="px-4 py-2 font-bold text-slate-700 text-xs tracking-tight">{r.parameter}</td>
                                                                                <td className="px-4 py-2 text-center font-black text-indigo-600 text-sm tracking-tighter">{r.result}</td>
                                                                                <td className="px-4 py-2 text-center text-[10px] text-slate-500 font-bold uppercase">{r.unit || '-'}</td>
                                                                                <td className="px-4 py-2 text-right">
                                                                                    {r.reference ? <span className="bg-slate-100 px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-500 whitespace-nowrap">{r.reference}</span> : '-'}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            <div className="mt-4 flex justify-end">
                                                                <button 
                                                                    onClick={() => handlePrint(h)}
                                                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                                                                >
                                                                    <Printer className="w-4 h-4" />
                                                                    Reprint Original Report
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
                                <button 
                                    onClick={() => setIsHistoryModalOpen(false)}
                                    className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Close History
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
