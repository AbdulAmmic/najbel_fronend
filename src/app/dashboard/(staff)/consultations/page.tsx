"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConsultationsIndex() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to schedule since consultations start from appointments
        router.replace("/dashboard/schedule");
    }, [router]);

    return (
        <div className="p-8 text-center text-gray-500">
            Redirecting to Schedule...
        </div>
    );
}
