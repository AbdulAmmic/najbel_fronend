"use client";

import { useState } from "react";
import {
  Bell,
  UserCircle,
  Search,
  ChevronDown,
  Settings,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, subscribeToNotifications } from "@/services/api";
import { useEffect } from "react";

interface HeaderProps {
  onMenuClick?: () => void;
  isSidebarCollapsed?: boolean;
}

export default function Header({ onMenuClick, isSidebarCollapsed }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
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
      if (socket) socket.close();
    };
  }, []);



  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xl border-b border-gray-200/60 shadow-sm">
        <div className="h-16 flex items-center justify-between px-4 sm:px-6">
          {/* Left Section: Menu & Brand */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                onMenuClick?.();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="p-2 rounded-xl hover:bg-gray-100/80 transition-colors md:hidden"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>

            {/* Logo - Aligned with sidebar */}
            <div className="flex items-center gap-3">
              {/* Logo icon matching sidebar */}
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 shadow-sm flex items-center justify-center">
                  <div className="h-6 w-6 bg-white/90 rounded-lg" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-xl opacity-10 blur-sm" />
              </div>

              {/* Brand text */}
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Najbel Clinic
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Healthcare Management
                </p>
              </div>
            </div>


          </div>

          {/* Right Section: Search & Actions */}
          <div className="flex items-center gap-3">
            {/* Search Bar - Desktop */}
            <div className="hidden md:block relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients, records, appointments..."
                className="pl-10 pr-4 py-2.5 w-64 bg-gray-100/80 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>

            {/* Notification Bell */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2.5 rounded-xl hover:bg-gray-100/80 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {notificationCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 h-2 w-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full ring-2 ring-white"
                />
              )}
            </motion.button>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-1.5 pl-3 rounded-xl hover:bg-gray-100/80 transition-colors group"
              >
                <div className="relative">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">{user?.initials || "NB"}</span>
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-xl opacity-10 blur-sm group-hover:opacity-20 transition-opacity" />
                </div>

                <div className="hidden lg:block text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-gray-900">{user?.name ? user.name.split(" ")[1] : "Doctor"}</p>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </div>
                  <p className="text-xs text-gray-500">{user?.role || "Consultant"}</p>
                </div>
              </button>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200/60 shadow-lg overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user?.name || "Doctor"}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{user?.email || "doctor@najbel.com"}</p>
                      <div className="mt-2 px-2 py-1 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 text-xs font-medium rounded-lg inline-block">
                        {user?.role || "Doctor"}
                      </div>
                    </div>

                    <div className="py-1">
                      {[
                        { icon: Settings, label: 'Settings' },
                        { icon: UserCircle, label: 'Profile' },
                        { icon: Bell, label: 'Notifications' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50/80 transition-colors"
                        >
                          <item.icon className="w-4 h-4 text-gray-500" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="p-2 border-t border-gray-100">
                      <button className="w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50/50 rounded-lg transition-colors">
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients, records..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          {/* Mobile Stats */}

        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white border-b border-gray-200/60 px-4 py-3 shadow-sm"
          >
            <div className="flex flex-wrap gap-2">
              {['Dashboard', 'Patients', 'Schedule', 'Records', 'Analytics'].map((item) => (
                <button
                  key={item}
                  className={`px-3 py-2 text-sm font-medium rounded-lg ${item === 'Dashboard'
                    ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700'
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