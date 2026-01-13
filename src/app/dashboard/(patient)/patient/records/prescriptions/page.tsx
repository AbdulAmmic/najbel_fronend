"use client";

import { useState, useEffect } from "react";
import { Calendar, Download, Eye, Filter, Pill, Search } from "lucide-react";
import { prescriptions } from "@/services/api";

export default function PrescriptionsPage() {
    const [prescriptionsList, setPrescriptionsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        const fetchPrescriptions = async () => {
            try {
                const data = await prescriptions.getAll();
                setPrescriptionsList(data);
            } catch (err) {
                console.error("Failed to fetch prescriptions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPrescriptions();
    }, []);

    const filteredPrescriptions = prescriptionsList.filter(p => {
        const matchesSearch = p.medication?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || p.status?.toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "active":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "completed":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "cancelled":
                return "bg-red-50 text-red-700 border-red-200";
            default:
                return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Pill className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
                    <p className="text-gray-500">View your prescribed medications and instructions</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search prescriptions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-6 py-3 bg-gray-50 border border-gray-200 rounded-xl font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-gray-500">Loading prescriptions...</div>
                ) : filteredPrescriptions.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                            <Pill className="w-10 h-10 text-gray-300" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">No prescriptions found</h3>
                            <p className="text-gray-500">You don't have any prescriptions yet.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredPrescriptions.map((prescription) => (
                            <div key={prescription.id} className="p-6 border border-gray-100 rounded-2xl hover:border-blue-100 hover:bg-blue-50/30 transition group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Pill className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg">{prescription.medication}</h4>
                                            <p className="text-sm text-gray-500 mt-1">{prescription.dosage} • {prescription.frequency}</p>
                                            <p className="text-sm text-gray-600 mt-2">Duration: {prescription.duration}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(prescription.status)}`}>
                                        {prescription.status || "Active"}
                                    </span>
                                </div>

                                {prescription.instructions && (
                                    <div className="p-4 bg-gray-50 rounded-xl mb-4">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Instructions:</p>
                                        <p className="text-sm text-gray-600">{prescription.instructions}</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="w-4 h-4" />
                                        Prescribed: {new Date(prescription.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 text-gray-400 hover:text-blue-600 transition">
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-blue-600 transition">
                                            <Download className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
