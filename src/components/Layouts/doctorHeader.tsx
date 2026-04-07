"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Settings, ChevronRight, Video, Activity } from "lucide-react";
import { auth } from "@/services/api";

export default function DoctorHeader() {
    const router   = useRouter();
    const [user, setUser]           = useState<any>(null);
    const [initials, setInitials]   = useState("DR");
    const [showProfile, setShowProfile] = useState(false);

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

    const signOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    return (
        <>
            {/* ── Clean Top Bar ─────────────────────────────────── */}
            <header className="bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between sticky top-0 z-50">

                {/* Left: title */}
                <div>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest">
                        Najbel Clinic
                    </p>
                    <h1 className="text-base font-black text-slate-900 leading-tight -mt-0.5">
                        Dr. {user?.full_name?.split(" ").slice(1).join(" ") || user?.full_name || "Dashboard"}
                    </h1>
                </div>

                {/* Right: bell + avatar */}
                <div className="flex items-center gap-2">
                    <button
                        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                        onClick={() => router.push("/dashboard/Doctor")}
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                    </button>

                    <button
                        onClick={() => setShowProfile(true)}
                        className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-[11px] font-black flex items-center justify-center shadow-md shadow-blue-200 active:scale-95 transition-transform shrink-0"
                    >
                        {initials}
                    </button>
                </div>
            </header>

            {/* ── Profile Bottom Sheet ─────────────────────────── */}
            {showProfile && (
                <>
                    <div
                        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
                        onClick={() => setShowProfile(false)}
                    />
                    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl">
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 bg-slate-200 rounded-full" />
                        </div>

                        {/* Profile card */}
                        <div className="mx-4 mb-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white text-xl font-black shrink-0">
                                {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-white font-black text-base leading-tight truncate">
                                    {user?.full_name || "Doctor"}
                                </p>
                                <p className="text-blue-200 text-xs mt-0.5 truncate">
                                    {user?.email || "Consultant Physician"}
                                </p>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                    <span className="text-emerald-300 text-[10px] font-bold">Online</span>
                                </div>
                            </div>
                        </div>

                        {/* Links */}
                        <div className="px-4 pb-2 space-y-0.5">
                            {[
                                { icon: Activity, label: "Dashboard",     href: "/dashboard/Doctor",          color: "text-blue-600",   bg: "bg-blue-50"   },
                                { icon: Video,    label: "Consultations", href: "/dashboard/consultations",   color: "text-violet-600", bg: "bg-violet-50" },
                                { icon: Settings, label: "Settings",      href: "/dashboard/settings",        color: "text-slate-600",  bg: "bg-slate-100" },
                            ].map(({ icon: Icon, label, href, color, bg }) => (
                                <button
                                    key={label}
                                    onClick={() => { router.push(href); setShowProfile(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 transition-colors"
                                >
                                    <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-4 h-4 ${color}`} />
                                    </div>
                                    <span className="flex-1 font-semibold text-slate-800 text-sm text-left">{label}</span>
                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                </button>
                            ))}

                            <button
                                onClick={signOut}
                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-red-50 transition-colors"
                            >
                                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                                    <LogOut className="w-4 h-4 text-red-500" />
                                </div>
                                <span className="flex-1 font-bold text-red-600 text-sm text-left">Sign Out</span>
                            </button>
                        </div>
                        <div className="h-8" />
                    </div>
                </>
            )}
        </>
    );
}
