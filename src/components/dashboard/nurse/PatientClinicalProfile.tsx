"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Clipboard, HeartPulse, Pill, FileText, AlertTriangle, 
    Plus, History, User, Calendar, Droplets, Thermometer,
    Activity, Clock, CheckCircle2, AlertCircle, Send, Stethoscope,
    LayoutDashboard, FileStack, ShieldAlert, BadgeCheck, Zap, ArrowRight,
    TrendingUp
} from 'lucide-react';
import { nurseService, medicalRecords, prescriptions, patients, directiveService } from '@/services/api';
import RecordVitalsModal from '@/components/dashboard/nurse/RecordVitalsModal';
import NursingNoteModal from '@/components/dashboard/nurse/NursingNoteModal';
import MedicationLogModal from '@/components/dashboard/nurse/MedicationLogModal';

interface PatientClinicalProfileProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: number;
}

export default function PatientClinicalProfile({ isOpen, onClose, patientId }: PatientClinicalProfileProps) {
    const [patient, setPatient] = useState<any>(null);
    const [medicalHistory, setMedicalHistory] = useState<any[]>([]);
    const [activePrescriptions, setActivePrescriptions] = useState<any[]>([]);
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [consultations, setConsultations] = useState<any[]>([]);
    const [directives, setDirectives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'directives' | 'clinical' | 'meds' | 'notes' | 'vitals'>('directives');
    
    const [isVitalsOpen, setIsVitalsOpen] = useState(false);
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const [isMedLogOpen, setIsMedLogOpen] = useState(false);
    const [selectedMed, setSelectedMed] = useState<any>(null);
    const [noteContext, setNoteContext] = useState<{ title: string, prefill: string, category: string } | null>(null);

    // Parsing helper for clinical logs to remove raw backend strings
    const parseLogDetails = (details: string) => {
        // Handle "Category: routine | Content: Patient is stable"
        if (details.includes("Category:") && details.includes("Content:")) {
             const parts = details.split("|").map(p => p.trim());
             const catPart = parts[0]?.split(".").pop()?.toLowerCase() || 'routine';
             const contentPart = parts[1]?.replace("Content:", "").trim() || "Entry recorded";
             return {
                 clean: contentPart,
                 badge: catPart === 'emergency' ? 'CRITICAL' : catPart.toUpperCase()
             };
        }
        
        // Handle "Reason: ..." for escalation
        if (details.startsWith("Reason:")) {
             return { clean: details.replace("Reason:", "").trim(), badge: 'ESCALATION' };
        }
        
        // Handle "Medication: ..."
        if (details.startsWith("Medication:")) {
             return { clean: details, badge: 'MEDICATION' };
        }

        // Fallback for old format "Category: NoteCategory.EMERGENCY"
        if (details.includes("Category: NoteCategory.")) {
            const cat = details.split("NoteCategory.")[1].toLowerCase();
            return {
                clean: "Clinical entry recorded",
                badge: cat === 'emergency' ? 'CRITICAL' : cat.toUpperCase()
            };
        }
        
        return { clean: details, badge: null };
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pData, records, meds, logs, consults, dirs] = await Promise.all([
                patients.getById(patientId),
                medicalRecords.getAll().then(res => res.filter((r: any) => r.patient_id === patientId)),
                prescriptions.getAll().then(res => res.filter((r: any) => r.patient_id === patientId && ['sent_to_pharmacy', 'dispensing', 'partial', 'completed'].includes(r.status))),
                nurseService.getActivityLogs(patientId),
                nurseService.getConsultations(patientId),
                directiveService.getAllByPatient(patientId)
            ]);
            setPatient(pData);
            setMedicalHistory(records);
            setActivePrescriptions(meds);
            setActivityLogs(logs);
            setConsultations(consults);
            setDirectives(dirs);
        } catch (error) {
            console.error("Failed to fetch patient clinical data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && patientId) fetchData();
    }, [isOpen, patientId]);

    const handleAcknowledge = async (directiveId: number) => {
        const comment = prompt("Acknowledge this directive? Add an optional initial remark:");
        try {
            await directiveService.updateStatus(directiveId, { status: 'acknowledged', nurse_comment: comment || undefined });
            fetchData();
        } catch (error) {
            console.error("Failed to acknowledge directive", error);
        }
    };

    const handleComplete = async (directiveId: number) => {
        const comment = prompt("Add a status update/comment for this completed task:");
        try {
            await directiveService.updateStatus(directiveId, { status: 'completed', nurse_comment: comment || undefined });
            fetchData();
        } catch (error) {
            console.error("Failed to complete directive", error);
        }
    };

    const handleEscalate = async () => {
        const reason = prompt("Enter reason for escalation to doctor:");
        if (!reason) return;
        try {
             await nurseService.escalate(patientId, reason);
             fetchData();
        } catch (error) {
             console.error("Failed to escalate", error);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="profile-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[60] flex items-center justify-center p-4 sm:p-6"
                onClick={onClose}
            >
                <motion.div
                    key="profile-card"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.8 }}
                    className="w-full max-w-6xl max-h-[90vh] bg-white/90 backdrop-blur-3xl rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.2)] border border-white/50 flex flex-col overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header Section */}
                    <div className="relative p-6 sm:p-8 pb-4">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <LayoutDashboard className="w-48 h-48 -mr-12 -mt-12 text-slate-900" />
                        </div>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
                                    <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-3xl bg-white border border-white/50 flex items-center justify-center text-blue-600 text-3xl font-black shadow-xl uppercase">
                                        {patient?.user?.full_name?.charAt(0) || "P"}
                                    </div>
                                    {patient?.is_admitted && (
                                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                                            <BadgeCheck className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{patient?.user?.full_name}</h2>
                                        <span className="hidden md:inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100/50">
                                            {patient?.unique_id || patient?.id}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-bold">
                                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 opacity-50" /> {patient?.gender}</span>
                                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 opacity-50" /> {patient?.date_of_birth}</span>
                                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-3xl ${patient?.is_admitted ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100'}`}>
                                            <Zap className="w-3 h-3" /> {patient?.is_admitted ? 'In-Patient' : 'Out-Patient'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button onClick={handleEscalate} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest rounded-[24px] hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 active:scale-95">
                                    <ShieldAlert className="w-4 h-4" /> Clinical Escalation
                                </button>
                                <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-3xl transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        
                        {/* High Priority Directive Banner (If pending) */}
                        {directives.some(d => d.status === 'pending' || d.status === 'acknowledged') && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mx-6 sm:mx-8 mb-4 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 to-indigo-800 border border-white/20 shadow-2xl relative"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Zap className="w-24 h-24 text-white" />
                                </div>
                                <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner text-white">
                                            <Zap className="w-6 h-6 animate-pulse" />
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-sm font-black text-white tracking-tight uppercase leading-none mb-1">Active Clinical Directives</h4>
                                            <p className="text-white/60 font-bold text-[9px] uppercase tracking-widest leading-none">
                                                {directives.filter(d => d.status === 'pending').length} Pending · {directives.filter(d => d.status === 'acknowledged').length} Work In Progress
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setActiveTab('directives')}
                                        className="px-6 py-2 bg-white text-indigo-900 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-lg flex items-center gap-2"
                                    >
                                        Execute Orders <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Sliding Navigation */}
                        <div className="mt-8 flex gap-1 p-1.5 bg-slate-100/50 backdrop-blur-xl rounded-[32px] w-full max-w-2xl overflow-x-auto no-scrollbar border border-white/50">
                            {[
                                { id: 'directives', label: 'Directives', icon: Zap, color: 'text-blue-600' },
                                { id: 'clinical', label: 'History', icon: Clipboard, color: 'text-slate-600' },
                                { id: 'meds', label: 'Meds', icon: Pill, color: 'text-purple-600' },
                                { id: 'notes', label: 'Journal', icon: FileStack, color: 'text-emerald-600' },
                                { id: 'vitals', label: 'Vitals', icon: Activity, color: 'text-rose-600' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-4 sm:px-6 rounded-[28px] text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap min-w-fit ${
                                        activeTab === tab.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                    }`}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div layoutId="activeTab" className="absolute inset-0 bg-white rounded-[24px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-200/30" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                    )}
                                    <tab.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10 ${activeTab === tab.id ? tab.color : 'opacity-30'}`} />
                                    <span className="relative z-10">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 p-8 pt-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-96 gap-4">
                                <Activity className="w-12 h-12 text-blue-600 animate-pulse" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Clinical Records...</p>
                            </div>
                        ) : (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-8"
                            >
                                {activeTab === 'clinical' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="space-y-8">
                                            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
                                                <AlertCircle className="absolute -right-4 -top-4 w-24 h-24 text-rose-500/5 rotate-12" />
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Clinical Alerts
                                                </h4>
                                                <p className="p-4 bg-rose-50/50 text-rose-700 rounded-2xl text-xs font-bold border border-rose-100">
                                                    {patient?.allergies || "No drug allergies or prior clinical sensitivities reported."}
                                                </p>
                                            </div>
                                            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Bio-Metric Data</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Blood Group</p>
                                                        <p className="text-xl font-black text-slate-900">{patient?.blood_group || "--"}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Genotype</p>
                                                        <p className="text-xl font-black text-slate-900">{patient?.genotype || "--"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="lg:col-span-2 space-y-6">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><History className="w-3.5 h-3.5 text-blue-500" /> Diagnostic Chronology</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {medicalHistory.map((rec, i) => (
                                                    <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">{i+1}</div>
                                                                <div>
                                                                    <h5 className="text-sm font-black text-slate-900">{rec.diagnosis}</h5>
                                                                    <p className="text-[9px] font-bold text-slate-400 italic">Dr. {rec.doctor_name || "Internal Staff"}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-[9px] font-black text-slate-300 uppercase">{new Date(rec.visit_date).toLocaleDateString()}</p>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 line-clamp-3 italic">"{rec.symptoms}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'directives' && (
                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-3 h-10 bg-indigo-600 rounded-full" />
                                                <div>
                                                    <h3 className="font-black text-slate-900 text-2xl tracking-tight uppercase">Medical Directives</h3>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Authorized physician orders & treatment tasks</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* New Active Directives */}
                                        <div className="grid gap-6">
                                            {directives.map((d, i) => (
                                                <motion.div 
                                                    key={`dir-${d.id}`}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="bg-white/80 backdrop-blur-xl rounded-[40px] border border-white shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
                                                >
                                                    <div className="flex flex-col md:flex-row">
                                                        <div className={`p-8 md:w-48 flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden ${d.urgency === 'stat' ? 'bg-rose-600 text-white' : d.urgency === 'urgent' ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white'}`}>
                                                            {d.urgency === 'stat' && (
                                                                <motion.div 
                                                                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                                                                    transition={{ duration: 2, repeat: Infinity }}
                                                                    className="absolute inset-0 bg-white"
                                                                />
                                                            )}
                                                            <div className="relative z-10 p-4 bg-white/20 rounded-[28px] mb-2 backdrop-blur-md border border-white/20 shadow-inner">
                                                                <Zap className={`w-8 h-8 ${d.urgency === 'stat' ? 'animate-pulse' : ''}`} />
                                                            </div>
                                                            <p className="relative z-10 text-[11px] font-black uppercase tracking-[0.2em]">{d.urgency}</p>
                                                            <div className="relative z-10 px-3 py-1 bg-black/20 rounded-full">
                                                                <p className="text-[9px] font-black uppercase tracking-widest">{new Date(d.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 p-8">
                                                            <div className="flex justify-between items-start mb-4">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{d.doctor_name || "Head Physician Order"}</p>
                                                                    </div>
                                                                    <h4 className="text-xl font-black text-slate-900 leading-tight tracking-tight mb-2">{d.instruction}</h4>
                                                                    {d.nurse_name && (
                                                                        <div className="flex items-center gap-2 py-1.5 px-3 bg-emerald-50 rounded-xl border border-emerald-100 self-start inline-flex">
                                                                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Verified by RN. {d.nurse_name}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${d.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : d.status === 'acknowledged' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                                    {d.status}
                                                                </span>
                                                            </div>
                                                            {d.doctor_notes && (
                                                                <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100/50 mb-4 italic">"{d.doctor_notes}"</p>
                                                            )}
                                                            {d.nurse_comment && (
                                                                <div className="flex items-start gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 mb-6">
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                                    <p className="text-[11px] font-bold text-emerald-700 italic leading-relaxed">"{d.nurse_comment}"</p>
                                                                </div>
                                                            )}
                                                            <div className="flex flex-wrap gap-3">
                                                                {d.status === 'pending' && (
                                                                    <button onClick={() => handleAcknowledge(d.id)} className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 shadow-lg active:scale-95 transition-all">Acknowledge</button>
                                                                )}
                                                                {d.status === 'acknowledged' && (
                                                                    <button onClick={() => handleComplete(d.id)} className="px-6 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-700 shadow-lg active:scale-95 transition-all">Mark Completed</button>
                                                                )}
                                                                <button 
                                                                    onClick={() => {
                                                                        setNoteContext({
                                                                            title: `RE: ${d.instruction.slice(0, 20)}...`,
                                                                            prefill: `[DIRECTIVE RESPONSE] — `,
                                                                            category: 'procedure'
                                                                        });
                                                                        setIsNoteOpen(true);
                                                                    }}
                                                                    className="px-6 py-3 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                                                                > Add Remark </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        <div className="pt-8 border-t border-slate-200/50">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Historical Consultations</h4>
                                            <div className="grid gap-4">
                                                {consultations.map((c, i) => (
                                                    <div key={i} className="bg-white/40 p-6 rounded-[32px] border border-white shadow-sm flex flex-col md:flex-row gap-6 hover:bg-white transition-colors duration-500">
                                                        <div className="flex-1">
                                                            <div className="flex justify-between mb-4">
                                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{c.doctor_name}</span>
                                                                <span className="text-[9px] font-black text-slate-300 uppercase">{new Date(c.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                            <h5 className="text-sm font-black text-slate-900 mb-2">{c.diagnosis}</h5>
                                                            <p className="text-xs text-slate-500 leading-relaxed italic">"{c.treatment_plan}"</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'meds' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-8 bg-purple-600 rounded-full" />
                                            <h5 className="font-black text-slate-900 text-xl tracking-tight uppercase">Medication Regimen</h5>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {activePrescriptions.flatMap(p => p.items).map((item, i) => (
                                                <div key={i} className="group bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 p-8 flex flex-col justify-between">
                                                    <div className="space-y-6">
                                                        <div className="flex justify-between items-start">
                                                            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                                                <Pill className="w-7 h-7" />
                                                            </div>
                                                            <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${item.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-lg font-black text-slate-900 leading-tight mb-1">{item.drug_name}</h4>
                                                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{item.dosage} at {item.frequency}</p>
                                                        </div>
                                                        <div className="p-4 bg-slate-50 rounded-2xl text-[10px] text-slate-500 font-bold flex items-center gap-2">
                                                            <Clock className="w-3.5 h-3.5 opacity-50" /> Duration: {item.duration}
                                                        </div>
                                                    </div>
                                                    <button onClick={() => { setSelectedMed(item); setIsMedLogOpen(true); }} className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 group/btn">
                                                        Administer Dose <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notes' && (
                                    <div className="space-y-10">
                                        <div className="flex justify-between items-center bg-gradient-to-br from-emerald-600 to-teal-700 p-12 rounded-[48px] text-white shadow-2xl shadow-emerald-100 relative overflow-hidden">
                                            <div className="relative z-10 w-full md:w-2/3">
                                                <h3 className="text-3xl font-black tracking-tight mb-2 uppercase">Clinical Journal</h3>
                                                <p className="text-emerald-50/80 font-bold text-xs leading-relaxed max-w-md">Record your observations, interventional outcomes, and nursing process updates in this verified clinical ledger.</p>
                                                <button 
                                                    onClick={() => { setNoteContext(null); setIsNoteOpen(true); }}
                                                    className="mt-8 bg-white text-emerald-700 px-10 py-4 rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_12px_40px_-8px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                                >
                                                    <Plus className="w-4 h-4" /> New Observation
                                                </button>
                                            </div>
                                            <FileStack className="absolute -right-12 -bottom-12 w-80 h-80 opacity-10 rotate-12" />
                                        </div>

                                        <div className="relative pl-10 space-y-10 before:absolute before:inset-y-0 before:left-[19px] before:w-1 before:bg-gradient-to-b before:from-emerald-200/50 before:to-transparent before:rounded-full">
                                            {activityLogs.map((log, i) => {
                                                const clinical = parseLogDetails(log.details);
                                                // Prioritize actual content from join
                                                const displayContent = log.note_content || clinical.clean;
                                                return (
                                                    <motion.div 
                                                        key={`log-${i}`}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="relative group"
                                                    >
                                                        <div className="absolute -left-[35px] top-0 w-10 h-10 rounded-full border-4 border-slate-50 bg-white group-hover:bg-slate-900 transition-all duration-500 z-10 flex items-center justify-center shadow-lg">
                                                            <div className={`w-2.5 h-2.5 rounded-full ${clinical.badge === 'CRITICAL' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                                        </div>
                                                        <div className="bg-white/70 backdrop-blur-3xl p-10 rounded-[44px] border border-white hover:border-emerald-100 shadow-sm hover:shadow-2xl transition-all duration-700 ml-8 group-hover:-translate-y-2 relative overflow-hidden">
                                                            <div className="flex justify-between items-start mb-8">
                                                                <div className="flex items-center gap-5">
                                                                    <div className="w-14 h-14 bg-slate-900 rounded-[22px] flex items-center justify-center text-xs font-black text-white shadow-xl">
                                                                        {log.nurse_name?.charAt(0) || "RN"}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h6 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">{log.action_type?.replace(/_/g, ' ')}</h6>
                                                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${clinical.badge === 'CRITICAL' ? 'bg-rose-500 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                                                {clinical.badge || "Routine"}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-sm font-black text-slate-800 tracking-tight italic">Rn. {log.nurse_name || "Assigned Nurse"}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{new Date(log.timestamp).toLocaleDateString()}</p>
                                                                    <p className="text-lg font-black text-slate-900 tracking-tighter">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                                </div>
                                                            </div>
                                                            <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100/50 text-[13px] font-bold text-slate-700 leading-relaxed italic shadow-inner">
                                                                "{displayContent}"
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'vitals' && (
                                    <div className="space-y-10">
                                         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            {[
                                                { label: 'Temp', value: patient?.last_vitals?.temperature, unit: '°C', icon: Thermometer, color: 'text-rose-500', bg: 'bg-rose-50' },
                                                { label: 'Pulse', value: patient?.last_vitals?.heart_rate, unit: 'BPM', icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                                                { label: 'BP', value: patient?.last_vitals?.blood_pressure, unit: 'mmHg', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
                                                { label: 'SPO2', value: patient?.last_vitals?.oxygen_saturation, unit: '%', icon: Droplets, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                                            ].map((v, idx) => (
                                                <div key={idx} className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
                                                    <v.icon className={`absolute -right-2 -bottom-2 w-16 h-16 opacity-5 ${v.color}`} />
                                                    <div className={`w-12 h-12 ${v.bg} ${v.color} rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}><v.icon className="w-6 h-6" /></div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{v.label}</p>
                                                    <h5 className="text-2xl font-black text-slate-900 tracking-tight">{v.value || "--"}<span className="text-xs font-bold text-slate-300 ml-1">{v.unit}</span></h5>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                                            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><History className="w-4 h-4" /> Observational Analytics</h4>
                                                <button onClick={() => setIsVitalsOpen(true)} className="bg-rose-500 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg active:scale-95">Record metrics</button>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest"><tr className="border-b border-slate-100"><th className="px-8 py-5">Observation phase</th><th className="px-8 py-5 text-center">BP</th><th className="px-8 py-5 text-center">Heart Rate</th><th className="px-8 py-5 text-center">Temperature</th><th className="px-8 py-5 text-right">Registered BY</th></tr></thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {patient?.vitals?.slice().reverse().map((v: any, i: number) => (
                                                            <tr key={i} className="text-xs font-bold text-slate-600 hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-8 py-5">
                                                                    <p className="text-slate-900 font-black">{new Date(v.recorded_at).toLocaleDateString()}</p>
                                                                    <p className="text-[9px] text-slate-300">{new Date(v.recorded_at).toLocaleTimeString()}</p>
                                                                </td>
                                                                <td className="px-8 py-5 text-center text-blue-600 font-black">{v.blood_pressure}</td>
                                                                <td className="px-8 py-5 text-center text-indigo-600 font-black">{v.heart_rate} BPM</td>
                                                                <td className={`px-8 py-5 text-center font-black ${v.temperature > 37.5 ? 'text-rose-500' : 'text-emerald-500'}`}>{v.temperature}°C</td>
                                                                <td className="px-8 py-5 text-right italic font-black text-[10px] text-slate-400 uppercase">RN. {v.recorded_by_name || "Staff"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            <RecordVitalsModal isOpen={isVitalsOpen} onClose={() => setIsVitalsOpen(false)} patient={patient} onSuccess={fetchData} />
            <NursingNoteModal 
                isOpen={isNoteOpen} 
                onClose={() => { setIsNoteOpen(false); setNoteContext(null); }} 
                patientId={patientId} 
                onSuccess={fetchData}
                title={noteContext?.title}
                initialContent={noteContext?.prefill}
                initialCategory={noteContext?.category}
            />
            <MedicationLogModal isOpen={isMedLogOpen} onClose={() => { setIsMedLogOpen(false); setSelectedMed(null); }} patientId={patientId} medication={selectedMed} onSuccess={fetchData} />
        </AnimatePresence>
    );
}
