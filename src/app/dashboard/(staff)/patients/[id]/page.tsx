"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Wallet,
  LogOut,
  MessageSquare,
  CreditCard,
  DollarSign,
  ChevronRight,
  CheckCircle2,
  X,
  ArrowRight
} from "lucide-react";
import { billing, patients as patientsApi } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Funding modal state
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [banks, setBanks] = useState<any[]>([]);
  const [fundingLoading, setFundingLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Mock basic patient data for UI placeholders if API is empty
  const patient = {
    name: "Loading Patient...",
    age: 42,
    gender: "Male",
    phone: "+234 801 234 5678",
    email: "patient@email.com",
    lastVisit: "2024-03-15",
    nextAppointment: "2024-04-10",
    admissionStatus: "Discharged"
  };

  const handleDischarge = () => {
    if (confirm("Are you sure you want to discharge this patient?")) {
      alert("Patient discharged successfully.");
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pData, bData] = await Promise.all([
        patientsApi.getById(parseInt(id)),
        billing.getBanks().catch(() => [])
      ]);
      setPatientData(pData);
      setBanks(bData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleFundWallet = async () => {
    if (!fundAmount) return;
    try {
      setFundingLoading(true);
      await billing.fundWallet(
        parseInt(id),
        parseFloat(fundAmount),
        paymentMethod,
        paymentMethod === 'transfer' ? (selectedBankId ?? undefined) : undefined
      );
      setFeedback({ type: 'success', message: `Wallet pre-funded with ₦${parseFloat(fundAmount).toLocaleString()}` });
      setShowFundModal(false);
      setFundAmount("");
      setSelectedBankId(null);
      fetchData();
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.response?.data?.detail || "Authorization Failure or System Timeout" });
    } finally {
      setFundingLoading(false);
    }
  };

  const displayName = patientData?.full_name || patient.name;
  const displayInitials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Administrative Record</h1>
            <p className="text-gray-600">Overview and billing for {displayName}</p>
          </div>
        </div>

        {/* Patient Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`h-16 w-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold uppercase`}>
                {loading ? "..." : displayInitials}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{loading ? "Loading profile..." : displayName}</h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-1">
                  {patientData && (
                    <>
                      <span>{patientData.phone_number || "No Phone"}</span>
                      <span>•</span>
                      <span>{patientData.email || "No Email"}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {patient.admissionStatus === "Admitted" && (
                <button
                  onClick={handleDischarge}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2 font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  Discharge
                </button>
              )}
              <button
                onClick={() => setShowFundModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium shadow-md shadow-emerald-500/10"
              >
                <Wallet className="h-4 w-4" />
                Fund Wallet
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Administrative Only */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Administrative Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" /> Administrative Summary
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Account Status</p>
                <p className="font-medium text-emerald-600">Active</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Last Visit</p>
                <p className="font-medium">{patient.lastVisit}</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50/50 rounded-lg flex justify-between items-center border border-blue-100">
              <div>
                <p className="text-xs font-medium text-blue-500 mb-1">Next Appointment</p>
                <p className="font-medium text-blue-700">{patient.nextAppointment}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Actions Placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-600" /> Financial Overview
          </h3>
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
            <div className="p-3 bg-white rounded-full shadow-sm mb-4">
              <Wallet className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Billing Details Area</h4>
            <p className="text-sm text-gray-500 max-w-sm">
              Patient invoice and transaction history can be attached here in the future.
            </p>
          </div>
        </div>

      </div>

      {/* Wallet Funding Modal */}
      <AnimatePresence>
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
                <ArrowLeft className="w-5 h-5 group-hover:text-gray-900" />
              </button>

              <div className="mb-10 text-center">
                <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 mb-6 inline-block border border-emerald-100 shadow-sm mx-auto">
                  <Wallet className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">Financial Provision</h2>
                <p className="text-gray-400 font-bold text-[10px] tracking-widest uppercase mt-2">Target <ChevronRight className="inline w-3 h-3 mx-1" /> {displayName}</p>
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
      </AnimatePresence>

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
    </div>
  );
}