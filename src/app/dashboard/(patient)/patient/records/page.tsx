"use client";

import { FileText, Search, Filter, Eye, Download } from "lucide-react";
import { consultations } from "@/services/api";
import { useState, useEffect } from "react";

export default function PatientRecordsPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const data = await consultations.getMyHistory();
                setRecords(data);
            } catch (err) {
                console.error("Failed to fetch records", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <FileText className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
                    <p className="text-gray-500">Your health history and documents</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <button className="px-6 py-3 bg-gray-50 text-gray-600 rounded-xl font-semibold hover:bg-gray-100 transition flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filter
                    </button>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-gray-500">Loading your records...</div>
                ) : records.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                            <FileText className="w-10 h-10 text-gray-300" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">No records found</h3>
                            <p className="text-gray-500">You don't have any medical records yet.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {records.map((record) => (
                            <div key={record.id} className="p-4 border border-gray-100 rounded-2xl hover:border-blue-100 hover:bg-blue-50/30 transition group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{record.title || "Medical Report"}</h4>
                                            <p className="text-sm text-gray-500">{new Date(record.created_at).toLocaleDateString()}</p>
                                        </div>
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
