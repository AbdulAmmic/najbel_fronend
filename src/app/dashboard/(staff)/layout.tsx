"use client";

import Header from "@/components/Layouts/header";
import Sidebar from "@/components/Layouts/sidebar";
import RouteGuard from "@/components/auth/RouteGuard";
import { useState } from "react";

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed] = useState(false);

    return (
        <RouteGuard allowedRoles={["admin", "doctor", "nurse", "receptionist", "laboratory", "pharmacy"]}>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
                <Header />
                <div className="flex">
                    <aside className={`${sidebarCollapsed ? "md:w-0" : "md:w-72"} transition-all`}>
                        <Sidebar />
                    </aside>
                    <main className="flex-1">
                        {children}
                    </main>
                </div>
            </div>
        </RouteGuard>
    );
}
