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
            {/* Floating rounded top header */}
            <DoctorHeader />

            {/* Page content — pad top for floating header, bottom for floating nav */}
            <main className="pt-[74px]">
                {children}
            </main>

            {/* Floating bottom tab bar */}
            <DoctorBottomNav />
        </div>
    );
}
