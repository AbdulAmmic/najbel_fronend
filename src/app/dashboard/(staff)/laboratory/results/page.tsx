"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LabResultsRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/dashboard/laboratory?tab=processing");
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Results Entry...</p>
            </div>
        </div>
    );
}
