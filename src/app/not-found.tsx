"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-9xl font-bold text-blue-100">404</h1>
                <h2 className="text-3xl font-bold text-gray-900 mt-4">Page Not Found</h2>
                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                    The page you are looking for doesn't exist or has been moved.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-block mt-8 px-8 py-3 bg-blue-600 text-white font-medium rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all"
                >
                    Return to Dashboard
                </Link>
            </motion.div>
        </div>
    );
}
