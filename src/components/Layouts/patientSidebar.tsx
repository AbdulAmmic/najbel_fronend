"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  FileText,
  Wallet,
  HeartPulse,
  MessageSquare,
  LogOut,
  X,
  Home,
  Settings,
  HelpCircle,
  User,
  ChevronRight,
  Stethoscope,
  Pill,
} from "lucide-react";
import { useEffect, useState } from "react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  patientName?: string;
  patientAvatar?: string;
}

interface SubItem {
  name: string;
  icon: React.ElementType;
  href?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string | null;
  subItems?: SubItem[];
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard/patient",
    icon: LayoutDashboard,
  },
  {
    name: "Appointments",
    href: "/dashboard/patient/appointments",
    icon: CalendarCheck,
    badge: "2",
  },
  {
    name: "Medical Records",
    href: "/dashboard/patient/records",
    icon: FileText,
    subItems: [
      { name: "Lab Results", icon: Stethoscope, href: "/dashboard/patient/records/labs" },
      { name: "Prescriptions", icon: Pill, href: "/dashboard/patient/records/prescriptions" },
      { name: "Visit History", icon: FileText, href: "/dashboard/patient/records/visits" },
    ],
  },
  {
    name: "Wallet & Billing",
    href: "/dashboard/patient/wallets",
    icon: Wallet,
    badge: "1",
  },
  {
    name: "Vitals & Health",
    href: "/dashboard/patient/vitals",
    icon: HeartPulse,
  },
  {
    name: "Messages",
    href: "/dashboard/patient/messages",
    icon: MessageSquare,
    badge: "3",
  },
  {
    name: "Settings",
    href: "/dashboard/patient/settings",
    icon: Settings,
  },
];

export default function PatientSidebar({
  open,
  onClose,
  patientName = "Alex Johnson",
  patientAvatar,
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  /* Close on mobile route change only */
  useEffect(() => {
    if (open && typeof window !== "undefined" && window.innerWidth < 1024) {
      onClose();
    }
  }, [pathname]);

  const toggleItem = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((i) => i !== name)
        : [...prev, name]
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 h-screen flex flex-col
          bg-gradient-to-b from-white to-gray-50/40
          border-r border-gray-100 z-50
          transition-all duration-300
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "w-20" : "w-80"}
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <div>
                  <h2 className="font-bold text-gray-900">HealthPortal</h2>
                  <p className="text-xs text-gray-500">Patient Dashboard</p>
                </div>
              )}
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100"
              >
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${isCollapsed ? "rotate-180" : ""
                    }`}
                />
              </button>
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!isCollapsed && (
            <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="flex items-center gap-3">
                {patientAvatar ? (
                  <img
                    src={patientAvatar}
                    alt={patientName}
                    className="w-12 h-12 rounded-xl"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-200 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-700" />
                  </div>
                )}
                <div>
                  <p className="font-semibold">{patientName}</p>
                  <p className="text-xs text-gray-500">Patient</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            const expanded = expandedItems.includes(item.name);

            return (
              <div key={item.name}>
                <button
                  onClick={() =>
                    item.subItems ? toggleItem(item.name) : null
                  }
                  aria-expanded={expanded}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-xl
                    ${active ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100"}
                  `}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 flex-1"
                  >
                    <Icon className="w-5 h-5" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                  {!isCollapsed && item.subItems && (
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""
                        }`}
                    />
                  )}
                </button>

                {item.subItems && expanded && !isCollapsed && (
                  <div className="ml-10 mt-1 space-y-1">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.name}
                        href={sub.href!}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-blue-50"
                      >
                        <sub.icon className="w-4 h-4" />
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-xl">
            <LogOut className="w-5 h-5 text-red-600" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
