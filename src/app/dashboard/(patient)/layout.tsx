"use client";

import { useState } from "react";
import PatientHeader from "@/components/Layouts/patientHeader";
import PatientSidebar from "@/components/Layouts/patientSidebar";
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
            <div className="min-h-screen bg-gray-50 flex">
                <PatientSidebar
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    patientName={patientName}
                />
                <div className="flex-1 w-full min-w-0">
                    <PatientHeader
                        onMenuClick={() => setSidebarOpen(true)}
                        patientName={patientName}
                    />
                    <main className="max-w-6xl mx-auto px-4 py-6">
                        {children}
                    </main>
                </div>
            </div>
        </RouteGuard>
    );
}
