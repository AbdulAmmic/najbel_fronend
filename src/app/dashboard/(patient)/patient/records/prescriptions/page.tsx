"use client";

import { useState, useEffect } from "react";
import { Pill, Search, Calendar } from "lucide-react";
import { prescriptions } from "@/services/api";

export default function PrescriptionsPage() {
    const [list, setList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await prescriptions.getAll().catch(() => []);
                setList(data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const filtered = list.filter(p => {
        const matchSearch = (p.medication || "").toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || p.status?.toLowerCase() === statusFilter;
        return matchSearch && matchStatus;
    });

    const statusStyle = (s: string) => {
        switch (s?.toLowerCase()) {
            case "active": return "bg-emerald-500/10 text-emerald-600";
            case "completed": return "bg-blue-500/10 text-blue-600";
            case "cancelled": return "bg-red-500/10 text-red-600";
            default: return "bg-gray-100 text-gray-500";
        }
    };

    return (
        <div className="max-w-lg mx-auto pb-8 -mx-1">
            <div className="px-1 pt-1 mb-4">
                <h1 className="text-xl font-bold text-gray-900">Prescriptions</h1>
                <p className="text-[11px] text-gray-400 mt-0.5">Your medications</p>
            </div>

            <div className="mx-1 flex gap-2 mb-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-blue-500 transition text-[13px] placeholder:text-gray-300"
                    />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 outline-none text-[12px] font-medium text-gray-600"
                >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            <div className="mx-1 space-y-1.5">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                        <Pill className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-700 mb-1">No prescriptions</p>
                        <p className="text-[11px] text-gray-400">Prescriptions will appear here</p>
                    </div>
                ) : (
                    filtered.map((rx) => (
                        <div key={rx.id} className="bg-white rounded-xl p-3 border border-gray-100/80 hover:border-violet-100 transition">
                            <div className="flex items-start justify-between mb-1.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                                        <Pill className="w-4 h-4 text-violet-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-[13px]">{rx.medication}</p>
                                        <p className="text-[10px] text-gray-400">{rx.dosage} · {rx.frequency}</p>
                                    </div>
                                </div>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${statusStyle(rx.status)}`}>
                                    {(rx.status || "active").toUpperCase()}
                                </span>
                            </div>
                            {rx.duration && <p className="text-[11px] text-gray-500 ml-[42px]">Duration: {rx.duration}</p>}
                            {rx.instructions && (
                                <div className="mt-2 ml-[42px] bg-gray-50 rounded-lg p-2">
                                    <p className="text-[10px] text-gray-500">{rx.instructions}</p>
                                </div>
                            )}
                            <div className="mt-2 ml-[42px] flex items-center gap-1 text-[10px] text-gray-400">
                                <Calendar className="w-2.5 h-2.5" />
                                Prescribed: {new Date(rx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
