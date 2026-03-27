"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, MessageSquare, HeartPulse, Settings } from "lucide-react";

const navItems = [
    { name: "Home", href: "/dashboard/patient", icon: Home },
    { name: "Appts", href: "/dashboard/patient/appointments", icon: Calendar },
    { name: "Chat", href: "/dashboard/patient/chat", icon: MessageSquare },
    { name: "Vitals", href: "/dashboard/patient/vitals", icon: HeartPulse },
    { name: "Settings", href: "/dashboard/patient/settings", icon: Settings },
];

export default function PatientBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-3 left-3 right-3 z-[100]">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl px-2 py-2 shadow-lg shadow-black/8 border border-gray-100/60">
                <div className="flex items-center justify-around">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-90 ${isActive ? "text-blue-600" : "text-gray-400"
                                    }`}
                            >
                                <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200" : ""}`}>
                                    <Icon className="w-[18px] h-[18px]" />
                                </div>
                                <span className={`text-[9px] font-semibold ${isActive ? "text-blue-600" : "text-gray-400"}`}>{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
