"use client";

import { useState, useEffect } from "react";
import { Activity, Calendar, Download, Eye, FileText, Filter, Search } from "lucide-react";
import { labs } from "@/services/api";

export default function LabResultsPage() {
    const [labResults, setLabResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchLabs = async () => {
            try {
                const data = await labs.getAll();
                setLabResults(data);
            } catch (err) {
                console.error("Failed to fetch lab results", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLabs();
    }, []);

    const filteredResults = labResults.filter(lab =>
        lab.test_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lab.result?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "normal":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "abnormal":
                return "bg-red-50 text-red-700 border-red-200";
            case "pending":
                return "bg-amber-50 text-amber-700 border-amber-200";
            default:
                return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                    <Activity className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Lab Results</h1>
                    <p className="text-gray-500">View your laboratory test results and reports</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search lab results..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <button className="px-6 py-3 bg-gray-50 text-gray-600 rounded-xl font-semibold hover:bg-gray-100 transition flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filter
                    </button>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-gray-500">Loading lab results...</div>
                ) : filteredResults.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                            <Activity className="w-10 h-10 text-gray-300" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">No lab results found</h3>
                            <p className="text-gray-500">You don't have any lab results yet.</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Test Name</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Result</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Status</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Date</th>
                                    <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredResults.map((lab) => (
                                    <tr key={lab.id} className="hover:bg-gray-50 transition">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{lab.test_name}</p>
                                                    <p className="text-sm text-gray-500">{lab.test_type || "Lab Test"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-medium text-gray-900">{lab.result || "Pending"}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(lab.status)}`}>
                                                {lab.status || "Pending"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {new Date(lab.test_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-2">
                                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
