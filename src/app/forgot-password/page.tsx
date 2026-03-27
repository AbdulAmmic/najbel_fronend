"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash, FaArrowLeft, FaEnvelope, FaKey, FaCheckCircle, FaLock } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/services/api";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return setError("Email is required");

        setLoading(true);
        setError("");
        try {
            await auth.forgotPassword(email);
            setSuccess("If an account exists, an OTP has been sent.");
            setStep(2);
        } catch (err: any) {
            setError("Failed to request OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) return setError("OTP must be 6 digits");

        setLoading(true);
        setError("");
        try {
            await auth.verifyOtp(email, otp);
            setError("");
            setSuccess("OTP verified successfully.");
            setStep(3);
        } catch (err: any) {
            setError("Invalid or expired OTP.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword || newPassword !== confirmPassword) {
            return setError("Passwords do not match");
        }

        setLoading(true);
        setError("");
        try {
            await auth.resetPassword(email, otp, newPassword);
            setSuccess("Password reset successfully! Redirecting...");
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (err: any) {
            setError("Failed to reset password. The OTP might have expired.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
            {/* Back Button */}
            <div className="absolute top-5 left-5 z-10">
                <button
                    onClick={() => router.push("/login")}
                    className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <FaArrowLeft size={14} />
                    <span className="text-sm font-medium">Back to Login</span>
                </button>
            </div>

            <div className="min-h-screen flex items-center justify-center px-5 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <div className="text-center mb-10">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <div className="h-14 w-14 bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-400 rounded-2xl shadow-lg flex items-center justify-center">
                                    <FaLock className="text-white text-xl" />
                                </div>
                                <div className="absolute -inset-2 bg-gradient-to-br from-indigo-600 to-blue-400 rounded-2xl opacity-20 blur-sm" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                            Recover Account
                        </h1>
                        <p className="text-gray-500 text-sm">
                            {step === 1 && "Enter your email to receive an OTP"}
                            {step === 2 && "Enter the 6-digit code sent to your email"}
                            {step === 3 && "Create a new secure password"}
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
                        {/* Feedback Alerts */}
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                {error}
                            </div>
                        )}
                        {success && step === 3 && (
                            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm font-medium flex items-center gap-2">
                                <FaCheckCircle />
                                {success}
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {/* STEP 1: EMAIL */}
                            {step === 1 && (
                                <motion.form
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onSubmit={handleRequestOtp}
                                    className="space-y-5"
                                >
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                                <FaEnvelope />
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold tracking-wide shadow-lg shadow-gray-900/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                                    >
                                        {loading ? "Sending..." : "Send Reset Code"}
                                    </button>
                                </motion.form>
                            )}

                            {/* STEP 2: OTP */}
                            {step === 2 && (
                                <motion.form
                                    key="step2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onSubmit={handleVerifyOtp}
                                    className="space-y-5"
                                >
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Verification Code</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                                <FaKey />
                                            </div>
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                                placeholder="000000"
                                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-center text-2xl tracking-[0.5em] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-black text-gray-900 placeholder:text-gray-300"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading || otp.length !== 6}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold tracking-wide shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                                    >
                                        {loading ? "Verifying..." : "Verify Code"}
                                    </button>
                                    <p className="text-center text-xs text-gray-500 font-medium">
                                        Didn't receive a code? <button type="button" onClick={() => setStep(1)} className="text-indigo-600 hover:underline">Try another email</button>
                                    </p>
                                </motion.form>
                            )}

                            {/* STEP 3: NEW PASSWORD */}
                            {step === 3 && (
                                <motion.form
                                    key="step3"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onSubmit={handleResetPassword}
                                    className="space-y-5"
                                >
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">New Password</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                                <FaLock />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-11 pr-12 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Confirm Password</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                                <FaLock />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-11 pr-12 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !newPassword}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold tracking-wide shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                                    >
                                        {loading ? "Resetting..." : "Update Password"}
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
