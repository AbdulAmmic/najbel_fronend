"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Calendar,
    Users,
    MessageSquare,
    Stethoscope,
} from "lucide-react";

const navItems = [
    { name: "Home",        href: "/dashboard/Doctor",              icon: LayoutDashboard },
    { name: "Patients",    href: "/dashboard/Doctor/patients",     icon: Users },
    { name: "Chat",        href: "/dashboard/Doctor/chat",         icon: MessageSquare },
    { name: "Appts",       href: "/dashboard/Doctor/appointments", icon: Calendar },
    { name: "Consults",    href: "/dashboard/consultations",       icon: Stethoscope },
];

export default function DoctorBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden">
            {/* Safe-area bottom padding for iPhone notch */}
            <div className="bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-around px-1 pt-2 pb-safe">
                    {navItems.map((item) => {
                        const isActive =
                            item.href === "/dashboard/Doctor"
                                ? pathname === item.href
                                : pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="flex flex-col items-center gap-1 px-3 py-1 min-w-[56px] transition-all active:scale-90"
                            >
                                <div className={`
                                    w-10 h-7 flex items-center justify-center rounded-2xl transition-all
                                    ${isActive
                                        ? "bg-blue-600 shadow-md shadow-blue-300/40"
                                        : "bg-transparent"
                                    }
                                `}>
                                    <Icon className={`w-[18px] h-[18px] transition-colors ${isActive ? "text-white" : "text-gray-400"}`} />
                                </div>
                                <span className={`text-[10px] font-bold leading-none transition-colors ${isActive ? "text-blue-600" : "text-gray-400"}`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
                {/* iPhone safe area spacer */}
                <div className="h-safe-area-inset-bottom bg-white/95" />
            </div>
        </nav>
    );
}
