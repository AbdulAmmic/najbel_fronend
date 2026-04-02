"use client";

import { useState } from "react";
import { X, Pill, Send, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { nurseService } from "@/services/api";

interface MedicationLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: number;
    medication: any;
    onSuccess: () => void;
}

export default function MedicationLogModal({ isOpen, onClose, patientId, medication, onSuccess }: MedicationLogModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        status: "administered",
        remarks: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!medication) return;
        
        setLoading(true);
        try {
            await nurseService.createMedicationLog({
                prescription_item_id: medication.id,
                patient_id: patientId,
                ...formData
            });
            onSuccess();
            onClose();
            setFormData({ status: "administered", remarks: "" });
        } catch (error) {
            console.error("Failed to log medication administration", error);
            alert("Failed to save log. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!medication) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-[70] overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Pill className="w-5 h-5 text-blue-600" />
                                    Medication Log
                                </h2>
                                <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-wider">
                                    {medication.drug_name} • {medication.dosage}
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Action Taken</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'administered', label: 'Given', icon: CheckCircle2, color: 'emerald' },
                                        { id: 'missed', label: 'Missed', icon: X, color: 'rose' },
                                        { id: 'delayed', label: 'Delayed', icon: Clock, color: 'amber' },
                                        { id: 'refused', label: 'Refused', icon: AlertTriangle, color: 'orange' }
                                    ].map(stat => (
                                        <button
                                            key={stat.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: stat.id })}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-[10px] font-bold transition-all ${
                                                formData.status === stat.id 
                                                ? `bg-${stat.color}-50 border-${stat.color}-200 text-${stat.color}-700 shadow-sm shadow-${stat.color}-100` 
                                                : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                                            }`}
                                        >
                                            <stat.icon className="w-5 h-5" />
                                            {stat.label.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block font-semibold">Remarks (Optional)</label>
                                <textarea
                                    value={formData.remarks}
                                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[100px] resize-none text-sm"
                                    placeholder="Enter any observation or reason for missed/delayed doses..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-all border border-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Log Administration
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
