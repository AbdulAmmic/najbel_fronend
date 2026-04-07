"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Bell, LogOut, Settings, ChevronRight, Video,
    Activity, Stethoscope, CalendarDays, Users, X,
    ShieldCheck, Wifi
} from "lucide-react";
import { auth } from "@/services/api";

export default function DoctorHeader() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [initials, setInitials] = useState("DR");
    const [showProfile, setShowProfile] = useState(false);
    const [time, setTime] = useState("");

    useEffect(() => {
        auth.getMe().then((u: any) => {
            if (u) {
                setUser(u);
                setInitials(
                    u.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "DR"
                );
            }
        }).catch(() => {});
    }, []);

    // Live clock
    useEffect(() => {
        const tick = () => setTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
        tick();
        const id = setInterval(tick, 30000);
        return () => clearInterval(id);
    }, []);

    const signOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 17) return "Good afternoon";
        return "Good evening";
    };

    const navItems = [
        { icon: Activity,     label: "Dashboard",    href: "/dashboard/Doctor",              color: "text-blue-600",   bg: "bg-blue-50"   },
        { icon: CalendarDays, label: "Appointments", href: "/dashboard/Doctor/appointments", color: "text-indigo-600", bg: "bg-indigo-50" },
        { icon: Users,        label: "Patients",     href: "/dashboard/Doctor/patients",     color: "text-violet-600", bg: "bg-violet-50" },
        { icon: Stethoscope,  label: "Chat",         href: "/dashboard/Doctor/chat",         color: "text-teal-600",   bg: "bg-teal-50"   },
        { icon: Settings,     label: "Settings",     href: "/dashboard/Doctor/settings",     color: "text-slate-600",  bg: "bg-slate-100" },
    ];

    return (
        <>
            {/* ── Premium Floating Pill Header ─────────────── */}
            <header className="fixed top-3 left-3 right-3 z-50 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.10)] border border-gray-100/80">
                <div className="px-4 h-[54px] flex items-center justify-between gap-3">

                    {/* Left: Brand + greeting */}
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Brand dot cluster */}
                        <div className="relative shrink-0">
                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-300/40">
                                <Stethoscope className="w-4.5 h-4.5 text-white" />
                            </div>
                            {/* Live dot */}
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
                        </div>

                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    Najbel Clinic
                                </p>
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">
                                    <Wifi className="w-2.5 h-2.5" /> Live
                                </span>
                            </div>
                            <h1 className="text-[15px] font-black text-slate-900 leading-tight -mt-px truncate">
                                {greeting()}, Dr. {user?.full_name?.split(" ")[0] || "Doctor"} 👋
                            </h1>
                        </div>
                    </div>

                    {/* Right: clock + bell + avatar */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Live time chip */}
                        <div className="hidden sm:flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5">
                            <span className="text-[11px] font-bold text-slate-500 tabular-nums">{time}</span>
                        </div>

                        {/* Notification bell */}
                        <button
                            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 active:bg-slate-100 transition-all active:scale-95"
                            onClick={() => router.push("/dashboard/Doctor")}
                            title="Notifications"
                        >
                            <Bell className="w-4.5 h-4.5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-[1.5px] border-white animate-pulse" />
                        </button>

                        {/* Avatar / profile trigger */}
                        <button
                            onClick={() => setShowProfile(true)}
                            className="relative w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-500 to-violet-600 text-white text-[11px] font-black flex items-center justify-center shadow-lg shadow-blue-300/50 active:scale-95 transition-all"
                        >
                            {initials}
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Profile Bottom Sheet ─────────────────────────── */}
            {showProfile && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowProfile(false)}
                    />

                    {/* Sheet */}
                    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[32px] shadow-2xl overflow-hidden">

                        {/* Close pill */}
                        <div className="flex items-center justify-between px-5 pt-4 pb-2">
                            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
                            <div />
                            <button
                                onClick={() => setShowProfile(false)}
                                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-all"
                            >
                                <X className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                        </div>

                        {/* Hero profile card */}
                        <div className="mx-4 mb-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-3xl p-4 overflow-hidden relative">
                            {/* Decorative blobs */}
                            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
                            <div className="absolute -bottom-6 -left-4 w-24 h-24 bg-white/5 rounded-full" />

                            <div className="flex items-center gap-4 relative">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white text-xl font-black shrink-0 shadow-inner">
                                    {initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-white font-black text-[15px] leading-tight truncate">
                                        Dr. {user?.full_name || "Doctor"}
                                    </p>
                                    <p className="text-blue-200 text-[11px] mt-0.5 truncate">
                                        {user?.email || "Consultant Physician"}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                            <span className="text-emerald-300 text-[10px] font-bold">Online</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <ShieldCheck className="w-3 h-3 text-blue-200" />
                                            <span className="text-blue-200 text-[10px] font-bold">Verified Doctor</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation links */}
                        <div className="px-4 pb-2 space-y-0.5">
                            {navItems.map(({ icon: Icon, label, href, color, bg }) => (
                                <button
                                    key={label}
                                    onClick={() => { router.push(href); setShowProfile(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-all group"
                                >
                                    <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                                        <Icon className={`w-4 h-4 ${color}`} />
                                    </div>
                                    <span className="flex-1 font-semibold text-slate-800 text-sm text-left">{label}</span>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                                </button>
                            ))}

                            <div className="h-px bg-slate-100 my-1" />

                            <button
                                onClick={signOut}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-rose-50 active:bg-rose-100 transition-all group"
                            >
                                <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
                                    <LogOut className="w-4 h-4 text-rose-500" />
                                </div>
                                <span className="flex-1 font-bold text-rose-600 text-sm text-left">Sign Out</span>
                            </button>
                        </div>

                        {/* Safe area bottom padding */}
                        <div className="h-8" />
                    </div>
                </>
            )}
        </>
    );
}
