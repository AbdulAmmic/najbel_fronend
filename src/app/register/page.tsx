"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaEnvelope, FaLock, FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";
import { auth } from "@/services/api";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "patient" // Default role
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            // Backend expects: email, password, full_name, role
            await auth.register({
                email: formData.email,
                password: formData.password,
                full_name: formData.fullName,
                role: formData.role
            });

            // Auto-login or redirect to login
            router.push("/login?registered=true");
        } catch (err: any) {
            console.error("Registration failed", err);
            // Basic error handling - backend returns 400 for duplicate email
            if (err.response?.status === 400) {
                setError(err.response.data.detail || "Registration failed. Please try again.");
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
            {/* ================= BACK BUTTON ================= */}
            <div className="absolute top-5 left-5 z-10">
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <FaArrowLeft size={14} />
                    <span className="text-sm font-medium">Back</span>
                </button>
            </div>

            <div className="min-h-screen flex items-center justify-center px-5 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-lg"
                >
                    {/* ================= HEADER ================= */}
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">
                            Create Account
                        </h1>
                        <p className="text-gray-500">Join NAJBEL Digital Healthcare Ecosystem</p>
                    </div>

                    {/* ================= FORM ================= */}
                    <div className="bg-white rounded-2xl border border-gray-200/50 shadow-xl p-8">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* FULL NAME */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <FaUser size={16} />
                                    </div>
                                    <input
                                        name="fullName"
                                        type="text"
                                        required
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            {/* EMAIL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                        <FaEnvelope size={16} />
                                    </div>
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            {/* PASSWORD */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                            <FaLock size={16} />
                                        </div>
                                        <input
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                            <FaLock size={16} />
                                        </div>
                                        <input
                                            name="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* USER TYPE TOGGLE (Hidden for now, defaulting to Patient, but could be exposed) */}
                            {/* 
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-sm text-gray-600">Registering as a Patient</span>
              </div>
              */}

                            <div className="pt-2">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={loading}
                                    type="submit"
                                    className="w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading ? "Creating Account..." : "Create Account"}
                                </motion.button>
                            </div>
                        </form>

                        <div className="mt-8 text-center text-sm text-gray-600">
                            Already have an account?{" "}
                            <button
                                onClick={() => router.push("/login")}
                                className="text-blue-600 hover:text-blue-700 font-bold"
                            >
                                Sign In
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 text-center text-xs text-gray-400">
                        By registering, you agree to our Terms of Service and Privacy Policy.
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
