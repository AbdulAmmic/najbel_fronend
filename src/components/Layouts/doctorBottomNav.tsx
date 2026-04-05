"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, Calendar, Users,
    MessageSquare, Stethoscope,
} from "lucide-react";

const navItems = [
    { name: "Home",     href: "/dashboard/Doctor",              icon: LayoutDashboard },
    { name: "Patients", href: "/dashboard/Doctor/patients",     icon: Users },
    { name: "Chat",     href: "/dashboard/Doctor/chat",         icon: MessageSquare },
    { name: "Appts",    href: "/dashboard/Doctor/appointments", icon: Calendar },
    { name: "Consults", href: "/dashboard/consultations",       icon: Stethoscope },
];

export default function DoctorBottomNav() {
    const pathname = usePathname();

    return (
        /* Floating pill nav — sits above page bottom with side margins & full rounded corners */
        <nav className="fixed bottom-4 left-3 right-3 z-[100] md:hidden">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.14)] border border-gray-100/80 px-2 py-2">
                <div className="flex items-center justify-around">
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
                                className="flex flex-col items-center gap-1 px-2 py-1 transition-all active:scale-90 min-w-[52px]"
                            >
                                <div className={`
                                    w-10 h-7 flex items-center justify-center rounded-2xl transition-all duration-200
                                    ${isActive
                                        ? "bg-blue-600 shadow-lg shadow-blue-300/50"
                                        : ""
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
            </div>
        </nav>
    );
}
