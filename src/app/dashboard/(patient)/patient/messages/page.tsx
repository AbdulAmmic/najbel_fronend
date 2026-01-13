"use client";

import { useState, useEffect } from "react";
import ChatBox from "@/components/chat/ChatBox";
import { auth } from "@/services/api";

export default function MessagesPage() {
    const [user, setUser] = useState<any>(null);

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
        <div className="max-w-5xl mx-auto">
            <main className="p-4 lg:p-8 space-y-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                        Support & Consultations
                    </h1>
                    <p className="text-gray-600">
                        Chat with your doctors and clinical staff
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    {/* Featured Chat */}
                    <ChatBox
                        currentUser={patientName}
                        recipientName="Dr. Sarah Ibrahim"
                    />
                </div>
            </main>
        </div>
    );
}
