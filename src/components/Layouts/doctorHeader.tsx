"use client";

import { Bell, Search, Stethoscope } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { auth } from "@/services/api";

export default function DoctorHeader() {
    const [name, setName] = useState("Doctor");
    const [initials, setInitials] = useState("DR");
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        auth.getMe().then((u: any) => {
            if (u?.full_name) {
                setName(u.full_name);
                setInitials(
                    u.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                );
            }
        }).catch(() => {});
    }, []);

    return (
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-gray-100/60">
            <div className="h-14 px-4 flex items-center justify-between">
                {/* Left: Logo + Greeting */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-200">
                        <Stethoscope className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-gray-900 leading-none">Dr. {name.split(" ").slice(-1)[0]}</p>
                        <p className="text-[9px] text-gray-400 font-medium mt-0.5">Najbel Clinic</p>
                    </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition md:hidden"
                    >
                        <Search className="w-[18px] h-[18px]" />
                    </button>

                    {/* Desktop search */}
                    <div className="hidden md:block relative w-56 mr-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                        <input
                            type="text"
                            placeholder="Search patients, records..."
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-[12px] outline-none focus:border-blue-400 transition"
                        />
                    </div>

                    <Link href="/dashboard/Doctor" className="relative p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition">
                        <Bell className="w-[18px] h-[18px]" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-[1.5px] border-white rounded-full" />
                    </Link>

                    <Link href="/dashboard/settings" className="ml-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold">
                            {initials}
                        </div>
                    </Link>
                </div>
            </div>

            {showSearch && (
                <div className="px-4 pb-3 md:hidden">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                        <input
                            type="text"
                            placeholder="Search patients, records..."
                            className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-[12px] outline-none focus:border-blue-400 transition"
                            autoFocus
                        />
                    </div>
                </div>
            )}
        </header>
    );
}
