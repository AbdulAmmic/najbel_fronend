"use client";

import React, { useState, useEffect } from 'react';
import { prescriptions as prescriptionsService, pharmacy as pharmacyService } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Pill, Search, Clock, CheckCircle2, AlertCircle, Calendar,
    ExternalLink, RefreshCcw, User, Filter, ChevronRight, FileText,
    MessageSquare, X, Save, Edit3, ChevronDown, ChevronUp, Trash2, RotateCcw, Bed
} from 'lucide-react';
import { format } from 'date-fns';

interface PrescriptionItem {
    id: number;
    drug_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    status: string;
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

export default function PrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingNotes, setEditingNotes] = useState<Prescription | null>(null);
    const [noteValue, setNoteValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [cancellingId, setCancellingId] = useState<number | null>(null);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            const data = await prescriptionsService.getAll();
            setPrescriptions(data);
        } catch (error) {
            console.error("Failed to load prescriptions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const toggleRow = (id: number) => {
        setExpandedRows(prev => 
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    const handleOpenNotes = (p: Prescription) => {
        setEditingNotes(p);
        setNoteValue(p.clinical_notes || '');
    };

    const handleSaveNotes = async () => {
        if (!editingNotes) return;
        setSaving(true);
        try {
            await prescriptionsService.update(editingNotes.id, { clinical_notes: noteValue });
            setPrescriptions(prev => prev.map(p => 
                p.id === editingNotes.id ? { ...p, clinical_notes: noteValue } : p
            ));
            setEditingNotes(null);
        } catch (error) {
            console.error("Failed to update notes", error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancelPrescription = async (id: number) => {
        if (!confirm("Are you sure you want to cancel this entire prescription? This will also cancel any unpaid invoices associated with it.")) return;
        setSaving(true);
        try {
            await prescriptionsService.delete(id);
            // Refresh local state
            setPrescriptions(prev => prev.map(p => 
                p.id === id ? { ...p, status: 'cancelled', items: p.items.map(i => ({...i, status: 'cancelled'})) } : p
            ));
        } catch (error) {
            console.error("Failed to cancel prescription", error);
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveItem = async (prescriptionId: number, itemId: number) => {
        if (!confirm("Remove this medicine from the prescription?")) return;
        setSaving(true);
        try {
            await pharmacyService.updateItemStatus(itemId, 'cancelled');
            // Optimistically update the item status
            setPrescriptions(prev => prev.map(p => {
                if (p.id === prescriptionId) {
                    const updatedItems = p.items.map(i => i.id === itemId ? { ...i, status: 'cancelled' } : i);
                    // Check if all items are now cancelled
                    const allCancelled = updatedItems.every(i => i.status === 'cancelled');
                    return { ...p, items: updatedItems, status: allCancelled ? 'cancelled' : p.status };
                }
                return p;
            }));
        } catch (error) {
            console.error("Failed to remove item", error);
        } finally {
            setSaving(false);
        }
    };

    const filteredPrescriptions = prescriptions.filter(p =>
        p.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toString().includes(searchTerm)
    );

    const getStatusStyles = (status: string) => {
        switch (status) {
            case "pending_payment": return "bg-amber-50 text-amber-700 border-amber-100";
            case "sent_to_pharmacy": return "bg-blue-50 text-blue-700 border-blue-100";
            case "paid": return "bg-emerald-50 text-emerald-700 border-emerald-100";
            case "dispensing": return "bg-indigo-50 text-indigo-700 border-indigo-100";
            case "completed": return "bg-green-50 text-green-700 border-green-100";
            case "cancelled": return "bg-red-50 text-red-700 border-red-100";
            default: return "bg-gray-50 text-gray-700 border-gray-100";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "pending_payment": return <Clock className="w-3.5 h-3.5" />;
            case "sent_to_pharmacy": return <Pill className="w-3.5 h-3.5" />;
            case "paid": return <CheckCircle2 className="w-3.5 h-3.5" />;
            case "dispensing": return <RefreshCcw className="w-3.5 h-3.5 animate-spin-slow" />;
            case "completed": return <CheckCircle2 className="w-3.5 h-3.5" />;
            case "cancelled": return <AlertCircle className="w-3.5 h-3.5" />;
            default: return null;
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 min-h-screen bg-slate-50/30">
            {/* Notes Modal */}
            <AnimatePresence>
                {editingNotes && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setEditingNotes(null)}
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden border border-slate-100"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-center text-slate-900">
                                    <h2 className="text-xl font-black flex items-center gap-3 tracking-tight">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        Prescription Clinical Notes
                                    </h2>
                                    <button onClick={() => setEditingNotes(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 font-bold border border-slate-100">
                                            {editingNotes.patient_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 leading-none">{editingNotes.patient_name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">Ref: #{editingNotes.id}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Professional Comments</label>
                                        <textarea 
                                            value={noteValue}
                                            onChange={(e) => setNoteValue(e.target.value)}
                                            placeholder="Add clarification for the patient or follow-up notes for other doctors..."
                                            className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none font-semibold text-slate-700 leading-relaxed"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSaveNotes}
                                    disabled={saving}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {saving ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                                    SAVE CLINICAL NOTES
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        Prescription Management
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Monitor active medications, add clinical notes, and track dispensing status</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search patient or reference..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={fetchPrescriptions}
                        disabled={loading}
                        className="p-2.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group active:scale-95"
                    >
                        <RefreshCcw className={`w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </motion.div>
            </div>

            {/* Main Table Container */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-32">Ref ID</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Details</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Medications</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timeline</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
                                            <p className="text-slate-500 font-bold tracking-tight animate-pulse">Syncing Prescription Records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredPrescriptions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                                                <Search className="w-10 h-10 text-slate-400" />
                                            </div>
                                            <div className="max-w-xs mx-auto text-center">
                                                <p className="text-slate-900 font-black text-lg">No Results Found</p>
                                                <p className="text-slate-500 text-sm font-medium mt-1">Try adjusting your search filters or patient keywords.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredPrescriptions.map((p, idx) => (
                                        <React.Fragment key={p.id}>
                                            <motion.tr 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${expandedRows.includes(p.id) ? 'bg-slate-50/80' : ''} ${p.status === 'cancelled' ? 'opacity-60 bg-slate-50/30' : ''}`}
                                                onClick={() => toggleRow(p.id)}
                                            >
                                                <td className="px-8 py-6">
                                                    <span className="font-mono text-xs font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                                                        #{p.id.toString().padStart(5, '0')}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-200 shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                                                            <User className="w-5 h-5 text-slate-600" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className={`font-extrabold text-slate-900 text-sm tracking-tight ${p.status === 'cancelled' ? 'line-through' : ''}`}>{p.patient_name}</p>
                                                                {p.is_admitted && (
                                                                    <div className="px-1.5 py-0.5 bg-rose-50 text-[8px] font-black text-rose-600 border border-rose-100 rounded-md flex items-center gap-1 shrink-0 animate-pulse">
                                                                        <Bed className="w-2 h-2" />
                                                                        BED
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Dr. {p.doctor_name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-wrap gap-2 max-w-sm">
                                                        {p.items.map((item, i) => (
                                                            <div key={i} className={`flex items-center gap-2 bg-slate-50 border border-slate-200/50 px-2.5 py-1.5 rounded-xl shadow-sm hover:border-blue-200 transition-colors cursor-default ${item.status === 'cancelled' ? 'opacity-50 grayscale' : ''}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'cancelled' ? 'bg-slate-400' : 'bg-blue-500'}`} />
                                                                <div className="flex flex-col min-w-[100px]">
                                                                    <span className={`text-[11px] font-black text-slate-800 leading-none ${item.status === 'cancelled' ? 'line-through' : ''}`}>{item.drug_name}</span>
                                                                    <span className="text-[9px] font-bold text-slate-400 mt-0.5">{item.dosage}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-black tracking-tight ${getStatusStyles(p.status)} shadow-sm`}>
                                                        {getStatusIcon(p.status)}
                                                        {p.status.replace(/_/g, ' ').toUpperCase()}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            {format(new Date(p.created_at), 'MMM dd, yyyy')}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                        {p.status !== 'cancelled' && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleOpenNotes(p)}
                                                                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:text-indigo-600 transition-all text-slate-400 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-95"
                                                                    title="Add Clinical Notes"
                                                                >
                                                                    <MessageSquare className="w-4 h-4" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleCancelPrescription(p.id)}
                                                                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-red-500 hover:text-red-600 transition-all text-slate-400 hover:shadow-lg hover:shadow-red-500/10 active:scale-95"
                                                                    title="Cancel Entire Prescription"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/10">
                                                            {expandedRows.includes(p.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </div>
                                                    </div>
                                                </td>
                                            </motion.tr>

                                            {/* Expanded Row */}
                                            <AnimatePresence>
                                                {expandedRows.includes(p.id) && (
                                                    <motion.tr
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="bg-slate-50/50 border-b border-slate-100"
                                                    >
                                                        <td colSpan={6} className="px-8 py-6">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                                        <Pill className="w-3.5 h-3.5" />
                                                                        Detailed Medication List
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {p.items.map((item) => (
                                                                            <div key={item.id} className={`flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm ${item.status === 'cancelled' ? 'opacity-50 grayscale' : ''}`}>
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className={`p-2 rounded-xl ${item.status === 'cancelled' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                                                                                        <Pill className="w-4 h-4" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className={`text-sm font-black text-slate-900 leading-none ${item.status === 'cancelled' ? 'line-through' : ''}`}>
                                                                                            {item.drug_name}
                                                                                        </p>
                                                                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                                                                                            {item.dosage} • {item.frequency} • {item.duration}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                {item.status !== 'cancelled' && p.status !== 'cancelled' && p.status !== 'completed' && (
                                                                                    <button 
                                                                                        onClick={() => handleRemoveItem(p.id, item.id)}
                                                                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                                        title="Remove item"
                                                                                    >
                                                                                        <X className="w-4 h-4" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-6">
                                                                    <div className="space-y-4">
                                                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                                            Clinical Notes
                                                                        </div>
                                                                        <div className="p-6 bg-white border border-slate-200 rounded-3xl min-h-[100px] relative group">
                                                                            {p.clinical_notes ? (
                                                                                <p className="text-sm font-semibold text-slate-600 leading-relaxed italic pr-8">
                                                                                    "{p.clinical_notes}"
                                                                                </p>
                                                                            ) : (
                                                                                <p className="text-sm font-medium text-slate-400 italic">No clinical notes added yet...</p>
                                                                            )}
                                                                            {p.status !== 'cancelled' && (
                                                                                <button 
                                                                                    onClick={() => handleOpenNotes(p)}
                                                                                    className="absolute top-4 right-4 p-2 bg-indigo-50 text-indigo-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                >
                                                                                    <Edit3 className="w-4 h-4" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-4">
                                                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                                            <AlertCircle className="w-3.5 h-3.5" />
                                                                            Original Instructions
                                                                        </div>
                                                                        <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-3xl min-h-[100px]">
                                                                            <p className="text-sm font-bold text-amber-900/70 leading-relaxed">
                                                                                {p.instructions || "No special instructions provided at creation."}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-8 flex justify-end pb-2">
                                                                <a 
                                                                    href={`/dashboard/Doctor/consultations/${p.id}`}
                                                                    className="inline-flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-900 text-xs font-black rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                                                >
                                                                    VIEW FULL CONSULTATION RECORD
                                                                    <ExternalLink className="w-4 h-4 text-slate-400" />
                                                                </a>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    ))}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
            `}</style>
        </div>
    );
}
