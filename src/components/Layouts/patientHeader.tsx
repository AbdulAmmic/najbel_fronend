"use client";

import { Bell, User, Search } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { auth } from "@/services/api";

interface PatientHeaderProps {
  onMenuClick: () => void;
  patientName?: string;
  patientAvatar?: string;
}

export default function PatientHeader({
  onMenuClick,
  patientName = "Patient",
  patientAvatar,
}: PatientHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [name, setName] = useState(patientName);
  const [avatar, setAvatar] = useState(patientAvatar || "");

  useEffect(() => {
    auth.getMe().then((u: any) => {
      if (u?.full_name) setName(u.full_name);
      if (u?.profile_picture) setAvatar(u.profile_picture);
    }).catch(() => { });
  }, []);

  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#F8FAFC]/80">
      <div className="h-14 px-4 flex items-center justify-between">
        {/* Left: Menu + Greeting */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl hover:bg-gray-50 transition lg:hidden"
            aria-label="Open menu"
          >
            <div className="w-4 h-3.5 flex flex-col justify-between">
              <span className="w-full h-[2px] bg-gray-700 rounded-full" />
              <span className="w-3/4 h-[2px] bg-gray-400 rounded-full" />
              <span className="w-1/2 h-[2px] bg-gray-300 rounded-full" />
            </div>
          </button>
          <div>
            <p className="text-[13px] font-bold text-gray-900 leading-none">{name.split(" ")[0]}</p>
            <p className="text-[9px] text-gray-400 font-medium mt-0.5">Najbel Health</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Search */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition md:hidden"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          {/* Desktop Search */}
          <div className="hidden md:block relative w-56 mr-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-[12px] outline-none focus:border-blue-400 transition"
            />
          </div>

          {/* Notifications */}
          <Link href="/dashboard/patient/notifications" className="relative p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition">
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-[1.5px] border-white rounded-full" />
          </Link>

          {/* Avatar */}
          <Link href="/dashboard/patient/settings" className="ml-1">
            {avatar ? (
              <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover border border-gray-100" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold">
                {initials}
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Search Expand */}
      {showSearch && (
        <div className="px-4 pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
            <input
              type="text"
              placeholder="Search records, meds..."
              className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-[12px] outline-none focus:border-blue-400 transition"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}
