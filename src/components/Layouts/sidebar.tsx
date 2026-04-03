"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ROLE_NAVIGATION, BOTTOM_ITEMS, SidebarItem } from "@/config/navigation";
import { auth } from "@/services/api";

export default function ClinicSidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Doctor");
  const [userInitials, setUserInitials] = useState<string>("DR");

  const [visibleItems, setVisibleItems] = useState<SidebarItem[]>([]);

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  useEffect(() => {
    const initSidebar = async () => {
      let role = null;
      let name = "Doctor";

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const u = JSON.parse(storedUser);
        role = u.role;
        name = u.full_name;
      } else {
        try {
          const u = await auth.getMe();
          role = u.role;
          name = u.full_name;
        } catch (e) { console.error(e) }
      }

      if (role) {
        setUserRole(role);
        setUserName(name);
        setUserInitials(name.split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase());

        const nav = ROLE_NAVIGATION[role] || ROLE_NAVIGATION["doctor"];
        setVisibleItems(nav);
      }
    };
    initSidebar();
  }, []);

  return (
    <>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCollapsed(true)}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={isMobile ? { x: collapsed ? -300 : 0 } : { x: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 200 }}
        className="fixed md:sticky top-0 left-0 h-screen z-50 flex flex-col p-3 md:pr-0"
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-10 z-50 hidden md:flex items-center justify-center h-7 w-7 bg-white border border-gray-100 rounded-full shadow-[0_4px_12px_rgb(0,0,0,0.1)] hover:shadow-md transition-all hover:scale-105"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-blue-600" />
          )}
        </button>

        <div className={`flex flex-col h-full bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl md:rounded-r-none md:border-r-0 overflow-hidden transition-all duration-300 relative ${
          isMobile ? 'w-64' : collapsed ? 'w-[72px]' : 'w-60'
        }`}>
          {/* Abstract Ambient Overlay */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 blur-3xl rounded-full mix-blend-multiply pointer-events-none"></div>

          <div className="p-5 border-b border-gray-100/60 relative z-10 w-full items-center">
            <div className={`flex items-center ${collapsed && !isMobile ? 'justify-center' : 'justify-start'} gap-3 w-full`}>
              <div className="relative shrink-0">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm flex items-center justify-center">
                  <div className="h-3 w-3 bg-white rounded-full ml-[-4px] mt-[-4px]" />
                  <div className="h-4 w-4 bg-white/70 rounded-br-lg ml-[2px] mt-[2px]" />
                </div>
              </div>
              <AnimatePresence>
                {(!collapsed || isMobile) && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex-1 whitespace-nowrap overflow-hidden"
                  >
                    <h2 className="text-base font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
                      Najbel Systems
                    </h2>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1 z-10 custom-scrollbar">
            {visibleItems.map((item) => (
              <SidebarItemComponent
                key={item.label}
                item={item}
                collapsed={collapsed}
                isMobile={isMobile}
                activeItem={activeItem}
                expandedItems={expandedItems}
                onItemClick={(label) => {
                  setActiveItem(label);
                  if (item.subItems) {
                    toggleExpand(label);
                  }
                }}
                onToggleExpand={toggleExpand}
              />
            ))}
          </nav>

          <div className="pt-2 pb-4 px-3 space-y-1 relative z-10 bg-gradient-to-t from-white via-white/90 to-transparent">
            {BOTTOM_ITEMS.map((item) => (
              <SidebarItemComponent
                key={item.label}
                item={item}
                collapsed={collapsed}
                isMobile={isMobile}
                activeItem={activeItem}
                onItemClick={(label) => setActiveItem(label)}
              />
            ))}

            <button
              onClick={() => {
                if (typeof window !== 'undefined') localStorage.removeItem("token");
                window.location.href = "/login";
              }}
              className={`w-full flex items-center ${collapsed && !isMobile ? 'justify-center' : 'justify-start'} gap-3 px-3 py-3 mt-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors group relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-red-100 opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <LogOut className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" />
              <AnimatePresence>
                {(!collapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-bold whitespace-nowrap"
                  >
                    End Session
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <div className={`pt-4 mt-2 border-t border-gray-100/80 flex items-center ${collapsed && !isMobile ? 'justify-center' : 'px-2'}`}>
              <div className="h-9 w-9 shrink-0 rounded-[10px] bg-gradient-to-br from-blue-100 to-indigo-50 border border-blue-200/50 flex items-center justify-center text-blue-700 font-bold text-xs ring-2 ring-white shadow-sm">
                {userInitials}
              </div>
              <AnimatePresence>
                {(!collapsed || isMobile) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="ml-3 flex-1 overflow-hidden"
                  >
                    <p className="text-sm font-bold text-gray-900 truncate">{userName}</p>
                    <p className="text-[10px] uppercase tracking-wider text-blue-600 font-bold truncate">{userRole?.replace('_', ' ') || "Staff"}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.aside>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed bottom-6 right-6 z-40 md:hidden flex items-center justify-center h-12 w-12 bg-gray-900 text-white rounded-full shadow-2xl hover:scale-105 transition-all"
      >
        <ChevronRight className={`w-5 h-5 transition-transform ${collapsed ? "" : "rotate-180"}`} />
      </button>
    </>
  );
}

function SidebarItemComponent({
  item,
  collapsed,
  isMobile,
  activeItem,
  expandedItems,
  onItemClick,
  onToggleExpand
}: {
  item: SidebarItem;
  collapsed: boolean;
  isMobile: boolean;
  activeItem: string;
  expandedItems?: string[];
  onItemClick: (label: string) => void;
  onToggleExpand?: (label: string) => void;
}) {
  const isExpanded = expandedItems?.includes(item.label);
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const router = useRouter();
  const isActive = activeItem === item.label;

  return (
    <div className="space-y-1">
      <button
        onClick={() => {
          if (hasSubItems && onToggleExpand) {
            onToggleExpand(item.label);
          } else {
            onItemClick(item.label);
            router.push(item.path);
          }
        }}
        className={`relative w-full flex items-center ${collapsed && !isMobile ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-xl transition-all duration-300 group overflow-hidden ${
          isActive
            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/80"
        }`}
      >
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-100"></div>
        )}

        <div className="relative z-10 flex items-center gap-3">
          <item.icon className={`w-[18px] h-[18px] transition-colors ${isActive ? "text-white" : "text-gray-400 group-hover:text-blue-600"}`} />
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`text-[13px] font-semibold whitespace-nowrap ${isActive ? 'text-white' : ''}`}
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          {item.badge && (!collapsed || isMobile) && (
            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full min-w-[20px] text-center ${
              isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
            }`}>
              {item.badge}
            </span>
          )}
          {hasSubItems && (!collapsed || isMobile) && (
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""} ${isActive ? "text-white/70" : "text-gray-400"}`} />
          )}
        </div>
      </button>

      <AnimatePresence>
        {hasSubItems && isExpanded && (!collapsed || isMobile) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-[22px] pl-[18px] border-l-2 border-gray-100 space-y-1 pt-1"
          >
            {item.subItems!.map((subItem) => (
              <Link
                key={subItem.path}
                href={subItem.path}
                className="block px-3 py-2 text-[12px] font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-colors"
              >
                {subItem.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}