"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Bell, Stethoscope, LogOut, Settings, X,
    ChevronRight, Video, Calendar, Users, MessageSquare,
    LayoutDashboard, Activity
} from "lucide-react";
import { auth, notifications } from "@/services/api";

const NAV_ITEMS = [
    { name: "Dashboard", href: "/dashboard/Doctor",              icon: LayoutDashboard },
    { name: "Patients",  href: "/dashboard/Doctor/patients",     icon: Users },
    { name: "Chat",      href: "/dashboard/Doctor/chat",         icon: MessageSquare },
    { name: "Schedule",  href: "/dashboard/Doctor/appointments", icon: Calendar },
    { name: "Consults",  href: "/dashboard/consultations",       icon: Stethoscope },
];

export default function DoctorHeader() {
    const pathname = usePathname();
    const router   = useRouter();
    const [user, setUser]             = useState<any>(null);
    const [initials, setInitials]     = useState("DR");
    const [showProfile, setShowProfile] = useState(false);
    const [unread, setUnread]         = useState(0);

    useEffect(() => {
        auth.getMe().then((u: any) => {
            if (u) {
                setUser(u);
                setInitials(
                    u.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "DR"
                );
            }
        }).catch(() => {});

        notifications.getAll().then((ns: any[]) => {
            setUnread((Array.isArray(ns) ? ns : []).filter((n: any) => !n.is_read).length);
        }).catch(() => {});
    }, []);

    const firstName = user?.full_name?.split(" ")[0] || "Doctor";
    const lastName  = user?.full_name?.split(" ").slice(-1)[0] || "";

    const signOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    return (
        <>
            {/* ─── Top Status Bar ─────────────────────────────────── */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
                <div className="flex items-center gap-3 px-4 h-14">

                    {/* Brand mark */}
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-black text-slate-900 tracking-tight">Najbel</span>

                    <div className="flex-1" />

                    {/* Notification bell */}
                    <Link
                        href="/dashboard/Doctor"
                        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors"
                    >
                        <Bell className="w-5 h-5" />
                        {unread > 0 && (
                            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 border-2 border-white">
                                {unread > 9 ? "9+" : unread}
                            </span>
                        )}
                    </Link>

                    {/* Avatar */}
                    <button
                        onClick={() => setShowProfile(true)}
                        className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[11px] font-black shadow-md shadow-blue-200 shrink-0 active:scale-95 transition-transform"
                    >
                        {initials}
                    </button>
                </div>

                {/* ─── Scrollable Tab Strip ───────────────────────── */}
                <div className="flex gap-1 px-3 pb-2 overflow-x-auto no-scrollbar">
                    {NAV_ITEMS.map(item => {
                        const isActive = item.href === "/dashboard/Doctor"
                            ? pathname === item.href
                            : pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                                    isActive
                                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                                        : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>
            </header>

            {/* ─── Profile Drawer ─────────────────────────────────── */}
            {showProfile && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
                        onClick={() => setShowProfile(false)}
                    />

                    {/* Bottom Sheet */}
                    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-slate-200 rounded-full" />
                        </div>

                        {/* Profile Card */}
                        <div className="mx-4 mt-2 mb-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white text-xl font-black shrink-0">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p className="text-white font-black text-base leading-tight">
                                    Dr. {firstName} {lastName}
                                </p>
                                <p className="text-blue-200 text-xs mt-0.5 truncate">
                                    {user?.email || "Consultant Physician"}
                                </p>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                    <span className="text-emerald-300 text-[10px] font-bold">Active</span>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="px-4 pb-2 space-y-1">
                            {[
                                { icon: Activity,  label: "My Dashboard",   href: "/dashboard/Doctor",    color: "text-blue-600",   bg: "bg-blue-50" },
                                { icon: Video,     label: "Consultations",  href: "/dashboard/consultations", color: "text-violet-600", bg: "bg-violet-50" },
                                { icon: Settings,  label: "Settings",       href: "/dashboard/settings",  color: "text-slate-600",  bg: "bg-slate-50" },
                                { icon: Bell,      label: "Notifications",  href: "/dashboard/Doctor",    color: "text-amber-600",  bg: "bg-amber-50" },
                            ].map(item => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setShowProfile(false)}
                                    className="flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-slate-50 transition-colors"
                                >
                                    <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                                        <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
                                    </div>
                                    <span className="flex-1 font-semibold text-slate-800 text-sm">{item.label}</span>
                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                </Link>
                            ))}

                            {/* Sign Out */}
                            <button
                                onClick={signOut}
                                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-red-50 transition-colors mt-1"
                            >
                                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                                    <LogOut className="w-4 h-4 text-red-500" />
                                </div>
                                <span className="flex-1 font-bold text-red-600 text-sm text-left">Sign Out</span>
                            </button>
                        </div>

                        {/* Safe area */}
                        <div className="h-6" />
                    </div>
                </>
            )}
        </>
    );
}
