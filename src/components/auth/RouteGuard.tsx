"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RouteGuard({
    children,
    allowedRoles,
}: {
    children: React.ReactNode;
    allowedRoles: string[];
}) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Check for token and role
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (!token || !userStr) {
            router.push("/login");
            return;
        }

        try {
            const user = JSON.parse(userStr);
            // Case-insensitive check
            const userRole = user.role.toLowerCase();
            const allowed = allowedRoles.map(r => r.toLowerCase());

            if (allowed.includes(userRole)) {
                setAuthorized(true);
            } else {
                // If logged in but wrong role, maybe go to a default dashboard or 403 page
                // For now, redirect to login to be safe or maybe their allowed dashboard if logic permits
                // Simple redirect for security:
                router.push("/login"); // Or /unauthorized
            }
        } catch (e) {
            localStorage.clear();
            router.push("/login");
        }
    }, [allowedRoles, router]);

    if (!authorized) {
        return null; // or a loading spinner
    }

    return <>{children}</>;
}
