"use client";

import DoctorBottomNav from "@/components/Layouts/doctorBottomNav";

export default function DoctorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* Content with bottom padding on mobile to clear the bottom nav */}
            <div className="pb-28 md:pb-0">
                {children}
            </div>

            {/* Doctor Bottom Navigation (mobile only, md:hidden inside the component) */}
            <DoctorBottomNav />
        </>
    );
}
