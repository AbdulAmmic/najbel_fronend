"use client";

import { useState, useEffect } from "react";
import { TestTubes, Search, Calendar } from "lucide-react";
import { labs } from "@/services/api";

export default function LabResultsPage() {
    const [labResults, setLabResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await labs.getAll().catch(() => []);
                setLabResults(data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const filtered = labResults.filter(l =>
        (l.test_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.result || "").toLowerCase().includes(search.toLowerCase())
    );

    const statusStyle = (s: string) => {
        switch (s?.toLowerCase()) {
            case "normal": return "bg-emerald-500/10 text-emerald-600";
            case "abnormal": return "bg-red-500/10 text-red-600";
            case "pending": return "bg-amber-500/10 text-amber-600";
            default: return "bg-gray-100 text-gray-500";
        }
    };

    return (
        <div className="max-w-lg mx-auto pb-8 -mx-1">
            <div className="px-1 pt-1 mb-4">
                <h1 className="text-xl font-bold text-gray-900">Lab Results</h1>
                <p className="text-[11px] text-gray-400 mt-0.5">Your laboratory tests</p>
            </div>

            <div className="mx-1 mb-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input type="text" placeholder="Search labs..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-blue-500 transition text-[13px] placeholder:text-gray-300"
                    />
                </div>
            </div>

            <div className="mx-1 space-y-1.5">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                        <TestTubes className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-700 mb-1">No lab results</p>
                        <p className="text-[11px] text-gray-400">Results will appear here</p>
                    </div>
                ) : (
                    filtered.map((lab) => (
                        <div key={lab.id} className="bg-white rounded-xl p-3 border border-gray-100/80 hover:border-purple-100 transition">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                                        <TestTubes className="w-4 h-4 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-[13px]">{lab.test_name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                                <Calendar className="w-2.5 h-2.5" />
                                                {lab.test_date ? new Date(lab.test_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "N/A"}
                                            </span>
                                            {lab.test_type && <span className="text-[10px] text-gray-400">· {lab.test_type}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[12px] text-gray-600 font-medium">{lab.result || "—"}</p>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${statusStyle(lab.status)}`}>
                                        {(lab.status || "pending").toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
