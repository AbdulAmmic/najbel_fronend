import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HeartPulse, Thermometer, Wind, Activity, Weight, Ruler } from 'lucide-react';
import { vitals, appointments } from '@/services/api';

interface RecordVitalsModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: any;
    onSuccess: () => void;
}

export default function RecordVitalsModal({ isOpen, onClose, patient, onSuccess }: RecordVitalsModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        systolic_bp: '',
        diastolic_bp: '',
        temperature: '',
        heart_rate: '',
        respiratory_rate: '',
        oxygen_saturation: '',
        weight: '',
        height: '',
        notes: ''
    });

    const calculateBMI = () => {
        const w = parseFloat(formData.weight);
        const h = parseFloat(formData.height); // assuming height in meters
        // If height is likely in cm (e.g. > 3), convert to meters
        const heightInMeters = h > 3 ? h / 100 : h;

        if (w && heightInMeters) {
            return (w / (heightInMeters * heightInMeters)).toFixed(1);
        }
        return '--';
    };

    const isAbnormal = (type: string, value: string) => {
        const val = parseFloat(value);
        if (isNaN(val)) return false;
        switch (type) {
            case 'temp': return val > 38 || val < 35.5;
            case 'systolic': return val > 140 || val < 90;
            case 'diastolic': return val > 90 || val < 60;
            case 'hr': return val > 100 || val < 60;
            case 'spo2': return val < 95;
            default: return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Create vital record
            // Handle both legacy (appointment based) and new (patient based) data structures
            const patientId = patient.patient_id || patient.id;
            
            await vitals.create({
                patient_id: patientId,
                weight: parseFloat(formData.weight),
                height: parseFloat(formData.height),
                blood_pressure: `${formData.systolic_bp}/${formData.diastolic_bp}`,
                heart_rate: parseInt(formData.heart_rate),
                temperature: parseFloat(formData.temperature),
                oxygen_saturation: parseInt(formData.oxygen_saturation),
                notes: formData.notes
            });

            // If it's an appointment-based record, update status
            if (patient.id && patient.status) {
                await appointments.updateStatus(patient.id, 'ready-for-doctor');
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to record vitals', error);
            alert('Failed to save vitals. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-rose-500" />
                                    Record Vitals
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Patient: <span className="font-semibold text-gray-900">{patient?.patient?.user?.full_name || patient?.full_name}</span>
                                    <span className="mx-2">•</span>
                                    ID: {patient?.patient_id || patient?.unique_id || patient?.id}
                                </p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="vitals-form" onSubmit={handleSubmit} className="space-y-6">
                                {/* Cardiovascular */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Cardiovascular</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">BP (Systolic)</label>
                                            <div className="relative">
                                                <input
                                                    required
                                                    type="number"
                                                    value={formData.systolic_bp}
                                                    onChange={e => setFormData({ ...formData, systolic_bp: e.target.value })}
                                                    className={`w-full pl-3 pr-10 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                                                        isAbnormal('systolic', formData.systolic_bp) 
                                                        ? 'border-rose-300 bg-rose-50 focus:ring-rose-500/20 focus:border-rose-500' 
                                                        : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'
                                                    }`}
                                                    placeholder="120"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium select-none">mmHg</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">BP (Diastolic)</label>
                                            <div className="relative">
                                                <input
                                                    required
                                                    type="number"
                                                    value={formData.diastolic_bp}
                                                    onChange={e => setFormData({ ...formData, diastolic_bp: e.target.value })}
                                                    className={`w-full pl-3 pr-10 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                                                        isAbnormal('diastolic', formData.diastolic_bp) 
                                                        ? 'border-rose-300 bg-rose-50 focus:ring-rose-500/20 focus:border-rose-500' 
                                                        : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'
                                                    }`}
                                                    placeholder="80"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium select-none">mmHg</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">Heart Rate</label>
                                            <div className="relative">
                                                <HeartPulse className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                                <input
                                                    required
                                                    type="number"
                                                    value={formData.heart_rate}
                                                    onChange={e => setFormData({ ...formData, heart_rate: e.target.value })}
                                                    className={`w-full pl-9 pr-10 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                                                        isAbnormal('hr', formData.heart_rate) 
                                                        ? 'border-rose-300 bg-rose-50 focus:ring-rose-500/20 focus:border-rose-500' 
                                                        : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'
                                                    }`}
                                                    placeholder="72"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium select-none">bpm</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Respiratory & Temp */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Respiratory & Temp</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">Temperature</label>
                                            <div className="relative">
                                                <Thermometer className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                                <input
                                                    required
                                                    step="0.1"
                                                    type="number"
                                                    value={formData.temperature}
                                                    onChange={e => setFormData({ ...formData, temperature: e.target.value })}
                                                    className={`w-full pl-9 pr-10 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                                                        isAbnormal('temp', formData.temperature) 
                                                        ? 'border-rose-300 bg-rose-50 focus:ring-rose-500/20 focus:border-rose-500' 
                                                        : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'
                                                    }`}
                                                    placeholder="36.5"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium select-none">°C</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">Respiratory Rate</label>
                                            <div className="relative">
                                                <Wind className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="number"
                                                    value={formData.respiratory_rate}
                                                    onChange={e => setFormData({ ...formData, respiratory_rate: e.target.value })}
                                                    className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                    placeholder="16"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium select-none">/min</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">Oxygen (SPO2)</label>
                                            <div className="relative">
                                                <Activity className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="number"
                                                    value={formData.oxygen_saturation}
                                                    onChange={e => setFormData({ ...formData, oxygen_saturation: e.target.value })}
                                                    className={`w-full pl-9 pr-10 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                                                        isAbnormal('spo2', formData.oxygen_saturation) 
                                                        ? 'border-rose-300 bg-rose-50 focus:ring-rose-500/20 focus:border-rose-500' 
                                                        : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'
                                                    }`}
                                                    placeholder="98"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium select-none">%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Anthropometrics */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Anthropometrics</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">Weight</label>
                                            <div className="relative">
                                                <Weight className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                                <input
                                                    required
                                                    step="0.1"
                                                    type="number"
                                                    value={formData.weight}
                                                    onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                                    className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                    placeholder="70.5"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium select-none">kg</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">Height</label>
                                            <div className="relative">
                                                <Ruler className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                                <input
                                                    required
                                                    step="0.01"
                                                    type="number"
                                                    value={formData.height}
                                                    onChange={e => setFormData({ ...formData, height: e.target.value })}
                                                    className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                    placeholder="1.75"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium select-none">m</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">BMI</label>
                                            <div className="w-full h-[42px] px-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center text-gray-500 font-medium">
                                                {calculateBMI()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Additional Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[80px] resize-none"
                                        placeholder="Any observations, symptoms, or complaints..."
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                form="vitals-form"
                                disabled={loading}
                                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <HeartPulse className="w-4 h-4" />
                                        Save Vitals
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
