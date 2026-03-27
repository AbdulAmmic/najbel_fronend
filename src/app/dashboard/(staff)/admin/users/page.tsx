"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Search,
    Shield,
    UserPlus,
    Filter,
    MoreVertical,
    Wallet,
    Mail,
    Phone,
    X,
    ArrowUpRight,
    SearchX,
    CheckCircle2,
    Activity,
    Zap,
    CreditCard,
    DollarSign,
    ArrowRight,
    Eye,
    Power,
    ShieldAlert,
    Trash2
} from "lucide-react";
import { auth, users as usersApi, billing } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showFundModal, setShowFundModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [fundAmount, setFundAmount] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
    const [banks, setBanks] = useState<any[]>([]);
    const [fundingLoading, setFundingLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [newUser, setNewUser] = useState({
        email: "",
        full_name: "",
        password: "",
        role: "doctor",
        phone_number: "",
        address: ""
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await usersApi.getAll();
            setUsers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchBanks = async () => {
        try {
            const data = await billing.getBanks();
            setBanks(data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchBanks();
    }, []);

    const handleCreateUser = async () => {
        try {
            await auth.register(newUser);
            setShowAddModal(false);
            setNewUser({ email: "", full_name: "", password: "", role: "doctor", phone_number: "", address: "" });
            fetchUsers();
        } catch (e: any) {
            alert(e.response?.data?.detail || "Failed to create user");
        }
    };

    const handleFundWallet = async () => {
        if (!selectedUser?.patient_profile?.id || !fundAmount) return;
        try {
            setFundingLoading(true);
            await billing.fundWallet(
                selectedUser.patient_profile.id,
                parseFloat(fundAmount),
                paymentMethod,
                paymentMethod === 'transfer' ? (selectedBankId ?? undefined) : undefined
            );
            setFeedback({ type: 'success', message: `Wallet pre-funded with ₦${parseFloat(fundAmount).toLocaleString()} via ${paymentMethod.toUpperCase()}` });
            setShowFundModal(false);
            setFundAmount("");
            setSelectedBankId(null);
            fetchUsers();
        } catch (e: any) {
            setFeedback({ type: 'error', message: e.response?.data?.detail || "Authorization Failure or System Timeout" });
        } finally {
            setFundingLoading(false);
        }
    };

    const handleToggleStatus = async (user: any) => {
        try {
            await usersApi.update(user.id, { is_active: !user.is_active });
            setFeedback({
                type: 'success',
                message: `Account for ${user.full_name} has been ${user.is_active ? 'FROZEN' : 'ACTIVATED'} successfully.`
            });
            fetchUsers();
        } catch (e: any) {
            setFeedback({ type: 'error', message: e.response?.data?.detail || "Action failed" });
        }
    };

    const handleViewUser = (user: any) => {
        if (user.role === 'patient' && user.patient_profile?.id) {
            window.location.href = `/dashboard/staff/patients/${user.patient_profile.id}`;
        } else {
            setFeedback({ type: 'success', message: `Detailed profile for ${user.full_name} (${user.role.toUpperCase()}) is being analyzed.` });
        }
    };

    const handleDeleteUser = async (user: any) => {
        if (confirm(`ARE YOU ABSOLUTELY SURE? This will permanently delete ${user.full_name}'s account and ALL associated data. This action cannot be undone.`)) {
            try {
                await usersApi.delete(user.id);
                setFeedback({ type: 'success', message: `${user.full_name}'s account has been purged from the system.` });
                fetchUsers();
            } catch (e: any) {
                setFeedback({ type: 'error', message: e.response?.data?.detail || "Deletion failed" });
            }
        }
    };

    const roles = ["admin", "doctor", "nurse", "receptionist", "pharmacist", "lab_tech", "accountant", "patient"];

    const filteredUsers = users.filter(u => {
        const matchesRole = filterRole === "all" || u.role === filterRole;
        const matchesSearch = u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesRole && matchesSearch;
    });

    return (
        <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-indigo-100">Identity Control</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-blue-100">
                            <Activity className="w-3 h-3" />
                            Active Sync
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">User Management</h1>
                    <p className="text-gray-500 font-medium text-sm">System-wide user registry, role auditing, and financial provisioning.</p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group text-sm"
                >
                    <UserPlus className="w-4 h-4" />
                    Provision User
                </button>
            </div>

            {/* Filters Hub */}
            <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search Registry..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/10 placeholder-gray-400 text-sm font-semibold transition-all"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-xl w-full lg:w-auto overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setFilterRole("all")}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filterRole === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Every Role
                    </button>
                    {roles.map(role => (
                        <button
                            key={role}
                            onClick={() => setFilterRole(role)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filterRole === role ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users Ledger Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left order-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Profile</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Role</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Operational</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse"><td colSpan={5} className="p-6 h-16 bg-gray-50/20"></td></tr>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="group hover:bg-gray-50/30 transition-all cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 font-black text-xs relative group-hover:bg-blue-50 group-hover:text-blue-600 transition-all border border-gray-100/50">
                                                    {user.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                                    {user.role === 'admin' && <div className="absolute -top-1 -right-1 p-1 bg-amber-500 rounded-full border-2 border-white"><Shield className="w-2 h-2 text-white" /></div>}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight">{user.full_name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                                        ID: {user.patient_profile?.unique_id || user.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                                    <Mail className="w-3 h-3 opacity-40" /> {user.email}
                                                </div>
                                                {user.phone_number && (
                                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                                        <Phone className="w-3 h-3 opacity-40" /> {user.phone_number}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${user.role === 'admin' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                user.role === 'doctor' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    user.role === 'patient' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        'bg-gray-50 text-gray-400 border-gray-100'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 text-sm tracking-tight">{user.full_name}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                                                        {user.is_active ? 'Operational' : 'Suspended'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-300 font-medium ml-1">• {user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewUser(user)}
                                                    className="h-8 w-8 rounded-xl bg-gray-50 text-gray-400 hover:bg-white hover:text-indigo-600 border border-gray-100/50 flex items-center justify-center transition-all group"
                                                    title="View Profile"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(user)}
                                                    className={`h-8 w-8 rounded-xl border flex items-center justify-center transition-all ${user.is_active ? 'bg-rose-50 text-rose-400 border-rose-100/50 hover:bg-rose-500 hover:text-white' : 'bg-emerald-50 text-emerald-400 border-emerald-100/50 hover:bg-emerald-500 hover:text-white'}`}
                                                    title={user.is_active ? "Freeze Account" : "Activate Account"}
                                                >
                                                    <Power className="w-3.5 h-3.5" />
                                                </button>
                                                {user.role === 'patient' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setShowFundModal(true); }}
                                                        className="h-8 px-3 rounded-xl bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all text-[10px] font-bold uppercase flex items-center gap-2 shadow-sm"
                                                    >
                                                        <Wallet className="w-3.5 h-3.5" />
                                                        Fund
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="h-8 w-8 rounded-xl bg-gray-50 text-gray-300 hover:bg-rose-500 hover:text-white border border-gray-100/50 flex items-center justify-center transition-all group"
                                                    title="Delete Account"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-white hover:text-blue-600 transition-all border border-gray-100/50">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <SearchX className="w-10 h-10 mx-auto mb-4 text-gray-200" />
                                        <p className="text-sm font-bold text-gray-400 tracking-tight">No data matches your query filters.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[130] p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white p-8 rounded-2xl w-full max-w-xl border border-gray-100 shadow-2xl relative"
                        >
                            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-400"><X className="w-5 h-5" /></button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-blue-600 rounded-xl text-white">
                                    <UserPlus className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Provision User</h2>
                                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">System Security Protocol 04-A</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5 md:col-span-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Identity Name</p>
                                    <input
                                        className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-300 text-sm font-semibold"
                                        placeholder="Enter Legal Full Name"
                                        value={newUser.full_name}
                                        onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">System Email</p>
                                    <input
                                        className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-300 text-sm font-semibold"
                                        placeholder="email@example.com"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Contact Link</p>
                                    <input
                                        className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-300 text-sm font-semibold"
                                        placeholder="+234..."
                                        value={newUser.phone_number}
                                        onChange={e => setNewUser({ ...newUser, phone_number: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Assigned Authority</p>
                                    <select
                                        className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/10 text-sm font-bold capitalize cursor-pointer"
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        {roles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Access Key</p>
                                    <input
                                        type="password"
                                        className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500/10 placeholder:text-gray-300 text-sm font-semibold"
                                        placeholder="Secure Passphrase"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all">Cancel</button>
                                <button onClick={handleCreateUser} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg active:scale-95 transition-all flex items-center gap-2 group">
                                    Commit Provisioning <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {showFundModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[130] p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl p-8 relative overflow-hidden border border-gray-100"
                        >
                            <button
                                onClick={() => {
                                    setShowFundModal(false);
                                    setSelectedBankId(null);
                                    setFundAmount("");
                                }}
                                className="absolute top-8 right-8 p-3 rounded-xl hover:bg-gray-100 transition-all text-gray-400 group active:scale-95"
                            >
                                <X className="w-5 h-5 group-hover:text-gray-900" />
                            </button>

                            <div className="mb-10 text-center">
                                <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 mb-6 inline-block border border-emerald-100 shadow-sm mx-auto">
                                    <Wallet className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">Financial Provision</h2>
                                <p className="text-gray-400 font-bold text-[10px] tracking-widest uppercase mt-2">Target <ArrowRight className="inline w-3 h-3 mx-1" /> {selectedUser?.full_name}</p>
                            </div>

                            <div className="space-y-8">
                                {/* Step 1: Amount & Method */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Step 1: Settlement Parameters</label>
                                        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                                            <button
                                                onClick={() => setPaymentMethod('cash')}
                                                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'cash' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                <DollarSign className="w-3.5 h-3.5" /> Cash
                                            </button>
                                            <button
                                                onClick={() => setPaymentMethod('transfer')}
                                                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'transfer' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                <CreditCard className="w-3.5 h-3.5" /> Bank
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="relative group">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300 group-focus-within:text-indigo-600 transition-colors">₦</span>
                                            <input
                                                type="number"
                                                className="w-full bg-gray-50/50 border border-gray-100 pl-14 pr-6 py-6 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 text-3xl font-black tracking-tighter text-gray-900 placeholder:text-gray-200 transition-all"
                                                placeholder="0.00"
                                                value={fundAmount}
                                                onChange={e => setFundAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2: Bank (if Transfer) */}
                                {paymentMethod === 'transfer' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Step 2: Target Institution</label>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                            {banks.length > 0 ? banks.map(bank => (
                                                <button
                                                    key={bank.id}
                                                    onClick={() => setSelectedBankId(bank.id)}
                                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left group ${selectedBankId === bank.id ? 'bg-blue-50 border-blue-200 shadow-md ring-2 ring-blue-500/5' : 'bg-gray-50/30 border-gray-100 hover:border-blue-100'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${selectedBankId === bank.id ? 'bg-white text-blue-600 shadow-sm' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600'} transition-all`}>
                                                            <CreditCard className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">{bank.bank_name}</p>
                                                            <p className="text-[9px] font-bold text-gray-400 tracking-widest">{bank.account_number}</p>
                                                        </div>
                                                    </div>
                                                    {selectedBankId === bank.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                                                </button>
                                            )) : (
                                                <div className="p-4 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase italic opacity-60">No institutional accounts configured.</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                <div className="pt-4">
                                    <button
                                        disabled={!fundAmount || (paymentMethod === 'transfer' && !selectedBankId) || fundingLoading}
                                        onClick={handleFundWallet}
                                        className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-3 ${fundingLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-indigo-500/30 hover:shadow-indigo-500/50'
                                            }`}
                                    >
                                        {fundingLoading ? (
                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full" />
                                        ) : (
                                            <>Commit Transaction <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Feedback Modal */}
                <AnimatePresence>
                    {feedback && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px]">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                className={`rounded-3xl p-6 shadow-2xl border flex flex-col items-center text-center max-w-xs w-full ${feedback.type === 'success' ? 'bg-white border-emerald-100' : 'bg-white border-rose-100'}`}
                            >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    {feedback.type === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <X className="w-8 h-8" />}
                                </div>
                                <h3 className={`text-lg font-black mb-2 ${feedback.type === 'success' ? 'text-gray-900' : 'text-rose-900'}`}>{feedback.type === 'success' ? 'Action Completed' : 'Operation Failed'}</h3>
                                <p className="text-sm font-medium text-gray-500 mb-6">{feedback.message}</p>
                                <button onClick={() => setFeedback(null)} className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${feedback.type === 'success' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-rose-600 text-white shadow-lg shadow-rose-500/20'}`}>Dismiss</button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </AnimatePresence>
        </div>
    );
}
