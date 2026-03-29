"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  History,
  Search,
  Filter,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  Clock,
  X,
  MoreVertical,
  BarChart3,
  ArrowRight,
  Shield,
  Lock
} from "lucide-react";
import { billing, patients as patientsApi } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { useWebSocket } from "@/contexts/WebSocketContext";

export default function BillingOverviewPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total_revenue: 0,
    pending_amount: 0,
    paid_count: 0,
    pending_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundingLoading, setFundingLoading] = useState(false);
  const [patientBalance, setPatientBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Create Invoice State
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [invoiceDesc, setInvoiceDesc] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");

  // Funding Form State
  const [availablePatients, setAvailablePatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [newBank, setNewBank] = useState({ bank_name: '', account_name: '', account_number: '' });

  // Overdraft State
  const [showOverdraftModal, setShowOverdraftModal] = useState(false);
  const [overdraftStep, setOverdraftStep] = useState<'select' | 'confirm' | 'otp'>('select');
  const [otpCode, setOtpCode] = useState("");
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);

  // Service Templates
  const [serviceTemplates, setServiceTemplates] = useState<any[]>([]);
  const [showManageTemplatesModal, setShowManageTemplatesModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', amount: '' });

  // Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const { lastMessage } = useWebSocket();

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [invoiceData, bankData, templateData] = await Promise.all([
        billing.getInvoices(),
        billing.getBanks(),
        billing.getServiceTemplates()
      ]);
      setInvoices(invoiceData);
      setBanks(bankData);
      setServiceTemplates(templateData);

      const s = invoiceData.reduce((acc: any, inv: any) => {
        acc.total_revenue += inv.total_amount;
        if (inv.status === 'pending') {
          acc.pending_amount += inv.total_amount;
          acc.pending_count++;
        } else {
          acc.paid_count++;
        }
        return acc;
      }, { total_revenue: 0, pending_amount: 0, paid_count: 0, pending_count: 0 });
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await patientsApi.getAll();
      setAvailablePatients(data);
    } catch (e) {
      console.error("Failed to fetch patients", e);
    }
  };

  useEffect(() => {
    fetchBillingData();
    fetchPatients();
  }, []);

  useEffect(() => {
    if (lastMessage && lastMessage.includes('billing_update')) {
      fetchBillingData();
    }
  }, [lastMessage]);




  const handleAddTemplate = async () => {
    try {
      await billing.addServiceTemplate({
        ...newTemplate,
        amount: parseFloat(newTemplate.amount)
      });
      const updated = await billing.getServiceTemplates();
      setServiceTemplates(updated);
      setNewTemplate({ name: '', description: '', amount: '' });
      setFeedback({ type: 'success', message: 'Ready-made invoice added successfully' });
    } catch (e) {
      setFeedback({ type: 'error', message: 'Failed to add template' });
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      await billing.deleteServiceTemplate(id);
      const updated = await billing.getServiceTemplates();
      setServiceTemplates(updated);
      setFeedback({ type: 'success', message: 'Template removed' });
    } catch (e) {
      setFeedback({ type: 'error', message: 'Failed to remove template' });
    }
  };

  const handlePayInvoice = async (id: number) => {
    try {
      await billing.payInvoice(id, 'wallet');
      setFeedback({ type: 'success', message: 'Invoice paid successfully via wallet' });
      fetchBillingData();
      setSelectedInvoice(null);
      setPatientBalance(null);
    } catch (e) {
      setFeedback({ type: 'error', message: 'Payment failed' });
    }
  };

  const fetchPatientBalance = async (patientId: number) => {
    try {
      setLoadingBalance(true);
      const response = await billing.getWallet(patientId);
      setPatientBalance(response.balance);
    } catch (e) {
      console.error("Failed to fetch balance", e);
      setPatientBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (selectedInvoice && selectedInvoice.status === 'pending') {
      fetchPatientBalance(selectedInvoice.patient_id);
    }
  }, [selectedInvoice]);

  const handleFundWallet = async () => {
    if (!selectedPatient || !fundAmount) return;
    try {
      setFundingLoading(true);
      await billing.fundWallet(
        selectedPatient.id,
        parseFloat(fundAmount),
        paymentMethod,
        selectedBankId || undefined
      );
      setFeedback({ type: 'success', message: `₦${parseFloat(fundAmount).toLocaleString()} added to ${selectedPatient.user.full_name}'s wallet.` });
      setShowFundModal(false);
      setFundAmount("");
      setSelectedPatient(null);
      fetchBillingData();
    } catch (e) {
      setFeedback({ type: 'error', message: 'Funding failed. Please check inputs.' });
    } finally {
      setFundingLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedPatient || !invoiceDesc || !invoiceAmount) return;
    try {
      setFundingLoading(true);
      await billing.createInvoice({
        patient_id: selectedPatient.id,
        items: [{
          description: invoiceDesc,
          amount: parseFloat(invoiceAmount)
        }]
      });
      setFeedback({ type: 'success', message: 'Invoice generated successfully' });
      setShowCreateInvoiceModal(false);
      setInvoiceDesc("");
      setInvoiceAmount("");
      setSelectedPatient(null);
      fetchBillingData();
    } catch (e) {
      setFeedback({ type: 'error', message: 'Failed to create invoice.' });
    } finally {
      setFundingLoading(false);
    }
  };

  const handleAddBank = async () => {
    try {
      await billing.addBank(newBank);
      const updatedBanks = await billing.getBanks();
      setBanks(updatedBanks);
      setShowAddBankModal(false);
      setNewBank({ bank_name: '', account_name: '', account_number: '' });
      setFeedback({ type: 'success', message: 'Bank account added successfully' });
    } catch (e) {
      setFeedback({ type: 'error', message: 'Failed to add bank' });
    }
  };

  const handleRequestOverdraft = async () => {
    if (!selectedPatient) return;
    try {
      setIsRequestingOtp(true);
      await billing.requestOverdraft(selectedPatient.id);
      setOverdraftStep('otp');
      setFeedback({ type: 'success', message: 'Authorization OTP sent to your email.' });
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.response?.data?.detail || 'Failed to request OTP' });
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleConfirmOverdraft = async () => {
    if (!selectedPatient || !otpCode) return;
    try {
      setFundingLoading(true);
      await billing.confirmOverdraft(selectedPatient.id, otpCode);
      setFeedback({ type: 'success', message: `Overdraft successfully enabled for ${selectedPatient.full_name}.` });
      setShowOverdraftModal(false);
      setOverdraftStep('select');
      setSelectedPatient(null);
      setOtpCode("");
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.response?.data?.detail || 'OTP verification failed' });
    } finally {
      setFundingLoading(false);
    }
  };

  const filteredPatients = searchQuery.length > 0
    ? availablePatients.filter(p =>
      (p.full_name && p.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.unique_id && p.unique_id.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : [];

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-emerald-100/50 shadow-sm">Revenue Control</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-blue-100/50">
              <Activity className="w-3 h-3" />
              Live Audit
            </div>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none text-highlight">Financial Overview</h1>
          <p className="text-gray-500 font-medium text-sm">Tracking clinic cashflow, patient settlements, and ledger health.</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-sm">
          <button className="px-4 py-2 bg-white text-gray-900 rounded-lg shadow-sm text-[10px] font-bold uppercase tracking-widest transition-all">Day</button>
          <button className="px-4 py-2 text-gray-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:text-gray-600 transition-all">Week</button>
          <button className="px-4 py-2 text-gray-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:text-gray-600 transition-all">Month</button>
        </div>
      </div>

      {/* Financial Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Revenue", value: `₦${(stats.total_revenue || 0).toLocaleString()}`, change: "+14%", trend: "up", icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          { title: "Pending Collection", value: `₦${(stats.pending_amount || 0).toLocaleString()}`, change: "-3%", trend: "up", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
          { title: "Paid Drafts", value: stats.paid_count, change: "Stable", trend: "neutral", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
          { title: "Aging Invoices", value: stats.pending_count, change: "+8%", trend: "down", icon: History, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" }
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${s.bg} ${s.color} border ${s.border} shadow-sm group-hover:scale-110 transition-transform`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold ${s.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {s.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {s.change}
              </div>
            </div>
            <div className="space-y-0.5">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">{s.value}</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Invoices Ledger */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg shadow-md">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Real-time Ledger</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <input className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-4 focus:ring-blue-500/5 placeholder:text-gray-300" placeholder="Find ID..." />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left order-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Descriptor</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client Unit</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valuation</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lifecycle</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse h-16"><td colSpan={5} className="px-6 bg-gray-50/20 shadow-inner"></td></tr>
                  ))
                ) : invoices.slice(0, 8).map(inv => (
                  <tr key={inv.id} className="group hover:bg-gray-50/30 transition-all cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-sm tracking-tight">INV-{inv.id.toString().padStart(4, '0')}</span>
                        <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest mt-0.5">{new Date(inv.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-xs text-gray-400 border border-gray-100 shadow-inner">
                          {inv.patient_name ? inv.patient_name[0] : 'P'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 tracking-tight">{inv.patient_name || 'Anonymous'}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase">{inv.category || 'General'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-gray-900 text-sm tracking-tighter">₦{(inv.amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-rose-50 text-rose-600 border-rose-100/50'
                        }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-white hover:text-indigo-600 transition-all border border-gray-100/50">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Actions Hub */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 px-1">Settlement Matrix</h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { name: "Manual Settlement", icon: Plus, color: "bg-indigo-600", desc: "Commit to ledger", onClick: () => setShowCreateInvoiceModal(true) },
                { name: "Manage Presets", icon: Filter, color: "bg-purple-600", desc: "Add ready-made invoices", onClick: () => setShowManageTemplatesModal(true) },
                { name: "Fund Patient Wallet", icon: Wallet, color: "bg-emerald-600", desc: "Top up patient balance", onClick: () => setShowFundModal(true) },
                { name: "Manage Overdraft", icon: Shield, color: "bg-amber-600", desc: "Enable negative balance", onClick: () => setShowOverdraftModal(true) },
                { name: "Audit Export", icon: ArrowUpRight, color: "bg-gray-800", desc: "Download XLS/PDF", onClick: () => { } },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={action.onClick}
                  className="group p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all text-left flex items-center gap-4"
                >
                  <div className={`w-12 h-12 shrink-0 rounded-2xl ${action.color} ${!action.color.includes('text') ? 'text-white' : ''} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 tracking-tight">{action.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{action.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>

          {/* Bank Management Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-gray-900">Hospital Banks</h2>
              <button
                onClick={() => setShowAddBankModal(true)}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all border border-blue-100/50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {banks.length > 0 ? banks.map(bank => (
                <div key={bank.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{bank.bank_name}</p>
                      <p className="text-[9px] font-bold text-gray-400 tracking-widest">{bank.account_number}</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm("Deactivate this bank?")) {
                        await billing.deleteBank(bank.id);
                        fetchBillingData();
                      }
                    }}
                    className="p-2 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )) : (
                <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic leading-relaxed">No active banks configured.<br />Add a bank to enable transfers.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-indigo-900 rounded-2xl text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Vault Health</span>
                </div>
                <span className="px-2 py-1 bg-white/10 text-white text-[9px] font-black tracking-widest uppercase rounded-lg border border-white/10 italic">Secure Channel</span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Pending Settlement</p>
                <p className="text-3xl font-black tracking-tighter">₦{(stats.pending_amount || 0).toLocaleString()}</p>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "75%" }}
                  className="h-full bg-indigo-400 rounded-full"
                ></motion.div>
              </div>
              <p className="text-[10px] font-bold text-indigo-200 leading-relaxed uppercase opacity-70">Automated payouts are synchronized every 24 hours with the central reserve.</p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          </div>
        </div>
      </div>

      {/* Settlement Drawer */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl p-8 lg:p-10 relative overflow-hidden border border-gray-100"
            >
              <button onClick={() => setSelectedInvoice(null)} className="absolute top-8 right-8 p-3 rounded-xl hover:bg-gray-100 transition-all text-gray-400 group active:scale-95"><X className="w-5 h-5 group-hover:text-gray-900" /></button>

              <div className="mb-10 text-center">
                <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 mb-6 inline-block border border-indigo-100 shadow-sm mx-auto">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">Invoice Settlement</h2>
                <p className="text-gray-400 font-bold text-[10px] tracking-widest uppercase mt-2">Descriptor Hub <ArrowRight className="inline w-3 h-3 mx-1" /> INV-{selectedInvoice.id}</p>
              </div>

              <div className="space-y-8">
                <div className="bg-gray-50/50 rounded-2xl p-6 space-y-4 border border-gray-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-widest">Client Name</span>
                    <span className="text-gray-900 font-black">{selectedInvoice.patient_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-widest">Service Item</span>
                    <span className="text-gray-900 font-black">{selectedInvoice.category || 'General Consultation'}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-200/50 flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aggregate Valuation</span>
                    <span className="text-2xl font-black text-indigo-600 tracking-tighter">₦{(selectedInvoice.amount || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-sm">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white inline-block shadow-sm text-blue-600">
                                <Wallet className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[9px] font-bold text-blue-800 uppercase tracking-widest">Available Balance</p>
                                <p className="text-xs font-black text-blue-900 uppercase">
                                    {loadingBalance ? 'Checking...' : patientBalance !== null ? `₦${patientBalance.toLocaleString()}` : '—'}
                                </p>
                            </div>
                        </div>
                        {patientBalance !== null && (
                            <div className="text-right">
                                <p className="text-[9px] font-bold text-gray-400 uppercase">Post-Payment</p>
                                <p className={`text-xs font-black ${(patientBalance - selectedInvoice.amount >= 0) ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    ₦{(patientBalance - selectedInvoice.amount).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {selectedInvoice.status === 'pending' && (
                  <button
                    onClick={() => handlePayInvoice(selectedInvoice.id)}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                  >
                    Authorize Settlement <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="w-full py-4 bg-gray-50 text-gray-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100"
                >
                  Dismiss Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fund Wallet Modal */}
      <AnimatePresence>
        {showFundModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl p-8 relative overflow-hidden border border-gray-100"
            >
              <button
                onClick={() => { setShowFundModal(false); setSelectedPatient(null); setSearchQuery(""); }}
                className="absolute top-6 right-6 p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Fund Patient Wallet</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Administrative Top-up</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* 1. Patient Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Step 1: Patient Profile</label>
                    {selectedPatient && <span className="text-[9px] font-black text-emerald-600 uppercase italic">Identified</span>}
                  </div>
                  {!selectedPatient ? (
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold placeholder:text-gray-300 shadow-inner"
                        placeholder="Scan Card or Search Name..."
                      />
                      {filteredPatients.length > 0 && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-20 max-h-60 overflow-y-auto divide-y divide-gray-50">
                          {filteredPatients.map(p => (
                            <button
                              key={p.id}
                              onClick={() => { setSelectedPatient(p); setSearchQuery(""); }}
                              className="w-full flex items-center justify-between p-4 hover:bg-emerald-50 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <Activity className="w-4 h-4 text-emerald-600" />
                                <div className="text-left">
                                  <p className="text-sm font-black text-gray-900">{p.full_name}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.unique_id}</p>
                                </div>
                              </div>
                              <Plus className="w-4 h-4 text-gray-300" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-lg text-emerald-600 border border-emerald-100">
                          {selectedPatient.full_name ? selectedPatient.full_name[0] : 'P'}
                        </div>
                        <div>
                          <p className="text-base font-black text-gray-900 leading-none">{selectedPatient.full_name}</p>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-1.5">{selectedPatient.unique_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/patients/${selectedPatient.id}`} className="p-2 bg-white rounded-lg text-gray-400 hover:text-indigo-600 transition-all border border-emerald-100/50 shadow-sm"><Activity className="w-4 h-4" /></Link>
                        <button onClick={() => setSelectedPatient(null)} className="p-2 bg-white rounded-lg text-gray-400 hover:text-rose-500 transition-all border border-emerald-100/50 shadow-sm"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Funding Parameters */}
                <div className="space-y-6 pt-4 border-t border-gray-100">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Step 2: Settlement Parameters</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1 opacity-60">Payment Authority</p>
                        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                          <button
                            onClick={() => setPaymentMethod('cash')}
                            className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'cash' ? 'bg-white text-emerald-600 shadow-md border border-emerald-50' : 'text-gray-400'}`}
                          >
                            Cash
                          </button>
                          <button
                            onClick={() => setPaymentMethod('transfer')}
                            className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'transfer' ? 'bg-white text-blue-600 shadow-md border border-blue-50' : 'text-gray-400'}`}
                          >
                            Transfer
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1 opacity-60">Value Amount (₦)</p>
                        <div className="relative">
                          <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                          <input
                            type="number"
                            value={fundAmount}
                            onChange={(e) => setFundAmount(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-gray-900 shadow-inner"
                            placeholder="Enter Amount"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Bank Verification (if Transfer) */}
                  {paymentMethod === 'transfer' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Step 3: Target Institution</label>
                        <button onClick={() => { setShowAddBankModal(true); setShowFundModal(false); }} className="text-[9px] font-black text-blue-600 uppercase tracking-widest underline decoration-blue-200 decoration-2 underline-offset-4">Manage Banks</button>
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
                                <p className="text-[9px] font-bold text-gray-400 tracking-widest">{bank.account_number} • {bank.account_name}</p>
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
                </div>

                <div className="pt-4">
                  <button
                    disabled={!selectedPatient || !fundAmount || (paymentMethod === 'transfer' && !selectedBankId) || fundingLoading}
                    onClick={handleFundWallet}
                    className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-3 ${fundingLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-indigo-500/30 hover:shadow-indigo-500/50'
                      }`}
                  >
                    {fundingLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full"
                      />
                    ) : (
                      <>Commit Transaction <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </button>
                  <p className="text-center mt-4 text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] opacity-60">Authorized: All manual settlements are audited in the central ledger.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Add Bank Modal */}
      <AnimatePresence>
        {showAddBankModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative border border-gray-100"
            >
              <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" /> Configure Hospital Bank
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bank Name</label>
                  <input
                    value={newBank.bank_name}
                    onChange={(e) => setNewBank({ ...newBank, bank_name: e.target.value })}
                    placeholder="e.g. Zenith Bank"
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Name</label>
                  <input
                    value={newBank.account_name}
                    onChange={(e) => setNewBank({ ...newBank, account_name: e.target.value })}
                    placeholder="e.g. Najbel Clinic Operating Acct"
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Number</label>
                  <input
                    value={newBank.account_number}
                    onChange={(e) => setNewBank({ ...newBank, account_number: e.target.value })}
                    placeholder="0123456789"
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setShowAddBankModal(false)} className="flex-1 py-3 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-gray-600">Cancel</button>
                  <button
                    onClick={handleAddBank}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
                  >
                    Save Record
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Feedback Modal */}
      <AnimatePresence>
        {feedback && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px]">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className={`rounded-3xl p-6 shadow-2xl border flex flex-col items-center text-center max-w-xs w-full ${feedback.type === 'success' ? 'bg-white border-emerald-100' : 'bg-white border-rose-100'
                }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <X className="w-8 h-8" />}
              </div>
              <h3 className={`text-lg font-black mb-2 ${feedback.type === 'success' ? 'text-gray-900' : 'text-rose-900'}`}>
                {feedback.type === 'success' ? 'Action Completed' : 'Operation Failed'}
              </h3>
              <p className="text-sm font-medium text-gray-500 mb-6">{feedback.message}</p>
              <button
                onClick={() => setFeedback(null)}
                className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${feedback.type === 'success' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                  }`}
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Invoice Modal */}
      <AnimatePresence>
        {showCreateInvoiceModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-8 relative overflow-hidden"
            >
              <button onClick={() => setShowCreateInvoiceModal(false)} className="absolute top-6 right-6 p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-95"><X className="w-5 h-5" /></button>

              <div className="mb-8">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100/50 shadow-inner">
                  <DollarSign className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">Create Custom Invoice</h2>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Generate a manual settlement</p>
              </div>

              <div className="space-y-5">
                {/* Patient Search */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Select Client</label>
                  {!selectedPatient ? (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search patient by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-900"
                      />
                      {searchQuery && (
                        <div className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto z-[200]">
                          {filteredPatients.map(p => (
                            <button
                              key={p.id}
                              onClick={() => { setSelectedPatient(p); setSearchQuery(""); }}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50/50 last:border-0"
                            >
                              <div className="font-bold text-gray-900 text-sm tracking-tight">{p.user?.full_name}</div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.unique_id}</div>
                            </button>
                          ))}
                          {filteredPatients.length === 0 && <div className="px-4 py-3 text-sm text-gray-400 text-center font-medium italic">No matches found.</div>}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                      <div>
                        <div className="font-bold text-indigo-900 text-sm tracking-tight">{selectedPatient.user?.full_name}</div>
                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{selectedPatient.unique_id}</div>
                      </div>
                      <button onClick={() => setSelectedPatient(null)} className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {serviceTemplates.length > 0 && (
                    <div className="pb-4 border-b border-gray-100 italic">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Quick Select (Presets)</label>
                      <div className="flex flex-wrap gap-2">
                        {serviceTemplates.map(t => (
                          <button
                            key={t.id}
                            onClick={() => { setInvoiceDesc(t.description); setInvoiceAmount(t.amount.toString()); }}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold border border-indigo-100 hover:bg-indigo-100 transition-all active:scale-95"
                          >
                            {t.name} (₦{t.amount.toLocaleString()})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Lab Tests, Consultation..."
                      value={invoiceDesc}
                      onChange={(e) => setInvoiceDesc(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-gray-900 placeholder:text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Amount (₦)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={invoiceAmount}
                        onChange={(e) => setInvoiceAmount(e.target.value)}
                        className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-lg font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-gray-900 placeholder:text-gray-300 tracking-tighter"
                      />
                    </div>
                  </div>
                </div>

                <button
                  disabled={!selectedPatient || !invoiceAmount || !invoiceDesc || fundingLoading}
                  onClick={handleCreateInvoice}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold tracking-wide shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {fundingLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Generate Invoice
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Overdraft Management Modal */}
      <AnimatePresence>
        {showOverdraftModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 relative overflow-hidden border border-gray-100"
            >
              <button
                onClick={() => { setShowOverdraftModal(false); setSelectedPatient(null); setSearchQuery(""); setOverdraftStep('select'); setOtpCode(""); }}
                className="absolute top-6 right-6 p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Overdraft Control</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Client Credit Authorization</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {overdraftStep === 'select' && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Patient Profile</label>
                    {!selectedPatient ? (
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-amber-500/10 transition-all font-bold placeholder:text-gray-300 shadow-inner"
                          placeholder="Search Patient..."
                        />
                        {filteredPatients.length > 0 && (
                          <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-20 max-h-60 overflow-y-auto divide-y divide-gray-50">
                            {filteredPatients.map(p => (
                              <button
                                key={p.id}
                                onClick={() => { setSelectedPatient(p); setSearchQuery(""); setOverdraftStep('confirm'); }}
                                className="w-full flex items-center justify-between p-4 hover:bg-amber-50 transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <Activity className="w-4 h-4 text-amber-600" />
                                  <div className="text-left">
                                    <p className="text-sm font-black text-gray-900">{p.full_name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.unique_id}</p>
                                  </div>
                                </div>
                                <Plus className="w-4 h-4 text-gray-300" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-5 bg-amber-50/50 rounded-2xl border border-amber-100/50 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-lg text-amber-600 border border-amber-100">
                            {selectedPatient.full_name ? selectedPatient.full_name[0] : 'P'}
                          </div>
                          <div>
                            <p className="text-base font-black text-gray-900 leading-none">{selectedPatient.full_name}</p>
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1.5">{selectedPatient.unique_id}</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedPatient(null)} className="p-2 bg-white rounded-lg text-gray-400 hover:text-rose-500 transition-all border border-amber-100/50 shadow-sm"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                )}

                {overdraftStep === 'confirm' && selectedPatient && (
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold uppercase tracking-widest">Target Client</span>
                        <span className="text-gray-900 font-black">{selectedPatient.full_name}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold uppercase tracking-widest">ID Reference</span>
                        <span className="text-gray-900 font-black">{selectedPatient.unique_id}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex gap-3 text-amber-900">
                      <Shield className="w-5 h-5 shrink-0" />
                      <p className="text-[10px] font-bold leading-relaxed uppercase">Enabling overdraft allows this patient to book appointments and pay bills even with zero funds. This action requires staff authorization.</p>
                    </div>

                    <button
                      disabled={isRequestingOtp}
                      onClick={handleRequestOverdraft}
                      className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-amber-600/20 hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
                    >
                      {isRequestingOtp ? "Dispatching OTP..." : "Request Authorization OTP"}
                    </button>

                    <button
                      onClick={() => setOverdraftStep('select')}
                      className="w-full py-3 text-gray-400 font-black text-[9px] uppercase tracking-widest text-center"
                    >
                      Back to Selection
                    </button>
                  </div>
                )}

                {overdraftStep === 'otp' && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-inner">
                        <Lock className="w-6 h-6 " />
                      </div>
                      <h3 className="text-lg font-black text-gray-900 tracking-tight">Enter Secure Code</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check your email for the 6-digit code</p>
                    </div>

                    <div className="flex justify-center">
                      <input
                        type="text"
                        maxLength={6}
                        autoFocus
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="000000"
                        className="w-[200px] text-center text-3xl font-black bg-gray-50 border-2 border-gray-200 rounded-2xl py-4 outline-none focus:border-amber-500 transition-all tracking-[0.2em]"
                      />
                    </div>

                    <button
                      disabled={otpCode.length < 6 || fundingLoading}
                      onClick={handleConfirmOverdraft}
                      className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all"
                    >
                      {fundingLoading ? "Verifying..." : "Confirm & Enable Overdraft"}
                    </button>

                    <p className="text-center text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em] leading-relaxed italic">By confirming, you authorize this account for credit-based transactions.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
        {/* Manage Service Templates Modal */}
        {showManageTemplatesModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center border border-purple-200 shadow-sm">
                    <Filter className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">Manage Presets</h2>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configure ready-made invoice items</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManageTemplatesModal(false)}
                  className="p-2 hover:bg-white rounded-xl text-gray-400 transition-all border border-transparent hover:border-gray-200"
                >
                  <X className="w-5 h-5 " />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Add New Template Form */}
                <div className="space-y-4 p-5 bg-purple-50/30 rounded-2xl border border-purple-100 shadow-inner">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Item Name (Label)</label>
                      <input
                        type="text"
                        placeholder="e.g. Standard Consultation"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-purple-600 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Amount (₦)</label>
                      <input
                        type="number"
                        placeholder="5000"
                        value={newTemplate.amount}
                        onChange={(e) => setNewTemplate({ ...newTemplate, amount: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-purple-600 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Quick Add</label>
                      <button
                        onClick={handleAddTemplate}
                        disabled={!newTemplate.name || !newTemplate.amount}
                        className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-600/20 hover:bg-purple-700 transition-all disabled:opacity-50"
                      >
                        Add Preset
                      </button>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Description (Displays on Invoice)</label>
                      <input
                        type="text"
                        placeholder="Clinical consultation with specialist"
                        value={newTemplate.description}
                        onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-purple-600 transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Templates List */}
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest sticky top-0 bg-white pb-2 block">All Presets ({serviceTemplates.length})</label>
                  {serviceTemplates.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No presets configured yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {serviceTemplates.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-all group">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[11px] font-black text-gray-900 truncate uppercase tracking-tighter">{t.name}</h4>
                            <p className="text-[9px] font-bold text-gray-500 truncate">{t.description}</p>
                            <p className="text-[10px] font-black text-purple-600 mt-1">₦{t.amount.toLocaleString()}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteTemplate(t.id)}
                            className="p-2 text-gray-300 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-rose-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 italic">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center leading-relaxed">Ready-made templates allow staff to quickly generate standard invoices without manual typing.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
