"use client";

import BedManagement from "@/components/beds/BedManagement";

export default function BedManagementPage() {
    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bed Management</h1>
                    <p className="text-gray-500 mt-1">Real-time tracking and allocation of hospital beds</p>
                </div>
            </div>

            <BedManagement />
        </div>
    );
}
