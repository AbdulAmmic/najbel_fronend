"use client";

import { useState, useEffect } from "react";
import { X, FileText, Send, AlertTriangle, Clipboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { nurseService } from "@/services/api";

interface NursingNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: number;
    onSuccess: () => void;
    initialContent?: string;
    initialCategory?: string;
    title?: string;
}

export default function NursingNoteModal({ 
    isOpen, 
    onClose, 
    patientId, 
    onSuccess,
    initialContent = "",
    initialCategory = "routine",
    title = "Add Clinical Note"
}: NursingNoteModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        content: initialContent,
        category: initialCategory
    });

    // Sync state when initial props change
    useEffect(() => {
        if (isOpen) {
            setFormData({ content: initialContent, category: initialCategory });
        }
    }, [isOpen, initialContent, initialCategory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.content.trim()) return;
        
        setLoading(true);
        try {
            await nurseService.createNote({
                patient_id: patientId,
                ...formData
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to save nursing note", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-xl bg-white/95 backdrop-blur-2xl rounded-[44px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] border border-white/50 overflow-hidden"
                    >
                        <div className="p-10 pb-6 flex justify-between items-center border-b border-gray-100/50">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-[20px] flex items-center justify-center shadow-inner">
                                    <Clipboard className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Clinical Protocol Entry</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-4 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-3xl transition-all active:scale-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-10">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block ml-1">Observation Context</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: 'routine', label: 'Routine', icon: Clipboard },
                                        { id: 'procedure', label: 'Procedure', icon: FileText },
                                        { id: 'emergency', label: 'Emergency', icon: AlertTriangle }
                                    ].map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: cat.id })}
                                            className={`flex items-center gap-3 p-5 rounded-[26px] border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                                formData.category === cat.id 
                                                ? `bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]` 
                                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                            }`}
                                        >
                                            <cat.icon className={`w-4 h-4 ${formData.category === cat.id ? 'text-blue-400' : ''}`} />
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block ml-1">Clinical Observations</label>
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-[34px] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                                    <textarea
                                        required
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        className="relative w-full px-7 py-7 bg-slate-50/50 border-2 border-transparent rounded-[32px] focus:bg-white focus:border-blue-500/10 focus:outline-none transition-all min-h-[200px] resize-none text-sm font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
                                        placeholder="Describe the clinical state, interventions applied, or patient response..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 h-16 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 rounded-[28px] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={loading || !formData.content.trim()}
                                    className="flex-[2] h-16 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-[28px] shadow-[0_20px_40px_-12px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 group"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                                            Log Clinical Entry
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
