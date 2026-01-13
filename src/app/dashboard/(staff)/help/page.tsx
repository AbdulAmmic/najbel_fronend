"use client";

import { HelpCircle } from "lucide-react";

export default function HelpPage() {
    return (
        <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl">
                    <HelpCircle className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
                    <p className="text-gray-500">Resources and Guides</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <HelpCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Help Center</h3>
                <p className="text-gray-500 max-w-sm mb-6">
                    This module is under development.
                </p>
            </div>
        </div>
    );
}
