"use client";

import Header from "@/components/Layouts/header";
import Sidebar from "@/components/Layouts/sidebar";
import RouteGuard from "@/components/auth/RouteGuard";
import { WebSocketProvider } from "@/contexts/WebSocketContext";

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <WebSocketProvider>
            <RouteGuard allowedRoles={["admin", "super_admin", "doctor", "nurse", "receptionist", "lab_tech", "pharmacist", "radiologist", "accountant", "store_officer"]}>
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
                    {/* Header: hidden on mobile — role layouts provide their own mobile header */}
                    <div className="hidden md:block">
                        <Header />
                    </div>
                    {/* flex row: sidebar hidden on mobile (bottom nav used instead) */}
                    <div className="flex relative">
                        <div className="hidden md:block">
                            <Sidebar />
                        </div>
                        {/* Main content — full width on mobile, fills remaining space on desktop */}
                        <main className="flex-1 min-w-0 overflow-x-hidden w-full">
                            {children}
                        </main>
                    </div>
                </div>
            </RouteGuard>
        </WebSocketProvider>
    );
}
