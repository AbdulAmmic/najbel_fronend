"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaHospital, FaSchool } from "react-icons/fa";
import { motion } from "framer-motion";

export default function NajbelLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<"clinic" | "school">("clinic");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Get form data
    const form = e.target as HTMLFormElement;
    const email = (form.elements[0] as HTMLInputElement).value;
    const password = (form.elements[2] as HTMLInputElement).value; // Index 2 because of icon container? Better use name attribute or IDs but let's assume order

    try {
      const { auth } = await import("@/services/api");
      const data = await auth.login(email, password);
      localStorage.setItem("token", data.access_token);

      // Fetch user profile to determine role-based redirection
      const user = await auth.getMe();
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "patient") {
        router.push("/dashboard/patient");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Login failed", err);
      setError("Invalid email or password");
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

      {/* ================= MAIN CONTENT ================= */}
      <div className="min-h-screen flex items-center justify-center px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* ================= LOGO ================= */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="h-14 w-14 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-2xl shadow-lg flex items-center justify-center">
                  <div className="h-10 w-10 bg-white rounded-lg"></div>
                </div>
                <div className="absolute -inset-2 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-2xl opacity-20 blur-sm" />
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              NAJBEL Platform
            </h1>
            <p className="text-gray-500 text-sm">Select platform and sign in</p>
          </div>

          {/* ================= PLATFORM SELECTOR ================= */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-8">
            <button
              onClick={() => setSelectedPlatform("clinic")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-300 ${selectedPlatform === "clinic"
                ? "bg-white shadow-sm text-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <FaHospital className={`${selectedPlatform === "clinic" ? "text-blue-600" : "text-gray-400"}`} />
              <span className="font-medium text-sm">Healthcare</span>
            </button>
            <button
              onClick={() => setSelectedPlatform("school")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-300 ${selectedPlatform === "school"
                ? "bg-white shadow-sm text-emerald-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <FaSchool className={`${selectedPlatform === "school" ? "text-emerald-600" : "text-gray-400"}`} />
              <span className="font-medium text-sm">Education</span>
            </button>
          </div>

          {/* ================= LOGIN FORM ================= */}
          <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm p-8">
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedPlatform === "clinic" ? "Medical Portal" : "Education Portal"}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedPlatform === "clinic"
                  ? "Access patient records and medical systems"
                  : "Access learning materials and academic tools"}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* USERNAME FIELD */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FaUser size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              {/* PASSWORD FIELD */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => {/* Add forgot password logic */ }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FaLock size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>

              {/* REMEMBER ME */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="remember" className="ml-3 text-sm text-gray-600">
                  Remember me on this device
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''} ${selectedPlatform === "clinic"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                  : "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600"
                  }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </motion.button>
            </form>

            {/* DIVIDER */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* SSO BUTTON */}
            <button
              onClick={() => {/* Add SSO logic */ }}
              className="w-full py-3.5 px-6 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <div className="h-5 w-5 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-sm"></div>
              <span>Single Sign-On (SSO)</span>
            </button>

            <div className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={() => router.push("/register")}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* ================= FOOTER NOTE ================= */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Need help?{" "}
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Contact support
              </button>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Secure login powered by{" "}
              <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                AmmicX Systems
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}