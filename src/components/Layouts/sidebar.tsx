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
  // On desktop: collapsed = icon-strip. On mobile: collapsed = hidden drawer.
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

  // Dynamic Items based on Role
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

      // Try getting from localStorage primarily for speed
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const u = JSON.parse(storedUser);
        role = u.role;
        name = u.full_name;
      } else {
        // Fallback to API if not in local
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

        // Set Navigation
        const nav = ROLE_NAVIGATION[role] || ROLE_NAVIGATION["doctor"]; // Fallback to doctor/default
        setVisibleItems(nav);
      }
    };
    initSidebar();
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCollapsed(true)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        // Mobile: slide in/out as a drawer. Desktop: always visible, width-based collapse.
        initial={false}
        animate={isMobile ? { x: collapsed ? -300 : 0 } : { x: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 200 }}
        className={`fixed md:sticky top-0 left-0 h-screen z-50 flex flex-col`}
      >
        {/* Toggle Button (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 z-50 hidden md:flex items-center justify-center h-6 w-6 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-all hover:scale-110"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-gray-600" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-gray-600" />
          )}
        </button>

        {/* Sidebar Container — desktop: icon-strip (72px) or full (240px). Mobile always 256px when open */}
        <div className={`flex flex-col h-full bg-white/95 backdrop-blur-xl border-r border-gray-200/60 overflow-hidden transition-all duration-300 ${
          isMobile ? 'w-64' : collapsed ? 'w-[72px]' : 'w-60'
        }`}>
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-200/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 shadow-sm flex items-center justify-center">
                  <div className="h-6 w-6 bg-white/90 rounded-lg" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-xl opacity-10 blur-sm" />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex-1"
                  >
                    <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Najbel Clinic
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                      Healthcare Management
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {visibleItems.map((item) => (
              <SidebarItemComponent
                key={item.label}
                item={item}
                collapsed={collapsed}
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

          {/* Bottom Section */}
          <div className="border-t border-gray-200/50 py-4 px-3 space-y-1">
            {BOTTOM_ITEMS.map((item) => (
              <SidebarItemComponent
                key={item.label}
                item={item}
                collapsed={collapsed}
                activeItem={activeItem}
                onItemClick={(label) => setActiveItem(label)}
              />
            ))}

            {/* Logout Button */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') localStorage.removeItem("token");
                window.location.href = "/login";
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50/50 transition-colors group"
            >
              <div className="p-1.5 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors">
                <LogOut className="w-4 h-4" />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-sm font-medium"
                  >
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* User Info */}
            <div className="px-3 pt-4 mt-4 border-t border-gray-200/50">
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
                      <span className="text-xs font-semibold text-white">{userInitials}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{userName}</p>
                      <p className="text-xs text-gray-500 capitalize">{userRole?.replace('_', ' ') || "Staff"}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed bottom-4 left-4 z-40 md:hidden flex items-center justify-center h-12 w-12 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
      >
        <ChevronRight className={`w-5 h-5 transition-transform ${collapsed ? "" : "rotate-180"}`} />
      </button>
    </>
  );
}

function SidebarItemComponent({
  item,
  collapsed,
  activeItem,
  expandedItems,
  onItemClick,
  onToggleExpand
}: {
  item: SidebarItem;
  collapsed: boolean;
  activeItem: string;
  expandedItems?: string[];
  onItemClick: (label: string) => void;
  onToggleExpand?: (label: string) => void;
}) {
  const isExpanded = expandedItems?.includes(item.label);
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const router = useRouter();

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => {
          if (hasSubItems && onToggleExpand) {
            onToggleExpand(item.label);
          } else {
            onItemClick(item.label);
            router.push(item.path);
          }
        }}
        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 ${activeItem === item.label
          ? "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
          }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${activeItem === item.label
            ? "bg-gradient-to-br from-blue-500 to-cyan-400 text-white"
            : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
            }`}>
            <item.icon className="w-4 h-4" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-sm font-medium"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          {item.badge && !collapsed && (
            <span className="px-1.5 py-0.5 text-xs font-semibold bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full min-w-[20px] text-center">
              {item.badge}
            </span>
          )}
          {hasSubItems && !collapsed && (
            <ChevronRight className={`w-3 h-3 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
          )}
        </div>
      </button>

      {/* Sub Items */}
      <AnimatePresence>
        {hasSubItems && isExpanded && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-9 pl-3 border-l border-gray-200/50 space-y-0.5"
          >
            {item.subItems!.map((subItem) => (
              <Link
                key={subItem.path}
                href={subItem.path}
                className="block px-3 py-2 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100/30 rounded-lg transition-colors"
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