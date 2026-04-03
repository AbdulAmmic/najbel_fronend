"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  UserCircle,
  Search,
  ChevronDown,
  Settings,
  Menu,
  X,
  Wifi,
  WifiOff,
  LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, subscribeToNotifications } from "@/services/api";

interface HeaderProps {
  onMenuClick?: () => void;
  isSidebarCollapsed?: boolean;
}

export default function Header({ onMenuClick, isSidebarCollapsed }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    // Online/Offline Listener
    const handleStatusChange = () => setIsOfflineMode(!navigator.onLine);
    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);
    setIsOfflineMode(!navigator.onLine); // Initial check

    const fetchUser = async () => {
      try {
        const userData = await auth.getMe();
        setUser({
          name: userData.full_name,
          email: userData.email,
          role: userData.role === 'doctor' ? 'Medical Doctor' : userData.role,
          initials: userData.full_name.split(' ').map((n: string) => n[0]).join('')
        });
      } catch (error) {
        console.error("Failed to fetch user in header", error);
      }
    };
    fetchUser();

    // Subscribe to notifications
    const socket = subscribeToNotifications((msg) => {
      console.log("New notification:", msg);
      setNotificationCount(prev => prev + 1);
    });

    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
      if (socket) socket.close();
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full md:p-3 pointer-events-none">
        
        {/* Floating Inner Container */}
        <div className="bg-white/80 backdrop-blur-2xl border-b md:border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] md:rounded-2xl h-16 flex items-center justify-between px-4 sm:px-5 relative pointer-events-auto overflow-visible">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute inset-0 overflow-hidden md:rounded-2xl pointer-events-none">
            <div className="absolute top-0 right-1/4 w-32 h-32 bg-blue-300/10 blur-3xl mix-blend-multiply"></div>
          </div>

          {/* Left Section: Menu & Brand */}
          <div className="flex items-center gap-4 relative z-10">
            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                onMenuClick?.();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="p-2 rounded-xl hover:bg-gray-100/80 transition-colors md:hidden text-gray-700 hover:text-blue-600"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Right Section: Search & Actions */}
          <div className="flex items-center gap-3 relative z-10">

            {/* Online/Offline Status Indicator */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black tracking-wider uppercase transition-colors shadow-sm ${
              isOfflineMode
                ? 'bg-gray-50 border-gray-200 text-gray-500'
                : 'bg-green-50/50 border-green-200/50 text-green-700'
            }`}>
              {isOfflineMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span>{isOfflineMode ? 'Offline Mode' : 'Online'}</span>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:block relative group">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-12 py-2 w-64 bg-gray-50/50 hover:bg-gray-100/50 border border-gray-200 focus:bg-white rounded-[12px] text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all shadow-inner"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <span className="text-[10px] font-bold text-gray-400 bg-white px-1.5 py-0.5 rounded shadow-sm border border-gray-100">⌘K</span>
              </div>
            </div>

            {/* Notification Bell */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 rounded-[12px] bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all shadow-sm"
            >
              <Bell className="w-4 h-4 text-gray-600" />
              {notificationCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-red-500 to-rose-500 rounded-full ring-2 ring-white border border-red-600 shadow-sm"
                />
              )}
            </motion.button>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 p-1 pl-2.5 rounded-[12px] hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group"
              >
                <div className="relative">
                  <div className="h-8 w-8 rounded-[10px] bg-gradient-to-br from-blue-600 to-indigo-500 shadow-sm flex items-center justify-center border border-blue-400/20">
                    <span className="text-[11px] font-black text-white">{user?.initials || "NB"}</span>
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-2 text-left pr-1">
                  <div className="flex flex-col">
                    <p className="text-[13px] font-bold text-gray-900 leading-tight">{user?.name ? user.name.split(" ")[1] : "Doctor"}</p>
                    <p className="text-[10px] font-semibold text-blue-600 tracking-wide uppercase leading-tight">{user?.role || "Consultant"}</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180 text-blue-600' : ''}`} />
                </div>
              </button>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_12px_40px_rgb(0,0,0,0.12)] overflow-hidden z-50 ring-1 ring-gray-900/5"
                  >
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                      <p className="text-sm font-black text-gray-900 truncate">{user?.name || "Doctor"}</p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5 truncate">{user?.email || "doctor@najbel.com"}</p>
                      <div className="mt-2.5 px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-lg inline-block border border-blue-100/50 shadow-[inset_0_1px_2px_rgb(255,255,255)]">
                        {user?.role?.replace('_', ' ') || "Doctor"}
                      </div>
                    </div>

                    <div className="py-2 px-2">
                      {[
                        { icon: UserCircle, label: 'My Profile' },
                        { icon: Settings, label: 'Preferences' },
                        { icon: Bell, label: 'Notifications' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 rounded-xl transition-colors group"
                        >
                          <item.icon className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="p-2 border-t border-gray-100">
                      <button 
                        onClick={() => {
                            if (typeof window !== 'undefined') localStorage.removeItem("token");
                            window.location.href = "/login";
                        }}
                        className="w-full px-3 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-3 group"
                      >
                        <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors"/>
                        End Local Session
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3 pt-2 pointer-events-auto">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients, records..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 shadow-sm"
            />
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-b border-gray-200/60 px-4 py-4 shadow-lg fixed top-16 left-0 right-0 z-30"
          >
            <div className="flex flex-col gap-1">
              {['Dashboard', 'Patients', 'Schedule', 'Records', 'Analytics'].map((item) => (
                <button
                  key={item}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl ${item === 'Dashboard'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                    }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}