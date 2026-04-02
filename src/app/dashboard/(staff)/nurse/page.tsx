"use client";

import { useEffect, useState } from "react";
import { nurseService, beds } from "@/services/api";
import {
    HeartPulse,
    Users,
    ClipboardList,
    Thermometer,
    Activity,
    Clock,
    Search,
    Filter,
    BedDouble,
    Pill,
    ArrowRight,
    UserCircle,
    CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RecordVitalsModal from "@/components/dashboard/nurse/RecordVitalsModal";
import PatientClinicalProfile from "@/components/dashboard/nurse/PatientClinicalProfile";

export default function NurseDashboard() {
    const [patients, setPatients] = useState<any[]>([]);
    const [bedList, setBedList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterAdmitted, setFilterAdmitted] = useState(false);
    
    // Modals
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [activePatientId, setActivePatientId] = useState<number | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ptData, bedsData] = await Promise.all([
                nurseService.getPatients({ 
                    search: searchQuery || undefined, 
                    admitted_only: filterAdmitted 
                }),
                beds.getAll().catch(() => [])
            ]);
            setPatients(ptData);
            setBedList(bedsData);
        } catch (error) {
            console.error("Failed to fetch nurse dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery, filterAdmitted]);

    const handleOpenVitals = (patient: any) => {
        setSelectedPatient(patient);
        setIsVitalsModalOpen(true);
    };

    const handleOpenProfile = (patientId: number) => {
        setActivePatientId(patientId);
        setIsProfileOpen(true);
    };

    if (loading && patients.length === 0) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <HeartPulse className="w-12 h-12 text-rose-500 animate-pulse" />
                    <p className="text-gray-500 font-medium font-bold tracking-tight">Accessing Clinical Database...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-10">
            {/* ══ MODERN HEADER ══════════════════════════════════════════════ */}
            <div className="bg-white/70 backdrop-blur-3xl rounded-[40px] border border-white/50 p-8 shadow-2xl shadow-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <HeartPulse className="w-48 h-48 -mr-12 -mt-12 text-blue-900" />
                </div>
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <div className="w-2 sm:w-3 h-6 sm:h-8 bg-blue-600 rounded-full" />
                             <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">Nursing Center</h1>
                        </div>
                        <p className="text-slate-500 font-bold text-[9px] sm:text-xs tracking-widest uppercase ml-5 sm:ml-6 opacity-60">Real-time clinical management & care</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                        <div className="relative group w-full sm:w-auto">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-10 group-focus-within:opacity-30 transition duration-1000" />
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                <input 
                                    type="text"
                                    placeholder="Search patients..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-slate-50 border border-slate-100/50 rounded-2xl pl-11 sm:pl-12 pr-4 sm:pr-6 py-3 sm:py-4 w-full sm:w-[320px] lg:w-[360px] focus:outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/50 transition-all font-bold text-xs sm:text-sm shadow-inner"
                                />
                            </div>
                        </div>
                        <button className="hidden sm:flex p-4 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ══ QUICK METRICS ══════════════════════════════════════════════ */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-10">
                    {[
                        { label: "Patients", val: patients.length, icon: Users, color: "blue", grad: "from-blue-600 to-indigo-700" },
                        { label: "In-Patients", val: patients.filter(p => p.is_admitted).length, icon: CheckCircle2, color: "emerald", grad: "from-emerald-600 to-teal-700" },
                        { label: "Beds Avail.", val: `${bedList.filter(b => b.status === 'available').length}/${bedList.length}`, icon: BedDouble, color: "amber", grad: "from-amber-500 to-orange-600" },
                        { label: "Due Meds", val: "8", icon: Pill, color: "purple", grad: "from-purple-600 to-violet-700" },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                            <div className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${stat.grad} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-4 sm:w-6 h-4 sm:h-6" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg sm:text-2xl font-black text-slate-900 leading-none truncate">{stat.val}</h3>
                                <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 sm:mt-1.5 truncate">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 bg-slate-100/50 p-1.5 rounded-2xl w-fit border border-slate-100">
                <button 
                    onClick={() => setFilterAdmitted(false)}
                    className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!filterAdmitted ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`}
                >
                    Overview
                </button>
                <button 
                    onClick={() => setFilterAdmitted(true)}
                    className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterAdmitted ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`}
                >
                    In-Patients
                </button>
            </div>

            {/* Main Clinical Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {patients.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-300">
                        <UserCircle className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                        <h3 className="text-xl font-bold text-gray-900">No patients found</h3>
                        <p className="text-gray-500">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    patients.map((pt, i) => (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            key={pt.id}
                            className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group overflow-hidden flex flex-col"
                        >
                            {/* Card Top: Identity */}
                            <div className="p-6 border-b border-gray-50">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-100">
                                            {pt.full_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-gray-900 text-lg group-hover:text-blue-600 transition-colors uppercase leading-tight">{pt.full_name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-black text-gray-500 tracking-tighter">ID: {pt.unique_id || pt.id}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-tighter ${pt.is_admitted ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {pt.is_admitted ? `WARD: ${pt.ward_name || 'GEN'}` : 'OUT-PATIENT'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Vital Quick View */}
                                {pt.last_vitals ? (
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                                            <Thermometer className={`w-4 h-4 ${pt.last_vitals.temperature > 37.5 ? 'text-rose-500' : 'text-emerald-500'}`} />
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Temp</p>
                                                <p className="text-sm font-black text-gray-900">{pt.last_vitals.temperature}°C</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                                            <Activity className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">BP</p>
                                                <p className="text-sm font-black text-gray-900">{pt.last_vitals.blood_pressure || '--'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-2xl text-center">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">No recent vitals</p>
                                    </div>
                                )}
                            </div>

                            {/* Card Footer: Actions */}
                            <div className="mt-auto p-4 bg-gray-50 flex gap-2">
                                <button 
                                    onClick={() => handleOpenVitals(pt)}
                                    className="flex-1 bg-white border border-gray-200 py-3 rounded-xl text-xs font-black text-gray-700 hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <HeartPulse className="w-4 h-4 text-rose-500" />
                                    VITALS
                                </button>
                                <button 
                                    onClick={() => handleOpenProfile(pt.id)}
                                    className="flex-1 bg-gray-900 py-3 rounded-xl text-xs font-black text-white hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
                                >
                                    MANAGE
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modals */}
            <RecordVitalsModal
                isOpen={isVitalsModalOpen}
                onClose={() => setIsVitalsModalOpen(false)}
                patient={selectedPatient}
                onSuccess={fetchData}
            />

            <PatientClinicalProfile
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                patientId={activePatientId!}
            />
        </div>
    );
}
