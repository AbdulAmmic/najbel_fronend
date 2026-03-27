"use client";

import { useState } from "react";
import PatientHeader from "@/components/Layouts/patientHeader";
import PatientSidebar from "@/components/Layouts/patientSidebar";
import PatientBottomNav from "@/components/Layouts/patientBottomNav";
import RouteGuard from "@/components/auth/RouteGuard";

export default function PatientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const patientName = "Patient"; // This can be dynamic in the future or passed via context

    return (
        <RouteGuard allowedRoles={["patient"]}>
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block">
                    <PatientSidebar
                        open={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        patientName={patientName}
                    />
                </aside>

                {/* Mobile Drawer Sidebar */}
                <div className="lg:hidden">
                    <PatientSidebar
                        open={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        patientName={patientName}
                    />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <PatientHeader
                        onMenuClick={() => setSidebarOpen(true)}
                        patientName={patientName}
                    />
                    <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 mb-20 lg:mb-24">
                        {children}
                    </main>
                </div>

                {/* Mobile Bottom Navigation */}
                <PatientBottomNav />
            </div>
        </RouteGuard>
    );
}
