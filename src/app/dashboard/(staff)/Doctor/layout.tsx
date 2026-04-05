"use client";

import DoctorBottomNav from "@/components/Layouts/doctorBottomNav";
import DoctorHeader from "@/components/Layouts/doctorHeader";

export default function DoctorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/*
             * Mobile: DoctorHeader (compact, app-like) + bottom nav
             * Desktop: the staff layout's Header + Sidebar handle the chrome
             */}
            <div className="md:hidden">
                <DoctorHeader />
            </div>

            {/* Content — on mobile no sidebar, just full width */}
            <div className="pb-36 md:pb-0">
                {children}
            </div>

            {/* Bottom tab bar — mobile only */}
            <DoctorBottomNav />
        </>
    );
}
