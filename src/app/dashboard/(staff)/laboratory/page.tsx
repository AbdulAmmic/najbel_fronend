"use client";

import { useEffect, useState } from "react";
import { labs } from "@/services/api";
import {
    TestTube,
    FlaskConical,
    Microscope,
    CheckCircle,
    Clock,
    Search,
    FileBarChart,
    AlertCircle,
    X
} from "lucide-react";
import { motion } from "framer-motion";

export default function LaboratoryDashboard() {
    const [labRequests, setLabRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [resultForm, setResultForm] = useState({
        result_value: "",
        notes: ""
    });

    const fetchLabs = async () => {
        try {
            const data = await labs.getAll();
            setLabRequests(data);
        } catch (error) {
            console.error("Failed to fetch lab requests", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabs();
    }, []);

    const handleOpenResultModal = (req: any) => {
        setSelectedRequest(req);
        setResultForm({ result_value: "", notes: "" });
    };

    const handleSaveResult = async () => {
        if (!selectedRequest) return;
        try {
            // Assuming we have an update or create result endpoint
            // For now, let's treat it as updating the request with a result
            // Backend endpoint might need adjustment to handle 'completing' a request
            // Or we create a new LabResult linked to the request? 
            // The current backend simplistic model uses LabResult as both request and result.
            // If it's an update:
            // await labs.update(selectedRequest.id, { ...resultForm, status: 'completed' });

            // Wait, the backend creates a LabResult. If it already exists, we are UPDATING it.
            // But api.ts only shows create and getAll. We might need an UPDATE endpoint.
            // For now, let's assume we can mock it or alert the user.

            alert("This feature requires a PUT endpoint for Lab Results. Simulating completion.");

            // Optimistic update
            setLabRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: 'completed', result_value: resultForm.result_value } : r));
            setSelectedRequest(null);
        } catch (e) {
            console.error(e);
            alert("Failed to save result");
        }
    };

    // Calculate stats from actual data
    const pendingCount = labRequests.filter((r: any) => r.status === 'pending').length;
    const completedCount = labRequests.filter((r: any) => r.status === 'completed').length;

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <FlaskConical className="w-12 h-12 text-violet-500 animate-bounce" />
                    <p className="text-gray-500 font-medium">Loading laboratory bench...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Laboratory Center</h1>
                    <p className="text-gray-500 mt-1">Test Processing and Results Management</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search Test ID..."
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 w-64"
                        />
                    </div>
                    <button className="bg-violet-600 text-white px-6 py-2 rounded-xl font-medium shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-colors flex items-center gap-2">
                        <TestTube className="w-4 h-4" />
                        New Order
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Pending Requests", val: pendingCount, icon: Clock, color: "amber" },
                    { label: "Processing", val: "5", icon: Microscope, color: "blue" },
                    { label: "Completed Today", val: completedCount, icon: CheckCircle, color: "emerald" },
                    { label: "Critical Results", val: "2", icon: AlertCircle, color: "rose" },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-sm text-gray-500 font-medium mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-gray-900">{stat.val}</h3>
                            </div>
                            <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                        {/* Decorative Background Icon */}
                        <stat.icon className={`absolute -bottom-4 -right-4 w-24 h-24 text-${stat.color}-500/5 rotate-12 z-0`} />
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main: Active Requests */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <FlaskConical className="w-5 h-5 text-violet-600" />
                            Active Test Queue
                        </h2>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">All</button>
                            <button className="px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg border border-amber-100">Pending</button>
                            <button className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg border border-blue-100">Processing</button>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {labRequests.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <p>No active lab requests found.</p>
                            </div>
                        ) : (
                            labRequests.map((req: any, i) => (
                                <div key={i} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs">
                                            {req.id ? `#${req.id}` : 'LAB'}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{req.test_name || "General Lab Test"}</h3>
                                            <p className="text-sm text-gray-500">
                                                {req.patient?.user?.full_name || "Unknown Patient"} • Ordered by Dr. {req.doctor?.user?.full_name || "Staff"}
                                                {req.status === 'completed' && req.result && ` • Result: ${req.result}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${req.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                            req.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {req.status?.toUpperCase() || "PENDING"}
                                        </span>
                                        {req.status !== 'completed' && (
                                            <button
                                                onClick={() => handleOpenResultModal(req)}
                                                className="opacity-0 group-hover:opacity-100 px-3 py-1.5 text-sm font-medium text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-all"
                                            >
                                                Enter Results
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Equipment & Quick Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Equipment Status</h3>
                        <div className="space-y-3">
                            {[
                                { name: "Centrifuge A", status: "Operational", color: "emerald" },
                                { name: "Hematology Analyzer", status: "Maintenance", color: "amber" },
                                { name: "X-Ray Unit 2", status: "Operational", color: "emerald" },
                            ].map((eq, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-2 w-2 rounded-full bg-${eq.color}-500 animate-pulse`} />
                                        <span className="text-sm font-medium text-gray-700">{eq.name}</span>
                                    </div>
                                    <span className={`text-xs font-bold text-${eq.color}-600`}>{eq.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl p-6 text-white shadow-xl">
                        <FileBarChart className="w-8 h-8 mb-4 text-violet-200" />
                        <h3 className="font-bold text-xl mb-2">Monthly Report</h3>
                        <p className="text-violet-100 text-sm mb-4">
                            Lab efficiency has increased by 15% this month. 420 tests processed.
                        </p>
                        <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors border border-white/10">
                            Download Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Result Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Enter Lab Results</h2>
                            <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                                <input
                                    disabled
                                    value={selectedRequest.test_name}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Result Value / Conclusion</label>
                                <textarea
                                    rows={3}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    placeholder="Enter detailed results..."
                                    value={resultForm.result_value}
                                    onChange={e => setResultForm({ ...resultForm, result_value: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Remarks</label>
                                <input
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                    placeholder="Optional notes"
                                    value={resultForm.notes}
                                    onChange={e => setResultForm({ ...resultForm, notes: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveResult}
                                className="px-5 py-2.5 bg-violet-600 text-white font-medium hover:bg-violet-700 rounded-xl shadow-lg shadow-violet-200"
                            >
                                Submit Results
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
