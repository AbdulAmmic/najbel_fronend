"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Bell, Search, Stethoscope, Calendar, Users,
    MessageSquare, LayoutDashboard,
    ChevronDown, X, LogOut, Settings
} from "lucide-react";
import { auth } from "@/services/api";

const NAV_ITEMS = [
    { name: "Home",     href: "/dashboard/Doctor",              icon: LayoutDashboard },
    { name: "Patients", href: "/dashboard/Doctor/patients",     icon: Users },
    { name: "Chat",     href: "/dashboard/Doctor/chat",         icon: MessageSquare },
    { name: "Appts",    href: "/dashboard/Doctor/appointments", icon: Calendar },
    { name: "Consults", href: "/dashboard/consultations",       icon: Stethoscope },
];

export default function DoctorHeader() {
    const pathname = usePathname();
    const [name, setName]         = useState("Doctor");
    const [initials, setInitials] = useState("DR");
    const [email, setEmail]       = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [search, setSearch]     = useState("");

    useEffect(() => {
        auth.getMe().then((u: any) => {
            if (u?.full_name) {
                setName(u.full_name);
                setEmail(u.email || "");
                setInitials(
                    u.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                );
            }
        }).catch(() => {});
    }, []);

    const firstName = name.split(" ")[0];
    const lastName  = name.split(" ").slice(-1)[0];

    return (
        <>
            {/* ── Floating rounded header ── */}
            <header className="sticky top-0 z-40 px-3 pt-3">
                <div className="bg-white/95 backdrop-blur-2xl rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.10)] border border-gray-100/80 overflow-hidden">

                    {/* Top bar */}
                    <div className="h-14 px-4 flex items-center gap-3">

                        {/* Avatar + Name (tappable → profile sheet) */}
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="flex items-center gap-2.5 flex-1 min-w-0 active:opacity-70 transition-opacity"
                        >
                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[12px] font-black shadow-md shadow-blue-200 flex-shrink-0">
                                {initials}
                            </div>
                            <div className="text-left min-w-0 flex-1">
                                <p className="text-[13px] font-black text-gray-900 leading-none truncate">
                                    Dr. {lastName}
                                </p>
                                <p className="text-[10px] text-blue-500 font-bold mt-0.5">Consultant Physician</p>
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${showMenu ? "rotate-180" : ""}`} />
                        </button>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
                            >
                                <Search className="w-[18px] h-[18px]" />
                            </button>
                            <Link
                                href="/dashboard/Doctor"
                                className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
                            >
                                <Bell className="w-[18px] h-[18px]" />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
                            </Link>
                        </div>
                    </div>

                    {/* Inline search */}
                    {showSearch && (
                        <div className="px-4 pb-3">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    autoFocus
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search patients, records…"
                                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                                />
                                <button
                                    onClick={() => { setSearch(""); setShowSearch(false); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center"
                                >
                                    <X className="w-3 h-3 text-gray-500" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tab nav strip */}
                    <div className="flex px-3 gap-0.5 overflow-x-auto no-scrollbar pb-2">
                        {NAV_ITEMS.map(item => {
                            const isActive = item.href === "/dashboard/Doctor"
                                ? pathname === item.href
                                : pathname.startsWith(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold whitespace-nowrap rounded-xl transition-all ${
                                        isActive
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-400 hover:text-gray-600"
                                    }`}
                                >
                                    <Icon className="w-3 h-3" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* ── Profile dropdown sheet ── */}
            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="fixed top-[88px] left-3 right-3 z-50 bg-white rounded-[24px] shadow-[0_16px_48px_rgba(0,0,0,0.16)] border border-gray-100 overflow-hidden">
                        {/* Gradient user card */}
                        <div className="px-5 py-4 bg-gradient-to-br from-blue-600 to-indigo-700">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-base font-black border border-white/30">
                                    {initials}
                                </div>
                                <div>
                                    <p className="text-white font-black text-sm">Dr. {firstName} {lastName}</p>
                                    <p className="text-blue-200 text-xs font-medium mt-0.5">{email || "Consultant Physician"}</p>
                                    <span className="mt-1.5 inline-block px-2 py-0.5 bg-white/20 rounded-full text-[10px] text-white font-bold">Medical Doctor</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick links */}
                        <div className="p-3 space-y-1">
                            {[
                                { icon: Settings, label: "Settings", href: "/dashboard/settings" },
                                { icon: Bell,     label: "Notifications", href: "/dashboard/Doctor" },
                            ].map(item => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setShowMenu(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 text-gray-700 text-sm font-semibold transition"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                                        <item.icon className="w-4 h-4 text-gray-500" />
                                    </div>
                                    {item.label}
                                </Link>
                            ))}
                            <button
                                onClick={() => {
                                    if (typeof window !== "undefined") localStorage.removeItem("token");
                                    window.location.href = "/login";
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-50 text-red-600 text-sm font-bold transition"
                            >
                                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                                    <LogOut className="w-4 h-4 text-red-500" />
                                </div>
                                Sign Out
                            </button>
                        </div>
                        <div className="h-2" />
                    </div>
                </>
            )}
        </>
    );
}
