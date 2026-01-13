"use client";

import { useEffect, useState } from "react";
import { appointments, vitals } from "@/services/api";
import {
    HeartPulse,
    Users,
    ClipboardList,
    Thermometer,
    Activity,
    Clock,
    ArrowRight,
    BedDouble
} from "lucide-react";
import { motion } from "framer-motion";

export default function NurseDashboard() {
    const [queue, setQueue] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQueue = async () => {
            try {
                // In a real scenario, we might have a specific endpoint for 'checked-in' patients
                // For now, filtering appointments that are 'confirmed' or 'arrived'
                const data = await appointments.getAll();
                const pendingVitals = data.filter((a: any) =>
                    a.status === 'confirmed' || a.status === 'checked-in'
                );
                setQueue(pendingVitals);
            } catch (error) {
                console.error("Failed to fetch nurse queue", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQueue();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <HeartPulse className="w-12 h-12 text-rose-500 animate-pulse" />
                    <p className="text-gray-500 font-medium">Loading triage station...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Nursing Station</h1>
                    <p className="text-gray-500 mt-1">Triage and Patient Vitals Management</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                RN
                            </div>
                        ))}
                        <div className="h-10 w-10 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400">
                            +2
                        </div>
                    </div>
                    <button className="bg-rose-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-colors flex items-center gap-2">
                        <HeartPulse className="w-4 h-4" />
                        Record Vitals
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Left: Triage Queue */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Status Metrics */}
                    <div className="grid grid-cols-3 gap-6">
                        {[
                            { label: "Waiting for Vitals", val: queue.length, icon: Users, color: "blue" },
                            { label: "Critical Attention", val: "2", icon: Activity, color: "rose" },
                            { label: "Beds Available", val: "8/12", icon: BedDouble, color: "emerald" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                                <div className={`p-4 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">{stat.val}</h3>
                                    <p className="text-sm text-gray-500">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Patient Queue */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-gray-500" />
                                Vitals Queue
                            </h2>
                            <span className="text-sm text-gray-400">Sorted by waiting time</span>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {queue.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>No patients currently waiting for vitals.</p>
                                </div>
                            ) : (
                                queue.map((pt: any, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        key={i}
                                        className="p-4 hover:bg-gray-50/80 transition-colors flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                                {pt.patient?.user?.full_name?.charAt(0) || "P"}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{pt.patient?.user?.full_name || "Unknown Patient"}</h3>
                                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-600">
                                                        ID: {pt.patient_id}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> Arrived 10m ago
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="hidden md:flex flex-col items-end mr-4">
                                                <span className="text-xs font-medium text-gray-400">Reason</span>
                                                <span className="text-sm text-gray-700">{pt.reason || "Checkup"}</span>
                                            </div>
                                            <button className="px-4 py-2 bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-600 text-gray-600 font-medium rounded-lg transition-all shadow-sm">
                                                Call Patient
                                            </button>
                                            <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md shadow-blue-600/20">
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Quick Actions & Bed Status */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Quick Entry */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Thermometer className="w-5 h-5 text-rose-400" />
                            Quick Vitals Entry
                        </h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Patient ID / Name" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:border-rose-500 transition-colors" />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="BP (mmHg)" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:border-rose-500 transition-colors" />
                                <input type="text" placeholder="Temp (°C)" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:border-rose-500 transition-colors" />
                            </div>
                            <button className="w-full py-3 bg-rose-600 hover:bg-rose-500 rounded-xl font-medium transition-colors shadow-lg shadow-rose-900/50">
                                Save Vitals
                            </button>
                        </div>
                    </div>

                    {/* Bed Allocation - Simple List */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Bed Allocation Preview</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4, 5, 6].map(bed => (
                                <div key={bed} className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${bed % 3 === 0
                                        ? 'bg-rose-50 border-rose-100 text-rose-700'
                                        : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                    }`}>
                                    <BedDouble className="w-5 h-5" />
                                    <span className="text-xs font-bold">Bed {bed}</span>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-900 font-medium">
                            Manage All Ward Rooms
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
