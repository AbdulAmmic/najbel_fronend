"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PharmacyIndex() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard/pharmacy/prescriptions");
    }, [router]);

    return null;
}
