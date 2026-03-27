"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, CalendarCheck, FileText, Wallet, HeartPulse, MessageSquare,
  LogOut, X, Settings, User, Receipt, Pill, TestTubes, ChevronRight, ShoppingBag
} from "lucide-react";
import { useEffect, useState } from "react";
import { auth, billing } from "@/services/api";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  patientName?: string;
  patientAvatar?: string;
}

const mainNav = [
  { name: "Home", href: "/dashboard/patient", icon: Home },
  { name: "Appointments", href: "/dashboard/patient/appointments", icon: CalendarCheck },
  { name: "Pharmacy", href: "/dashboard/patient/pharmacy", icon: ShoppingBag },
  { name: "Wallet & Bills", href: "/dashboard/patient/wallets", icon: Wallet },
  { name: "Vitals", href: "/dashboard/patient/vitals", icon: HeartPulse },
  { name: "Chat", href: "/dashboard/patient/chat", icon: MessageSquare },
];

const recordsNav = [
  { name: "Lab Results", href: "/dashboard/patient/records/labs", icon: TestTubes },
  { name: "Prescriptions", href: "/dashboard/patient/records/prescriptions", icon: Pill },
  { name: "Visit History", href: "/dashboard/patient/records/visits", icon: FileText },
];

const bottomNav = [
  { name: "Settings", href: "/dashboard/patient/settings", icon: Settings },
];

export default function PatientSidebar({ open, onClose, patientName = "Patient", patientAvatar }: SidebarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [invoiceFilter, setInvoiceFilter] = useState<"all" | "pending">("all");

  useEffect(() => {
    auth.getMe().then(u => setUser(u)).catch(() => { });
    billing.getInvoices().then((inv: any[]) => {
      const pending = inv.filter(i => i.status?.toLowerCase() === "pending").length;
      setPendingCount(pending);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    if (open && typeof window !== "undefined" && window.innerWidth < 1024) onClose();
  }, [pathname]);

  const name = user?.full_name || patientName;
  const avatar = user?.profile_picture || patientAvatar;
  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />}

      <aside className={`
        fixed lg:sticky top-0 h-screen flex flex-col
        bg-white border-r border-gray-100 z-50
        transition-transform duration-300
        w-72
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-gray-900 leading-none">Najbel</p>
                <p className="text-[9px] text-gray-400 font-medium">Health Portal</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 lg:hidden">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Profile Card */}
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100/60">
            {avatar ? (
              <img src={avatar} alt={name} className="w-9 h-9 rounded-lg object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">{name}</p>
              <p className="text-[10px] text-gray-400">Patient</p>
            </div>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1.5">Menu</p>
          {mainNav.map(item => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition group ${active ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                <Icon className={`w-[18px] h-[18px] ${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"}`} />
                <span className="flex-1">{item.name}</span>
                {item.name === "Wallet & Bills" && pendingCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-md">{pendingCount}</span>
                )}
              </Link>
            );
          })}

          {/* Records */}
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider px-2 mt-4 mb-1.5">Records</p>
          {recordsNav.map(item => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition group ${active ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                <Icon className={`w-[18px] h-[18px] ${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Invoices Quick Section */}
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider px-2 mt-4 mb-1.5">Invoices</p>
          <div className="bg-gray-50 rounded-xl p-2 border border-gray-100/60">
            <div className="flex gap-1 mb-2">
              <button onClick={() => setInvoiceFilter("all")}
                className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold transition ${invoiceFilter === "all" ? "bg-white shadow-sm text-gray-900" : "text-gray-400"}`}>
                All
              </button>
              <button onClick={() => setInvoiceFilter("pending")}
                className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold transition flex items-center justify-center gap-1 ${invoiceFilter === "pending" ? "bg-white shadow-sm text-amber-600" : "text-gray-400"}`}>
                Pending {pendingCount > 0 && <span className="px-1 bg-amber-100 text-amber-600 rounded text-[8px]">{pendingCount}</span>}
              </button>
            </div>
            <Link href={`/dashboard/patient/wallets${invoiceFilter === "pending" ? "?filter=pending" : ""}`}
              className="flex items-center justify-between px-2 py-2 rounded-lg text-[12px] text-blue-600 bg-white hover:bg-blue-50 transition font-medium shadow-sm">
              <div className="flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5" />
                <span>{invoiceFilter === "pending" ? "View Pending" : "View All Invoices"}</span>
              </div>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-gray-50 space-y-0.5">
          {bottomNav.map(item => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition ${active ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                <Icon className="w-[18px] h-[18px]" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <button onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/login"; }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-red-500 hover:bg-red-50 transition">
            <LogOut className="w-[18px] h-[18px]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
