"use client";

import { useState, useEffect } from "react";
import {
    Pill, Search, CheckCircle2, XCircle, DollarSign, AlertCircle,
    Clock, User2, ChevronRight, X, Send, RefreshCw, Stethoscope,
    Calendar, Package, User, Check, History, Layers, Bed
} from "lucide-react";
import { pharmacy as pharmacyService } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface PrescriptionItem {
    id: number;
    drug_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    unit_price: number;
    status: string;
    is_internal: boolean;
}

interface Prescription {
    id: number;
    patient_id: number;
    patient_name: string;
    doctor_name: string;
    status: string;
    created_at: string;
    updated_at: string;
    items: PrescriptionItem[];
    instructions?: string;
    clinical_notes?: string;
    is_admitted?: boolean;
}

export default function PharmacyPrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"queue" | "history">("queue");
    const [processing, setProcessing] = useState<number | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchRx = async () => {
        setLoading(true);
        try {
            const data = activeTab === "queue" 
                ? await pharmacyService.getQueue() 
                : await pharmacyService.getHistory();
            setPrescriptions(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Failed to fetch pharmacy data:", e);
            showToast("Failed to connect to pharmacy service.", false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRx(); }, [activeTab]);

    const handleDispenseItem = async (itemId: number) => {
        setProcessing(itemId);
        try {
            await pharmacyService.updateItemStatus(itemId, "dispensed");
            showToast("Item marked as dispensed");
            fetchRx();
        } catch (err: any) {
            showToast(err?.response?.data?.detail || "Dispensing failed", false);
        } finally {
            setProcessing(null);
        }
    };

    const handleMarkUnavailable = async (itemId: number) => {
        setProcessing(itemId);
        try {
            await pharmacyService.updateItemStatus(itemId, "out_of_stock");
            showToast("Item marked as out of stock", false);
            fetchRx();
        } catch (err: any) {
            showToast(err?.response?.data?.detail || "Update failed", false);
        } finally {
            setProcessing(null);
        }
    };

    const filtered = prescriptions.filter(rx => {
        const s = search.toLowerCase();
        return !s || rx.patient_name.toLowerCase().includes(s) || rx.id.toString().includes(s);
    });

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "sent_to_pharmacy": return "bg-blue-50 text-blue-700 border-blue-100";
            case "paid": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "dispensing": return "bg-amber-50 text-amber-700 border-amber-100";
            case "completed": return "bg-green-50 text-green-700 border-green-100";
            case "failed": return "bg-red-50 text-red-700 border-red-100";
            case "partial": return "bg-orange-50 text-orange-700 border-orange-100";
            default: return "bg-gray-50 text-gray-500 border-gray-100";
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: -20, x: "-50%" }}
                        className={`fixed top-6 left-1/2 z-[300] px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 min-w-[300px] justify-center ${toast.ok ? "bg-slate-900 text-white" : "bg-red-500 text-white"}`}
                    >
                        {toast.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5" />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                            Pharmacy Prescription Queue
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {activeTab === "queue" ? "Manage and dispense active prescriptions" : "History of dispensed and completed records"}
                        </p>
                    </motion.div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {/* Tab Switcher */}
                        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex shadow-sm">
                            <button
                                onClick={() => setActiveTab("queue")}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'queue' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <Layers className="w-4 h-4" />
                                ACTIVE QUEUE
                            </button>
                            <button
                                onClick={() => setActiveTab("history")}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                <History className="w-4 h-4" />
                                HISTORY
                            </button>
                        </div>
                        
                        <button onClick={fetchRx} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                            <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Filter & Search */}
                <div className="flex items-center gap-3 w-full">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search patient or Ref ID..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm font-semibold"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Main Queue */}
                <div className="space-y-4">
                    {loading && prescriptions.length === 0 ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] p-20 flex flex-col items-center gap-6 border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                <Search className="w-10 h-10 text-slate-300" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-slate-900">No records found</p>
                                <p className="text-sm text-slate-400 font-medium mt-1">
                                    {activeTab === "queue" ? "Ready prescriptions will appear here." : "Completed records will be archived here."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filtered.map((rx, idx) => (
                                <motion.div
                                    key={rx.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
                                >
                                    <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                                        {/* Patient Info */}
                                        <div className="md:w-64 shrink-0 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                                                    <User className="w-6 h-6 text-slate-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-black text-slate-900 truncate leading-tight">{rx.patient_name}</p>
                                                        {rx.is_admitted && (
                                                            <div className="px-1.5 py-0.5 bg-rose-50 text-[8px] font-black text-rose-600 border border-rose-100 rounded-md flex items-center gap-1 shrink-0 animate-pulse">
                                                                <Bed className="w-2 h-2" />
                                                                BED
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Ref: #{rx.id}</p>
                                                </div>
                                            </div>
                                            
                                            <div className={`px-4 py-2 rounded-xl border text-xs font-black text-center tracking-tight transition-colors ${getStatusStyles(rx.status)}`}>
                                                {rx.status.replace(/_/g, ' ').toUpperCase()}
                                            </div>

                                            <div className="space-y-2 pt-2">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                    <Stethoscope className="w-3.5 h-3.5" />
                                                    Dr. {rx.doctor_name}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {activeTab === 'queue' 
                                                        ? format(new Date(rx.created_at), "MMM d, h:mm a")
                                                        : `Dispensed: ${format(new Date(rx.updated_at), "MMM d, h:mm a")}`
                                                    }
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items List */}
                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {rx.items.map((item) => (
                                                    <div 
                                                        key={item.id} 
                                                        className={`p-4 rounded-2xl border transition-all ${
                                                            item.status === 'dispensed' 
                                                            ? 'bg-emerald-50/50 border-emerald-100' 
                                                            : item.status === 'out_of_stock'
                                                            ? 'bg-red-50/50 border-red-100'
                                                            : 'bg-slate-50/50 border-slate-100 hover:border-indigo-200'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <Pill className={`w-4 h-4 ${item.status === 'dispensed' ? 'text-emerald-500' : 'text-indigo-500'}`} />
                                                                    <p className="font-extrabold text-sm text-slate-900 truncate">{item.drug_name}</p>
                                                                </div>
                                                                <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wide">
                                                                    {item.dosage} • {item.frequency} • {item.duration}
                                                                </p>
                                                                {item.is_internal && (
                                                                    <span className="inline-block mt-2 px-2 py-0.5 bg-indigo-50 text-[9px] font-black text-indigo-600 rounded-lg uppercase tracking-wider">Internal Stock</span>
                                                                )}
                                                            </div>

                                                            {activeTab === 'queue' && item.status === 'pending' ? (
                                                                <div className="flex flex-col gap-2">
                                                                    <button
                                                                        onClick={() => handleDispenseItem(item.id)}
                                                                        disabled={processing === item.id}
                                                                        className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50"
                                                                    >
                                                                        {processing === item.id ? "..." : "DISPENSE"}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleMarkUnavailable(item.id)}
                                                                        disabled={processing === item.id}
                                                                        className="text-[9px] font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
                                                                    >
                                                                        OUT OF STOCK
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className={`flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest ${item.status === 'dispensed' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                    {item.status === 'dispensed' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                                    {item.status}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {rx.instructions && (
                                                <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                    <p className="text-xs font-semibold text-amber-800 leading-relaxed italic">"{rx.instructions}"</p>
                                                </div>
                                            )}

                                            {rx.clinical_notes && (
                                                <div className="mt-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                                                    <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Clinical Remarks</p>
                                                        <p className="text-xs font-medium text-slate-700 leading-relaxed">{rx.clinical_notes}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}
