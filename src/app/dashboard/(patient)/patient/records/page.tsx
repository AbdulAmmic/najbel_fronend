"use client";

import { useState, useEffect } from "react";
import { FileText, Search, Eye } from "lucide-react";
import { consultations } from "@/services/api";

export default function PatientRecordsPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await consultations.getMyHistory().catch(() => []);
                setRecords(data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const filtered = records.filter(r =>
        (r.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.diagnosis || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-lg mx-auto pb-8 -mx-1">
            <div className="px-1 pt-1 mb-4">
                <h1 className="text-xl font-bold text-gray-900">Medical Records</h1>
                <p className="text-[11px] text-gray-400 mt-0.5">Your health history</p>
            </div>

            <div className="mx-1 mb-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                        type="text"
                        placeholder="Search records..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
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
                        <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-700 mb-1">No records</p>
                        <p className="text-[11px] text-gray-400">Your medical journey starts here</p>
                    </div>
                ) : (
                    filtered.map((record) => (
                        <div key={record.id} className="bg-white rounded-xl p-3 border border-gray-100/80 flex items-center justify-between hover:border-blue-100 transition group">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-[13px]">{record.title || "Medical Report"}</p>
                                    <p className="text-[10px] text-gray-400">{new Date(record.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                </div>
                            </div>
                            <button className="p-1.5 text-gray-300 hover:text-blue-500 transition">
                                <Eye className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
