"use client";

import { useState, useEffect, Suspense } from "react";
import LiveChat from "@/components/consultation/LiveChat";
import { auth } from "@/services/api";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Calendar, ChevronRight } from "lucide-react";

function MessagesContent() {
    const [user, setUser] = useState<any>(null);
    const searchParams = useSearchParams();
    const appointmentId = searchParams.get("id");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await auth.getMe();
                setUser(data);
            } catch (err) {
                console.error("Failed to fetch user", err);
            }
        };
        fetchUser();
    }, []);

    const patientName = user?.full_name || "Patient";

    return (
        <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-160px)] sm:h-[calc(100vh-140px)] -mx-4 pb-2 sm:mx-0 sm:pb-0">
            {/* Awesome Header Section */}
            <div className="px-5 mb-4 sm:px-0 shrink-0">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2 sm:mb-3">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    <span>Communication</span>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    <span className="text-blue-600">Active Consultation</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-none">
                    Doctor Messages
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-2 font-medium max-w-xl">
                    {appointmentId
                        ? `Secure messaging channel for Appointment #${appointmentId}`
                        : "Select a confirmed appointment from your schedule to start messaging."}
                </p>
            </div>

            {/* Chat Container */}
            <div className="flex-1 min-h-0 sm:rounded-[2rem] shadow-xl sm:border border-gray-100/80 overflow-hidden relative mx-0 sm:mx-0">
                {appointmentId ? (
                    <LiveChat
                        consultationId={Number(appointmentId)}
                        userName={patientName}
                        userRole="patient"
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-white p-6 text-center border-t sm:border-0 border-gray-100">
                        <div className="w-24 h-24 bg-blue-50/50 rounded-full flex items-center justify-center mb-6 ring-[12px] ring-white shadow-sm transform hover:scale-105 transition-all">
                            <Calendar className="w-10 h-10 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">No Active Chat Selected</h3>
                        <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                            Please navigate to your appointments schedule and select a pending or confirmed appointment to chat with your doctor.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-lg"></div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading...</span>
                </div>
            </div>
        }>
            <MessagesContent />
        </Suspense>
    );
}
