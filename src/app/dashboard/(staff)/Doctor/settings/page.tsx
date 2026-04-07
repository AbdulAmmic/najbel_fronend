"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    User, Bell, Shield, LogOut, ChevronRight,
    Sun, Moon, Stethoscope, Mail, Phone, MapPin,
    Lock, Eye, EyeOff, CheckCircle2, AlertCircle,
    Loader2, Camera, Save, Trash2, Info,
    Volume2, Smartphone, Globe, HelpCircle, Star
} from "lucide-react";
import { auth } from "@/services/api";
import api from "@/services/api";

// ─── Section wrapper ────────────────────────────────────────
const Section = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-black text-gray-900">{title}</h2>
            {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="divide-y divide-gray-50">
            {children}
        </div>
    </div>
);

// ─── Row item ──────────────────────────────────────────────
const Row = ({ icon: Icon, iconBg, label, value, onClick, children, danger }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all active:scale-[0.98] hover:bg-gray-50/80
            ${danger ? "hover:bg-rose-50/50" : ""}`}
    >
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${iconBg || "bg-gray-100"}`}>
            <Icon className={`w-4 h-4 ${danger ? "text-rose-500" : "text-gray-600"}`} />
        </div>
        <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${danger ? "text-rose-600" : "text-gray-800"}`}>{label}</p>
            {value && <p className="text-xs text-gray-400 truncate mt-0.5">{value}</p>}
        </div>
        {children || <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />}
    </button>
);

// ─── Toggle ────────────────────────────────────────────────
const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
    <button
        onClick={() => onChange(!on)}
        className={`relative w-11 h-6 rounded-full transition-all duration-300 ${on ? "bg-blue-600" : "bg-gray-200"}`}
    >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${on ? "translate-x-5" : "translate-x-0"}`} />
    </button>
);

// ─── Toast ─────────────────────────────────────────────────
const Toast = ({ msg, ok }: { msg: string; ok: boolean }) => (
    <div className={`fixed top-[90px] left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-bold animate-in fade-in slide-in-from-top-3 whitespace-nowrap
        ${ok ? "bg-slate-900 text-white" : "bg-rose-600 text-white"}`}>
        {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4" />}
        {msg}
    </div>
);

// ─── Main ──────────────────────────────────────────────────
export default function DoctorSettingsPage() {
    const router = useRouter();
    const [me, setMe] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const [activeSheet, setActiveSheet] = useState<string | null>(null);

    // Profile fields
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [location, setLocation] = useState("");

    // Password change
    const [currentPass, setCurrentPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [showPass, setShowPass] = useState(false);

    // Preferences
    const [notifAppt, setNotifAppt] = useState(true);
    const [notifMsg, setNotifMsg] = useState(true);
    const [notifLab, setNotifLab] = useState(true);
    const [soundOn, setSoundOn] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        auth.getMe().then((u: any) => {
            setMe(u);
            setFullName(u?.full_name || "");
            setEmail(u?.email || "");
            setPhone(u?.phone || "");
            setSpecialty(u?.specialty || u?.specialization || "");
            setLocation(u?.location || "");
        }).catch(() => {})
        .finally(() => setLoading(false));
    }, []);

    const saveProfile = async () => {
        setSaving(true);
        try {
            await api.put("users/me", { full_name: fullName, phone, specialty, location });
            showToast("Profile updated successfully!");
            setActiveSheet(null);
        } catch (e: any) {
            showToast(e?.response?.data?.detail || "Failed to update profile", false);
        } finally { setSaving(false); }
    };

    const changePassword = async () => {
        if (!currentPass || !newPass) return showToast("Fill all fields", false);
        if (newPass !== confirmPass) return showToast("Passwords don't match", false);
        if (newPass.length < 8) return showToast("Password must be at least 8 characters", false);
        setSaving(true);
        try {
            await api.post("auth/change-password", { current_password: currentPass, new_password: newPass });
            showToast("Password changed!");
            setCurrentPass(""); setNewPass(""); setConfirmPass("");
            setActiveSheet(null);
        } catch (e: any) {
            showToast(e?.response?.data?.detail || "Incorrect current password", false);
        } finally { setSaving(false); }
    };

    const signOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    const initials = (name: string) =>
        (name || "DR").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

    const avatarGradients = [
        "from-blue-500 via-indigo-500 to-violet-600",
        "from-emerald-500 to-teal-600",
        "from-rose-500 to-pink-600",
        "from-amber-500 to-orange-600",
    ];
    const avatarGrad = avatarGradients[(me?.full_name?.charCodeAt(0) || 0) % avatarGradients.length];

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
        </div>
    );

    return (
        <div className="max-w-lg mx-auto px-3 pb-[120px] space-y-4">
            {toast && <Toast {...toast} />}

            {/* ── Hero Profile Card ──────────────────────────── */}
            <div className={`bg-gradient-to-br ${avatarGrad} rounded-3xl p-5 text-white relative overflow-hidden`}>
                {/* Decoration blobs */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute -bottom-8 -left-6 w-28 h-28 bg-white/5 rounded-full" />

                <div className="flex items-center gap-4 relative">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl font-black shadow-inner">
                            {initials(fullName)}
                        </div>
                        <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                            <Camera className="w-3 h-3 text-gray-600" />
                        </button>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-lg font-black leading-tight">Dr. {fullName || "—"}</p>
                        <p className="text-white/70 text-xs mt-0.5">{email}</p>
                        {specialty && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-lg">
                                    {specialty}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
                            <span className="text-[10px] text-white/80 font-semibold">Verified Doctor</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setActiveSheet("profile")}
                    className="mt-4 w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-bold py-2 rounded-2xl transition-all active:scale-95 relative"
                >
                    Edit Profile
                </button>
            </div>

            {/* ── Account ───────────────────────────────────── */}
            <Section title="Account" subtitle="Your personal information">
                <Row icon={User} iconBg="bg-blue-50" label="Full Name" value={fullName || "Not set"} onClick={() => setActiveSheet("profile")} />
                <Row icon={Mail} iconBg="bg-indigo-50" label="Email Address" value={email || "Not set"} onClick={() => setActiveSheet("profile")} />
                <Row icon={Phone} iconBg="bg-teal-50" label="Phone Number" value={phone || "Not set"} onClick={() => setActiveSheet("profile")} />
                <Row icon={Stethoscope} iconBg="bg-violet-50" label="Specialty" value={specialty || "Not set"} onClick={() => setActiveSheet("profile")} />
                <Row icon={MapPin} iconBg="bg-rose-50" label="Location / Hospital" value={location || "Not set"} onClick={() => setActiveSheet("profile")} />
            </Section>

            {/* ── Security ──────────────────────────────────── */}
            <Section title="Security" subtitle="Authentication & access">
                <Row icon={Lock} iconBg="bg-amber-50" label="Change Password" value="Last changed recently" onClick={() => setActiveSheet("password")} />
                <Row icon={Shield} iconBg="bg-emerald-50" label="Two-Factor Authentication" value="Not enabled" onClick={() => showToast("2FA coming soon!", true)} />
                <Row icon={Smartphone} iconBg="bg-slate-100" label="Active Sessions" value="1 active device" onClick={() => showToast("Session management coming soon!", true)} />
            </Section>

            {/* ── Notifications ─────────────────────────────── */}
            <Section title="Notifications" subtitle="Control what you hear about">
                <div className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-9 h-9 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">Appointment Alerts</p>
                        <p className="text-xs text-gray-400">Notify me of new bookings</p>
                    </div>
                    <Toggle on={notifAppt} onChange={setNotifAppt} />
                </div>
                <div className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">New Messages</p>
                        <p className="text-xs text-gray-400">Patient chat notifications</p>
                    </div>
                    <Toggle on={notifMsg} onChange={setNotifMsg} />
                </div>
                <div className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-9 h-9 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Info className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">Lab Results Ready</p>
                        <p className="text-xs text-gray-400">When patient results come in</p>
                    </div>
                    <Toggle on={notifLab} onChange={setNotifLab} />
                </div>
                <div className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Volume2 className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">Sound Effects</p>
                        <p className="text-xs text-gray-400">Play sounds for alerts</p>
                    </div>
                    <Toggle on={soundOn} onChange={setSoundOn} />
                </div>
            </Section>

            {/* ── Appearance ────────────────────────────────── */}
            <Section title="Appearance" subtitle="Personalise your experience">
                <div className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                        {darkMode ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">Dark Mode</p>
                        <p className="text-xs text-gray-400">{darkMode ? "Dark theme on" : "Light theme on"}</p>
                    </div>
                    <Toggle on={darkMode} onChange={setDarkMode} />
                </div>
                <Row icon={Globe} iconBg="bg-teal-50" label="Language" value="English (UK)" onClick={() => showToast("Language settings coming soon!", true)} />
            </Section>

            {/* ── Support ───────────────────────────────────── */}
            <Section title="Support & About">
                <Row icon={HelpCircle} iconBg="bg-blue-50" label="Help & Documentation" onClick={() => showToast("Opening help center...", true)} />
                <Row icon={Star} iconBg="bg-amber-50" label="Rate the App" onClick={() => showToast("Thanks for your feedback! ⭐", true)} />
                <Row icon={Info} iconBg="bg-slate-100" label="About Najbel Clinic" value="Version 2.0.0" onClick={() => showToast("Najbel Clinic v2.0.0 — Built with ❤️", true)} />
            </Section>

            {/* ── Sign Out ──────────────────────────────────── */}
            <Section title="Account Actions">
                <Row icon={LogOut} iconBg="bg-rose-50" label="Sign Out" danger onClick={signOut}>
                    <span />
                </Row>
            </Section>

            {/* ── Bottom Sheet: Profile Edit ──────────────── */}
            {activeSheet === "profile" && (
                <>
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setActiveSheet(null)} />
                    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[32px] shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 pt-5 pb-3">
                            <div className="w-10 h-1 bg-slate-200 rounded-full absolute left-1/2 -translate-x-1/2 top-3" />
                            <h3 className="text-base font-black text-gray-900">Edit Profile</h3>
                            <button onClick={() => setActiveSheet(null)} className="text-xs font-bold text-gray-400 hover:text-gray-600">Cancel</button>
                        </div>
                        <div className="px-5 pb-6 space-y-3 max-h-[70vh] overflow-y-auto">
                            {[
                                { label: "Full Name", value: fullName, set: setFullName, placeholder: "Dr. John Smith" },
                                { label: "Phone Number", value: phone, set: setPhone, placeholder: "+234 800 000 0000" },
                                { label: "Specialty", value: specialty, set: setSpecialty, placeholder: "e.g. Cardiology" },
                                { label: "Location / Hospital", value: location, set: setLocation, placeholder: "e.g. Lagos Island Hospital" },
                            ].map(({ label, value, set, placeholder }) => (
                                <div key={label}>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">{label}</label>
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={e => set(e.target.value)}
                                        placeholder={placeholder}
                                        className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Email (read-only)</label>
                                <input type="email" value={email} readOnly className="w-full border border-gray-100 bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-400 outline-none cursor-not-allowed" />
                            </div>
                            <button
                                onClick={saveProfile}
                                disabled={saving}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                        <div className="h-6" />
                    </div>
                </>
            )}

            {/* ── Bottom Sheet: Change Password ───────────── */}
            {activeSheet === "password" && (
                <>
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setActiveSheet(null)} />
                    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[32px] shadow-2xl">
                        <div className="flex items-center justify-between px-5 pt-5 pb-3">
                            <div className="w-10 h-1 bg-slate-200 rounded-full absolute left-1/2 -translate-x-1/2 top-3" />
                            <h3 className="text-base font-black text-gray-900">Change Password</h3>
                            <button onClick={() => setActiveSheet(null)} className="text-xs font-bold text-gray-400 hover:text-gray-600">Cancel</button>
                        </div>
                        <div className="px-5 pb-6 space-y-3">
                            {[
                                { label: "Current Password", value: currentPass, set: setCurrentPass },
                                { label: "New Password", value: newPass, set: setNewPass },
                                { label: "Confirm New Password", value: confirmPass, set: setConfirmPass },
                            ].map(({ label, value, set }) => (
                                <div key={label} className="relative">
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">{label}</label>
                                    <input
                                        type={showPass ? "text" : "password"}
                                        value={value}
                                        onChange={e => set(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full border border-gray-200 rounded-2xl px-4 py-3 pr-10 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                                    />
                                </div>
                            ))}
                            <button
                                onClick={() => setShowPass(p => !p)}
                                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600"
                            >
                                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                {showPass ? "Hide" : "Show"} passwords
                            </button>
                            {newPass && (
                                <div className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl ${newPass.length >= 8 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                    {newPass.length >= 8 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                    {newPass.length >= 8 ? "Strong password ✓" : `${8 - newPass.length} more characters needed`}
                                </div>
                            )}
                            <button
                                onClick={changePassword}
                                disabled={saving}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                {saving ? "Updating..." : "Update Password"}
                            </button>
                        </div>
                        <div className="h-6" />
                    </div>
                </>
            )}
        </div>
    );
}
