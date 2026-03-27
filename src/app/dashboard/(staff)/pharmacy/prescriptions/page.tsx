"use client";

import { useState, useEffect } from "react";
import {
    Pill, Search, CheckCircle2, XCircle, DollarSign, AlertCircle,
    Clock, User2, ChevronRight, X, Send, RefreshCw, Stethoscope
} from "lucide-react";
import api from "@/services/api";

type RxStatus = "active" | "dispensed" | "unavailable" | "cancelled";

interface Prescription {
    id: number;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    status: RxStatus;
    created_at: string;
    patient_id: number;
    patient_name: string;
}

interface ProcessItem {
    medication: string;
    available: boolean;
    unit_price: string;
    quantity: string;
}

const STATUS_STYLE: Record<RxStatus, string> = {
    active: "bg-blue-50 text-blue-700",
    dispensed: "bg-emerald-50 text-emerald-700",
    unavailable: "bg-red-50 text-red-600",
    cancelled: "bg-gray-100 text-gray-500",
};

export default function PharmacyPrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("active");
    const [selected, setSelected] = useState<Prescription | null>(null);
    const [processItems, setProcessItems] = useState<ProcessItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchRx = async () => {
        setLoading(true);
        try {
            const res = await api.get("/pharmacy/prescriptions");
            setPrescriptions(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRx(); }, []);

    const openProcess = (rx: Prescription) => {
        setSelected(rx);
        // Each prescription is one medication — split by comma if multiple
        const meds = rx.medication.split(",").map(m => m.trim()).filter(Boolean);
        setProcessItems(meds.map(m => ({
            medication: m,
            available: true,
            unit_price: "",
            quantity: "1",
        })));
    };

    const toggleAvailable = (i: number) =>
        setProcessItems(prev => prev.map((p, idx) => idx === i ? { ...p, available: !p.available } : p));

    const setItemField = (i: number, key: keyof ProcessItem, val: string) =>
        setProcessItems(prev => prev.map((p, idx) => idx === i ? { ...p, [key]: val } : p));

    const handleProcess = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            const res = await api.post(`/pharmacy/prescriptions/${selected.id}/process`, {
                items: processItems.map(p => ({
                    medication: p.medication,
                    available: p.available,
                    unit_price: parseFloat(p.unit_price) || 0,
                    quantity: parseInt(p.quantity) || 1,
                })),
            });
            const d = res.data;
            const avail = processItems.filter(p => p.available).length;
            const unavail = processItems.filter(p => !p.available).length;
            showToast(
                `Processed! ${avail} available · ${unavail} unavailable` +
                (d.invoice_created ? ` · Invoice ₦${d.invoice_total?.toLocaleString()} sent to patient` : ""),
                true
            );
            setSelected(null);
            fetchRx();
        } catch (err: any) {
            showToast(err?.response?.data?.detail || "Processing failed.", false);
        } finally {
            setSaving(false);
        }
    };

    const filtered = prescriptions.filter(rx => {
        const s = search.toLowerCase();
        const matchSearch = !s || rx.patient_name.toLowerCase().includes(s) || rx.medication.toLowerCase().includes(s);
        const matchStatus = filterStatus === "all" || rx.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const counts = {
        active: prescriptions.filter(r => r.status === "active").length,
        dispensed: prescriptions.filter(r => r.status === "dispensed").length,
        unavailable: prescriptions.filter(r => r.status === "unavailable").length,
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-2 max-w-sm text-center ${toast.ok ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}`}>
                    {toast.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-5 py-5">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Prescriptions Queue</h1>
                            <p className="text-xs text-gray-400 mt-0.5">Review and dispense doctor prescriptions</p>
                        </div>
                        <button onClick={fetchRx} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition active:scale-90">
                            <RefreshCw className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                            { label: "Pending", value: counts.active, color: "text-blue-600", bg: "bg-blue-50" },
                            { label: "Dispensed", value: counts.dispensed, color: "text-emerald-600", bg: "bg-emerald-50" },
                            { label: "Unavailable", value: counts.unavailable, color: "text-red-500", bg: "bg-red-50" },
                        ].map((s, i) => (
                            <div key={i} className={`${s.bg} rounded-2xl p-3 text-center`}>
                                <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                                <div className="text-[10px] text-gray-500 font-medium mt-0.5">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Search + Filter */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search patient or medication..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:bg-white transition text-gray-700 placeholder:text-gray-400"
                            />
                        </div>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none capitalize appearance-none"
                        >
                            <option value="all">All</option>
                            <option value="active">Pending</option>
                            <option value="dispensed">Dispensed</option>
                            <option value="unavailable">Unavailable</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="max-w-3xl mx-auto px-5 py-5 pb-28 space-y-3">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-7 h-7 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-20 gap-3 text-gray-300">
                        <Pill className="w-10 h-10" />
                        <p className="text-sm text-gray-400 font-medium">No prescriptions found</p>
                    </div>
                ) : filtered.map(rx => (
                    <div key={rx.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                                    <Pill className="w-5 h-5 text-violet-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-sm text-gray-900 truncate">{rx.medication}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[rx.status] || "bg-gray-100 text-gray-500"}`}>
                                            {rx.status === "active" ? "Pending" : rx.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{rx.dosage} · {rx.frequency} · {rx.duration}</p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <User2 className="w-3 h-3 text-gray-400" />
                                        <p className="text-xs text-gray-500 font-semibold">{rx.patient_name}</p>
                                        <Clock className="w-3 h-3 text-gray-300 ml-1" />
                                        <p className="text-xs text-gray-400">{new Date(rx.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {rx.status === "active" ? (
                                <button onClick={() => openProcess(rx)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition active:scale-95 shrink-0"
                                >
                                    Process <ChevronRight className="w-3 h-3" />
                                </button>
                            ) : (
                                <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${STATUS_STYLE[rx.status]}`}>
                                    {rx.status === "dispensed" ? "✓ Done" : "✗ N/A"}
                                </div>
                            )}
                        </div>
                        {rx.instructions && (
                            <div className="mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 flex gap-2 items-start">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                {rx.instructions}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Process Modal */}
            {selected && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)} />
                    <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
                        <div className="flex justify-center pt-3 sm:hidden">
                            <div className="w-10 h-1 bg-gray-200 rounded-full" />
                        </div>
                        <div className="sticky top-0 bg-white border-b border-gray-50 px-6 py-5 rounded-t-3xl z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-bold text-gray-900 text-base">Process Prescription</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">Patient: {selected.patient_name}</p>
                                </div>
                                <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-gray-100 transition">
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2">
                                <Stethoscope className="w-4 h-4 shrink-0 mt-0.5" />
                                Mark each medication as available or not. An invoice will be auto-generated for available items and sent to the patient.
                            </div>

                            {processItems.map((item, i) => (
                                <div key={i} className={`border rounded-2xl p-4 transition-all ${item.available ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/20"}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="font-bold text-sm text-gray-900">{item.medication}</p>
                                        <button onClick={() => toggleAvailable(i)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${item.available ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
                                        >
                                            {item.available ? <><CheckCircle2 className="w-3.5 h-3.5" /> In Stock</> : <><XCircle className="w-3.5 h-3.5" /> Not Available</>}
                                        </button>
                                    </div>

                                    {item.available && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-semibold text-gray-500">Qty</label>
                                                <div className="flex items-center bg-white border border-gray-200 rounded-xl mt-1 overflow-hidden">
                                                    <span className="px-2 text-gray-400 text-xs">×</span>
                                                    <input type="number" min="1" value={item.quantity}
                                                        onChange={e => setItemField(i, "quantity", e.target.value)}
                                                        className="flex-1 py-2.5 pr-3 text-sm font-bold text-gray-800 outline-none bg-transparent"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-semibold text-gray-500">Unit Price (₦)</label>
                                                <div className="flex items-center bg-white border border-gray-200 rounded-xl mt-1 overflow-hidden">
                                                    <DollarSign className="w-3.5 h-3.5 text-gray-400 ml-2 shrink-0" />
                                                    <input type="number" min="0" placeholder="0.00" value={item.unit_price}
                                                        onChange={e => setItemField(i, "unit_price", e.target.value)}
                                                        className="flex-1 py-2.5 pr-3 text-sm font-bold text-gray-800 outline-none bg-transparent"
                                                    />
                                                </div>
                                            </div>

                                            {item.unit_price && item.quantity && (
                                                <div className="col-span-2 bg-white rounded-xl px-3 py-2 border border-gray-100 flex justify-between items-center">
                                                    <span className="text-xs text-gray-500">Subtotal</span>
                                                    <span className="text-sm font-black text-emerald-600">
                                                        ₦{(parseFloat(item.unit_price) * parseInt(item.quantity)).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Total */}
                            {processItems.some(p => p.available && p.unit_price) && (
                                <div className="bg-gray-900 text-white rounded-2xl px-5 py-4 flex justify-between items-center">
                                    <span className="text-sm font-bold">Invoice Total</span>
                                    <span className="text-lg font-black text-emerald-400">
                                        ₦{processItems.filter(p => p.available && p.unit_price && p.quantity)
                                            .reduce((sum, p) => sum + parseFloat(p.unit_price) * parseInt(p.quantity), 0)
                                            .toLocaleString()}
                                    </span>
                                </div>
                            )}

                            <div className="flex gap-3 pt-1">
                                <button onClick={() => setSelected(null)}
                                    className="flex-1 py-3.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-2xl transition active:scale-95"
                                >Cancel</button>
                                <button onClick={handleProcess} disabled={saving}
                                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-200 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                                    <Send className="w-4 h-4" />
                                    {saving ? "Processing..." : "Confirm & Dispatch"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
