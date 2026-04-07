"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaHospital, FaSchool } from "react-icons/fa";
import { motion } from "framer-motion";
import { auth } from "@/services/api";

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

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = (formData.get("email") as string).trim();
    const password = (formData.get("password") as string).trim();

    try {
      const data = await auth.login(email, password);
      localStorage.setItem("token", data.access_token);

      // Use user info from login response if available, otherwise fallback to getMe
      let user = data.user;
      if (!user) {
        user = await auth.getMe();
      }

      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "patient") {
        router.push("/dashboard/patient");
      } else if (user.role === "doctor") {
        router.push("/dashboard/Doctor");
      } else if (user.role === "receptionist" || user.role === "reception") {
        router.push("/dashboard/reception");
      } else if (user.role === "lab_tech") {
        router.push("/dashboard/laboratory");
      } else if (user.role === "nurse") {
        router.push("/dashboard/nurse");
      } else if (user.role === "pharmacist") {
        router.push("/dashboard/pharmacy");
      } else if (user.role === "radiologist") {
        router.push("/dashboard/radiology");
      } else if (user.role === "accountant") {
        router.push("/dashboard/billing");
      } else if (user.role === "admin" || user.role === "super_admin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/overview");
      }
    } catch (err: any) {
      console.error("Login failed:", err?.response?.status, err?.response?.data);
      const detail = err?.response?.data?.detail;
      if (typeof detail === "string") {
        setError(detail);
      } else if (err?.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (!err?.response) {
        setError("Cannot reach server. Please check your connection.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">

      {/* ================= LEFT VISUAL PANE (Hidden on Mobile) ================= */}
      <div className="hidden lg:flex w-[45%] relative bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-900 overflow-hidden items-center justify-center p-12">
        {/* Abstract Glass Shapes */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-screen filter blur-[100px] opacity-30"></div>

        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 inline-block">
            <div className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
              <FaHospital className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-6">
            Pioneering the future of <br />
            <span className="text-cyan-300">healthcare systems.</span>
          </h1>
          <p className="text-lg text-blue-100/80 leading-relaxed font-light mb-10">
            Secure, rapid, and intelligent infrastructure powering the operations of Najbel Clinical divisions.
          </p>

          {/* Testimonial / Features Glass Card */}
          <div className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-blue-900 bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <FaUser className="w-4 h-4 text-white/70" />
                  </div>
                ))}
              </div>
              <div className="text-sm font-medium text-white/90">
                Join <span className="font-bold text-white">400+</span> healthcare professionals
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RIGHT FORM PANE ================= */}
      <div className="w-full flex-1 flex flex-col justify-center relative px-6 py-12 lg:px-24 xl:px-32">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-8 left-6 lg:left-12 flex items-center gap-2 px-4 py-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all font-medium text-sm"
        >
          <FaArrowLeft size={12} /> Back to Origin
        </button>

        <div className="w-full max-w-md mx-auto">
          {/* Form Header */}
          <div className="mb-10">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Welcome back</h2>
            <p className="text-gray-500 mt-2 text-sm font-medium">Please enter your credentials to securely access your portal.</p>
          </div>

          {/* Platform Selector Pill */}
          <div className="flex p-1 bg-gray-100/80 backdrop-blur-sm rounded-xl mb-10">
            <button
              type="button"
              onClick={() => setSelectedPlatform("clinic")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg transition-all duration-300 font-semibold text-sm ${selectedPlatform === "clinic"
                ? "bg-white shadow-sm text-blue-600 ring-1 ring-gray-200/50"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              <FaHospital size={14} className={selectedPlatform === "clinic" ? "text-blue-600" : ""} />
              Healthcare
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform("school")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg transition-all duration-300 font-semibold text-sm ${selectedPlatform === "school"
                ? "bg-white shadow-sm text-emerald-600 ring-1 ring-gray-200/50"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              <FaSchool size={14} className={selectedPlatform === "school" ? "text-emerald-600" : ""} />
              Education
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50/50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <FaUser size={14} />
                </div>
                <input
                  type="text"
                  name="email"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 focus:bg-white rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-900 placeholder:font-normal"
                  placeholder="Enter your  Email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <FaLock size={14} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 focus:bg-white rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium text-gray-900 placeholder:font-normal"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 rounded border border-gray-300 bg-gray-50 group-hover:border-blue-500 transition-colors">
                  <input type="checkbox" className="peer absolute opacity-0 w-full h-full cursor-pointer" />
                  <div className="peer-checked:bg-blue-600 rounded-sm w-3 h-3 transition-colors absolute scale-0 peer-checked:scale-100"></div>
                </div>
                <span className="text-sm text-gray-600 font-medium select-none group-hover:text-gray-900 transition-colors">Remember device</span>
              </label>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden relative group ${loading ? 'opacity-80 cursor-not-allowed' : ''} ${selectedPlatform === "clinic"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                }`}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="relative z-10">Authenticating...</span>
                </>
              ) : (
                <span className="relative z-10">Login</span>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center text-[13px] text-gray-600 font-medium">
            Don't have an account?{" "}
            <button
              onClick={() => router.push("/register")}
              className="text-blue-600 hover:text-blue-700 font-bold transition-colors underline decoration-blue-600/30 underline-offset-2"
            >
              Sign up here
            </button>
          </div>

          <p className="mt-8 text-center text-[11px] text-gray-400 font-medium tracking-wide">
            Secured and Encrypted Pipeline via <span className="text-gray-900 font-bold">AmmicX Systems</span>
          </p>
          </div>
      </div>

    </div>
  );
}