"use client";

import { useState, useEffect } from "react";
import { User, Lock, Camera, CheckCircle2, ShieldCheck, LogOut, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/services/api";

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [pin, setPin] = useState("");
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [profileData, setProfileData] = useState({ full_name: "", email: "", profile_picture: "" });
    const [securityData, setSecurityData] = useState({ new_password: "" });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get("/users/me");
                setUser(res.data);
                setProfileData({ full_name: res.data.full_name || "", email: res.data.email || "", profile_picture: res.data.profile_picture || "" });
            } catch (err) { console.error(err); }
        };
        fetchUser();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setProfileData({ ...profileData, profile_picture: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const payload: any = { full_name: profileData.full_name, email: profileData.email, profile_picture: profileData.profile_picture };
            if (securityData.new_password) payload.password = securityData.new_password;
            await api.put("/users/me", payload);
            setStatus({ type: 'success', message: 'Saved' });
            setSecurityData({ new_password: "" });
            setTimeout(() => setStatus(null), 3000);
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed' });
        } finally { setLoading(false); }
    };

    const handlePinUpdate = async () => {
        if (!pin || pin.length !== 4) { setStatus({ type: 'error', message: 'Enter 4 digits' }); return; }
        setLoading(true);
        try {
            await api.put('/users/me/pin', { pin: pin });
            setStatus({ type: 'success', message: 'PIN set' }); setPin("");
            localStorage.setItem('najbel_wallet_pin', 'true');
            setTimeout(() => setStatus(null), 3000);
        } catch (err) { setStatus({ type: 'error', message: 'Failed' }); }
        finally { setLoading(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
    };

    return (
        <div className="max-w-lg mx-auto pb-8 -mx-1">
            {/* Header */}
            <div className="px-1 pt-1 mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                    <p className="text-[11px] text-gray-400 mt-0.5">Manage your account</p>
                </div>
                <button onClick={handleUpdate} disabled={loading}
                    className="text-blue-600 font-semibold text-[13px] px-3 py-1.5 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                >
                    {loading ? "Saving..." : "Save"}
                </button>
            </div>

            {/* Profile Photo */}
            <div className="flex justify-center mb-5">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full border-2 border-white shadow-md overflow-hidden bg-gray-100">
                        {profileData.profile_picture ? (
                            <img src={profileData.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <User className="w-10 h-10" />
                            </div>
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full text-white shadow cursor-pointer active:scale-95 transition">
                        <Camera className="w-3 h-3" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                </div>
            </div>

            {/* Account */}
            <div className="mx-1 bg-white rounded-xl border border-gray-100/80 p-3 mb-3">
                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Full Name</label>
                        <input type="text" value={profileData.full_name} onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                            className="w-full px-0 py-1.5 border-b border-gray-100 outline-none focus:border-blue-500 transition text-[13px] font-medium text-gray-900 placeholder:text-gray-300" placeholder="Name"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Email</label>
                        <input type="email" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            className="w-full px-0 py-1.5 border-b border-gray-100 outline-none focus:border-blue-500 transition text-[13px] font-medium text-gray-900 placeholder:text-gray-300" placeholder="Email"
                        />
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="mx-1 bg-white rounded-xl border border-gray-100/80 p-3 mb-3">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Lock className="w-4 h-4" /></div>
                    <h2 className="font-semibold text-gray-900 text-[13px]">Security</h2>
                </div>
                <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder="New Password (optional)" value={securityData.new_password}
                        onChange={(e) => setSecurityData({ ...securityData, new_password: e.target.value })}
                        className="w-full px-0 py-1.5 border-b border-gray-100 outline-none focus:border-blue-500 transition text-[13px] font-medium text-gray-900 placeholder:text-gray-300 pr-8"
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-400">
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* PIN */}
            <div className="mx-1 bg-white rounded-xl border border-gray-100/80 p-3 mb-3">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><ShieldCheck className="w-4 h-4" /></div>
                    <h2 className="font-semibold text-gray-900 text-[13px]">Transaction PIN</h2>
                </div>
                <div className="flex items-center gap-3">
                    <input type="password" maxLength={4} placeholder="••••" value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        className="w-20 text-center py-1.5 border-b-2 border-gray-100 outline-none focus:border-indigo-500 transition font-bold text-lg tracking-[0.4em]"
                    />
                    <button onClick={handlePinUpdate} disabled={loading || pin.length !== 4}
                        className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-50 transition"
                    >Set PIN</button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Used for wallet transactions</p>
            </div>

            {/* Logout */}
            <div className="mx-1 mt-6">
                <button onClick={handleLogout} className="w-full py-3 text-red-500 font-semibold bg-red-50 rounded-xl border border-red-100 hover:bg-red-100 transition flex items-center justify-center gap-2 text-[13px]">
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>

            {/* Toast */}
            {status && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-900 text-white rounded-xl shadow-xl flex items-center gap-2 z-50">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`} />
                    <span className="text-[11px] font-semibold">{status.message}</span>
                </div>
            )}
        </div>
    );
}
