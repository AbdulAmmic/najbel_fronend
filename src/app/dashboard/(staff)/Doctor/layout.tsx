"use client";

import DoctorBottomNav from "@/components/Layouts/doctorBottomNav";
import DoctorHeader from "@/components/Layouts/doctorHeader";

export default function DoctorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Compact top header — notifications, avatar */}
            <DoctorHeader />

            {/* Page content — bottom padding for floating nav */}
            <main className="pt-0">
                {children}
            </main>

            {/* Floating bottom tab bar */}
            <DoctorBottomNav />
        </div>
    );
}
