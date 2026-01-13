"use client";

import { FileText, Search, Calendar, User, ArrowRight } from "lucide-react";
import { consultations } from "@/services/api";
import { useState, useEffect } from "react";

export default function VisitHistoryPage() {
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await consultations.getMyHistory();
                setVisits(data);
            } catch (err) {
                console.error("Failed to fetch history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <FileText className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Visit History</h1>
                    <p className="text-gray-500">Your past consultations and diagnoses</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                {loading ? (
                    <div className="py-20 text-center text-gray-500">Loading history...</div>
                ) : visits.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <p className="text-gray-500">No past visits recorded.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {visits.map((visit) => (
                            <div key={visit.id} className="p-5 border border-gray-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/30 transition group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg">Consultation #{visit.id}</h4>
                                            <p className="text-sm text-gray-500 mt-1">Diagnosis: <span className="text-gray-700 font-medium">{visit.diagnosis || "Pending"}</span></p>
                                            <p className="text-sm text-gray-500 mt-1">{visit.symptoms && `Symptoms: ${visit.symptoms}`}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        {/* Mock date if not in model, typically Consultation has created_at or we use appointment date */}
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>Recent</span>
                                        </div>
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
