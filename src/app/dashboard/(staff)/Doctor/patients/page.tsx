"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Users, Search, Phone, Mail, Calendar, Activity,
    ChevronRight, Heart, Thermometer, Clock, User2
} from "lucide-react";
import { patientService, appointments } from "@/services/api";

export default function MyPatientsPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    useEffect(() => {
        (async () => {
            try {
                const data = await patientService.getAll();
                setPatients(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch patients", err);
                setPatients([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = patients.filter((p) => {
        const s = searchTerm.toLowerCase();
        const name = p.user?.full_name || p.full_name || "";
        const email = p.user?.email || p.email || "";
        const phone = p.phone_number || p.phone || "";
        const matchSearch = !s || name.toLowerCase().includes(s) || email.toLowerCase().includes(s) || phone.includes(s);
        const matchStatus = filterStatus === "all" || (p.status || "active") === filterStatus;
        return matchSearch && matchStatus;
    });

    const getInitials = (p: any) => {
        const name = p.user?.full_name || p.full_name || "P";
        return name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
    };

    const getName = (p: any) => p.user?.full_name || p.full_name || "Unknown Patient";
    const getEmail = (p: any) => p.user?.email || p.email || "—";
    const getPhone = (p: any) => p.phone_number || p.phone || "—";
    const getGender = (p: any) => p.gender || "—";
    const getBloodGroup = (p: any) => p.blood_group || "—";

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-5 py-5">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">My Patients</h1>
                            <p className="text-sm text-gray-400 mt-0.5">
                                {loading ? "Loading..." : `${patients.length} patients registered`}
                            </p>
                        </div>
                        {/* No create button for doctor */}
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>

                    {/* Search + Filter */}
                    <div className="flex gap-2 mt-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name, email or phone..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all text-gray-700 placeholder:text-gray-400"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-blue-400 transition capitalize appearance-none"
                        >
                            <option value="all">All</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    {/* summary stats */}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        {[
                            { label: "Total", value: patients.length, color: "text-gray-900" },
                            { label: "Active", value: patients.filter(p => (p.status || "active") === "active").length, color: "text-emerald-600" },
                            { label: "Showing", value: filtered.length, color: "text-blue-600" },
                        ].map((s, i) => (
                            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm">
                                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                                <div className="text-[10px] text-gray-400 font-medium mt-0.5">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-5 py-5 pb-28">
                {loading ? (
                    <div className="flex flex-col items-center py-24 gap-3">
                        <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-400">Fetching patients...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-24 gap-3 text-gray-400">
                        <Users className="w-10 h-10 opacity-30" />
                        <p className="text-sm font-medium">No patients found</p>
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="text-xs text-blue-600 hover:underline">
                                Clear search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((patient) => {
                            const initials = getInitials(patient);
                            const status = patient.status || "active";
                            return (
                                <div
                                    key={patient.id}
                                    onClick={() => router.push(`/dashboard/Doctor/patients/${patient.id}`)}
                                    className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer active:scale-[0.99] group"
                                >
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                                        {initials}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="font-semibold text-gray-900 text-sm truncate">{getName(patient)}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                                status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                                            }`}>
                                                {status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                                <Mail className="w-3 h-3" /> {getEmail(patient)}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                                <Phone className="w-3 h-3" /> {getPhone(patient)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-lg">
                                                {getGender(patient)}
                                            </span>
                                            <span className="text-[11px] text-red-500 bg-red-50 px-2 py-0.5 rounded-lg font-semibold">
                                                {getBloodGroup(patient)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}