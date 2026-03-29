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
                    <Header />
                    {/* flex row: sidebar always visible on md+, children fill remaining space */}
                    <div className="flex relative">
                        {/* Sidebar: on mobile it's a fixed overlay drawer, on desktop it's sticky */}
                        <Sidebar />
                        {/* Main content area — takes all remaining horizontal space */}
                        <main className="flex-1 min-w-0 overflow-x-hidden">
                            {children}
                        </main>
                    </div>
                </div>
            </RouteGuard>
        </WebSocketProvider>
    );
}
