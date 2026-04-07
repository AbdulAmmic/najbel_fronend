"use client";

import { useState, useEffect } from "react";
import {
    User, Lock, Camera, CheckCircle2, ShieldCheck, LogOut,
    Eye, EyeOff, Phone, CreditCard, MapPin, Globe,
    AlertCircle, Loader2, Save, ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/services/api";

const NIGERIAN_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
    "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
    "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
    "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

const COUNTRIES = [
    "Nigeria", "Ghana", "Benin Republic", "Togo", "Cameroon", "Niger",
    "Chad", "Senegal", "United Kingdom", "United States", "Canada",
    "South Africa", "Kenya", "Ethiopia", "Other"
];

const Section = ({ title, icon: Icon, iconBg, children }: any) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-50">
            <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black text-gray-900">{title}</h2>
        </div>
        <div className="px-4 py-4 space-y-4">{children}</div>
    </div>
);

const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
    <div>
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">{label}</label>
        {children}
        {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
);

const Input = ({ value, onChange, placeholder, type = "text", readOnly }: any) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-all
            ${readOnly ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed" : "border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-900"}`}
    />
);

const SelectInput = ({ value, onChange, options, placeholder }: any) => (
    <select
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 text-gray-900 transition-all"
    >
        <option value="">{placeholder}</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
);

const Toast = ({ msg, ok }: { msg: string; ok: boolean }) => (
    <div className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl text-sm font-bold whitespace-nowrap animate-in fade-in slide-in-from-bottom-3
        ${ok ? "bg-slate-900 text-white" : "bg-rose-600 text-white"}`}>
        {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertCircle className="w-3.5 h-3.5" />}
        {msg}
    </div>
);

export default function PatientSettingsPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [passSaving, setPassSaving] = useState(false);
    const [pinSaving, setPinSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const [showPass, setShowPass] = useState(false);

    // Profile fields
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [nin, setNin] = useState("");
    const [state, setState] = useState("");
    const [country, setCountry] = useState("Nigeria");
    const [dob, setDob] = useState("");
    const [gender, setGender] = useState("");
    const [address, setAddress] = useState("");
    const [profilePic, setProfilePic] = useState("");

    // Security
    const [curPass, setCurPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");

    // PIN
    const [pin, setPin] = useState("");

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        api.get("/users/me").then((res: any) => {
            const u = res.data;
            setFullName(u.full_name || "");
            setEmail(u.email || "");
            setPhone(u.phone_number || u.phone || "");
            setNin(u.nin || u.national_id || "");
            setState(u.state || "");
            setCountry(u.country || "Nigeria");
            setDob(u.date_of_birth ? u.date_of_birth.slice(0, 10) : "");
            setGender(u.gender || "");
            setAddress(u.address || "");
            setProfilePic(u.profile_picture || "");
        }).catch(() => {});
    }, []);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setProfilePic(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            await api.put("/users/me", {
                full_name: fullName,
                phone_number: phone,
                nin,
                state,
                country,
                date_of_birth: dob || undefined,
                gender: gender || undefined,
                address,
                profile_picture: profilePic || undefined,
            });
            showToast("Profile updated successfully!");
        } catch (e: any) {
            showToast(e?.response?.data?.detail || "Failed to save", false);
        } finally { setSaving(false); }
    };

    const changePassword = async () => {
        if (!curPass || !newPass) return showToast("Fill all fields", false);
        if (newPass !== confirmPass) return showToast("Passwords don't match", false);
        if (newPass.length < 8) return showToast("Min 8 characters", false);
        setPassSaving(true);
        try {
            await api.post("/auth/change-password", { current_password: curPass, new_password: newPass });
            showToast("Password changed!");
            setCurPass(""); setNewPass(""); setConfirmPass("");
        } catch (e: any) {
            showToast(e?.response?.data?.detail || "Incorrect password", false);
        } finally { setPassSaving(false); }
    };

    const savePin = async () => {
        if (pin.length !== 4) return showToast("Enter 4-digit PIN", false);
        setPinSaving(true);
        try {
            await api.put("/users/me/pin", { pin });
            showToast("PIN set!"); setPin("");
            localStorage.setItem("najbel_wallet_pin", "true");
        } catch { showToast("Failed to set PIN", false); }
        finally { setPinSaving(false); }
    };

    const initials = fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "P";

    return (
        <div className="max-w-lg mx-auto px-3 pb-32 pt-2 space-y-4">
            {toast && <Toast {...toast} />}

            {/* ── Hero Card ─────────────────────────────── */}
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-3xl p-5 text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute -bottom-8 -left-6 w-24 h-24 bg-white/5 rounded-full" />
                <div className="flex items-center gap-4 relative">
                    <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 overflow-hidden flex items-center justify-center">
                            {profilePic
                                ? <img src={profilePic} className="w-full h-full object-cover" alt="Avatar" />
                                : <span className="text-2xl font-black">{initials}</span>
                            }
                        </div>
                        <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform">
                            <Camera className="w-3 h-3 text-gray-600" />
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                        </label>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-lg font-black leading-tight truncate">{fullName || "My Profile"}</p>
                        <p className="text-white/70 text-xs mt-0.5 truncate">{email}</p>
                        {state && <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-lg mt-1.5 inline-block">📍 {state}, {country}</span>}
                    </div>
                </div>
                <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="mt-4 w-full bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-bold py-2 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {saving ? "Saving..." : "Save Profile"}
                </button>
            </div>

            {/* ── Personal Details ──────────────────────── */}
            <Section title="Personal Details" icon={User} iconBg="bg-blue-50 text-blue-600">
                <Field label="Full Name">
                    <Input value={fullName} onChange={(e: any) => setFullName(e.target.value)} placeholder="Your full name" />
                </Field>
                <Field label="Email Address">
                    <Input value={email} readOnly />
                </Field>
                <Field label="Date of Birth">
                    <Input type="date" value={dob} onChange={(e: any) => setDob(e.target.value)} />
                </Field>
                <Field label="Gender">
                    <SelectInput value={gender} onChange={(e: any) => setGender(e.target.value)} options={["Male", "Female", "Other"]} placeholder="Select gender" />
                </Field>
            </Section>

            {/* ── Contact & Identity ────────────────────── */}
            <Section title="Contact & Identity" icon={CreditCard} iconBg="bg-indigo-50 text-indigo-600">
                <Field label="Phone Number" hint="Visible to your doctor and the clinic">
                    <div className="flex gap-2">
                        <span className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 shrink-0">
                            📞
                        </span>
                        <Input value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="+234 800 000 0000" />
                    </div>
                </Field>
                <Field label="NIN (National ID Number)" hint="Used for identity verification — kept confidential">
                    <div className="flex gap-2">
                        <span className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 shrink-0">
                            🪪
                        </span>
                        <Input value={nin} onChange={(e: any) => setNin(e.target.value)} placeholder="12345678901" />
                    </div>
                </Field>
                <Field label="Home Address">
                    <Input value={address} onChange={(e: any) => setAddress(e.target.value)} placeholder="Street, Area..." />
                </Field>
            </Section>

            {/* ── Location ──────────────────────────────── */}
            <Section title="Location" icon={MapPin} iconBg="bg-emerald-50 text-emerald-600">
                <Field label="State" hint="Helps doctors understand your regional health context">
                    <SelectInput value={state} onChange={(e: any) => setState(e.target.value)} options={NIGERIAN_STATES} placeholder="Select state" />
                </Field>
                <Field label="Country">
                    <SelectInput value={country} onChange={(e: any) => setCountry(e.target.value)} options={COUNTRIES} placeholder="Select country" />
                </Field>
                <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </Section>

            {/* ── Password ──────────────────────────────── */}
            <Section title="Change Password" icon={Lock} iconBg="bg-amber-50 text-amber-600">
                {[
                    { label: "Current Password", value: curPass, set: setCurPass },
                    { label: "New Password", value: newPass, set: setNewPass },
                    { label: "Confirm New Password", value: confirmPass, set: setConfirmPass },
                ].map(({ label, value, set }) => (
                    <Field key={label} label={label}>
                        <div className="relative">
                            <input
                                type={showPass ? "text" : "password"}
                                value={value}
                                onChange={e => set(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-50 text-gray-900 transition-all"
                            />
                        </div>
                    </Field>
                ))}
                <button onClick={() => setShowPass(p => !p)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 -mt-1">
                    {showPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showPass ? "Hide" : "Show"} passwords
                </button>
                {newPass && (
                    <div className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl ${newPass.length >= 8 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {newPass.length >= 8 ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {newPass.length >= 8 ? "Password strength: Good ✓" : `${8 - newPass.length} more characters needed`}
                    </div>
                )}
                <button
                    onClick={changePassword}
                    disabled={passSaving}
                    className="w-full bg-slate-900 text-white font-bold py-3 rounded-2xl transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                >
                    {passSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    {passSaving ? "Updating..." : "Update Password"}
                </button>
            </Section>

            {/* ── Transaction PIN ───────────────────────── */}
            <Section title="Transaction PIN" icon={ShieldCheck} iconBg="bg-violet-50 text-violet-600">
                <Field label="4-Digit PIN" hint="Used for wallet transactions and payment authorisation">
                    <div className="flex items-center gap-3">
                        <input
                            type="password"
                            maxLength={4}
                            value={pin}
                            onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
                            placeholder="••••"
                            className="w-24 text-center py-2.5 border border-gray-200 rounded-xl text-lg font-black tracking-[0.5em] outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-50"
                        />
                        <button
                            onClick={savePin}
                            disabled={pinSaving || pin.length !== 4}
                            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {pinSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                            {pinSaving ? "Setting..." : "Set PIN"}
                        </button>
                    </div>
                </Field>
            </Section>

            {/* ── Sign Out ──────────────────────────────── */}
            <button
                onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/login"); }}
                className="w-full py-3.5 text-rose-600 font-bold bg-rose-50 rounded-2xl border border-rose-100 hover:bg-rose-100 transition-all flex items-center justify-center gap-2 text-sm active:scale-95"
            >
                <LogOut className="w-4 h-4" /> Sign Out
            </button>
        </div>
    );
}
