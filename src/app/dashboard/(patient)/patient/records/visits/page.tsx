"use client";

import { FileText, Calendar } from "lucide-react";
import { consultations } from "@/services/api";
import { useState, useEffect } from "react";

export default function VisitHistoryPage() {
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await consultations.getMyHistory().catch(() => []);
                setVisits(data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    return (
        <div className="max-w-lg mx-auto pb-8 -mx-1">
            <div className="px-1 pt-1 mb-4">
                <h1 className="text-xl font-bold text-gray-900">Visit History</h1>
                <p className="text-[11px] text-gray-400 mt-0.5">Past consultations</p>
            </div>

            <div className="mx-1 space-y-1.5">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : visits.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                        <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-700 mb-1">No past visits</p>
                        <p className="text-[11px] text-gray-400">Visit records will appear here</p>
                    </div>
                ) : (
                    visits.map((visit) => (
                        <div key={visit.id} className="bg-white rounded-xl p-3 border border-gray-100/80 hover:border-blue-100 transition">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-[13px]">Consultation #{visit.id}</p>
                                    <p className="text-[10px] text-gray-400 truncate">
                                        {visit.diagnosis ? `Diagnosis: ${visit.diagnosis}` : "Pending"}
                                        {visit.symptoms && ` · ${visit.symptoms}`}
                                    </p>
                                </div>
                                <span className="text-[10px] text-gray-400 flex items-center gap-0.5 shrink-0">
                                    <Calendar className="w-2.5 h-2.5" /> Recent
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
