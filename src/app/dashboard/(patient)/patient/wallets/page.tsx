"use client";

import { useState, useEffect } from "react";
import { ArrowDownLeft, ArrowUpRight, Copy, Receipt, Building2, History, ChevronRight, Wallet, X, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { billing, auth, appointments, vitals, labs, prescriptions, users } from "@/services/api";
import api from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

interface FeedItem {
  id: number | string;
  type: 'invoice' | 'transaction';
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed' | 'paid';
}

export default function WalletPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [patient, setPatient] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // PIN Authorization State
  const [showPinModal, setShowPinModal] = useState(false);
  const [walletPin, setWalletPin] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletRes, invoicesRes, historyRes, userRes] = await Promise.all([
        billing.getWallet().catch(() => null),
        billing.getInvoices().catch(() => []),
        api.get("billing/transactions").catch(() => ({ data: [] })),
        auth.getMe().catch(() => null)
      ]);
      setWallet(walletRes);
      setPatient(userRes);
      const unified: FeedItem[] = [
        ...(invoicesRes || []).filter((i: any) => i.status !== 'paid').map((inv: any) => ({
          id: `inv-${inv.id}`, type: 'invoice' as const, title: 'Medical Invoice',
          subtitle: inv.invoice_number, amount: inv.amount, date: inv.created_at, status: 'pending' as const
        })),
        ...(historyRes.data || []).map((txn: any) => ({
          id: `txn-${txn.id}`, type: 'transaction' as const,
          title: txn.type === 'topup' ? 'Wallet Funding' : 'Payment',
          subtitle: txn.reference, amount: txn.amount, date: txn.created_at, status: 'completed' as const
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setFeed(unified);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPinModal = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setWalletPin("");
    setShowPinModal(true);
  };

  const handlePayWithPin = async () => {
    if (!selectedInvoiceId || walletPin.length < 4) return;
    try {
      setIsSubmitting(true);
      const cleanId = parseInt(selectedInvoiceId.replace('inv-', ''));
      await billing.payInvoice(cleanId, 'wallet', walletPin);
      fetchData();
      setShowPinModal(false);
      alert("Invoice paid successfully!");
    } catch (err: any) {
      console.error("Payment Error:", err);
      const msg = err.response?.data?.detail || err.message || "An unexpected error occurred";
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto pb-8 -mx-1">
      {/* Header */}
      <div className="px-1 pt-1 mb-4">
        <h1 className="text-xl font-bold text-gray-900">Wallet</h1>
        <p className="text-[11px] text-gray-400 mt-0.5">Manage finances</p>
      </div>

      {/* Balance Card */}
      <div className="mx-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white mb-4">
        <p className="text-[11px] text-blue-200 font-medium">Total Balance</p>
        <p className="text-3xl font-bold mt-0.5 mb-3">₦{wallet?.balance?.toLocaleString() || "0"}</p>

        {/* Virtual Bank */}
        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-blue-200" />
              <span className="text-[10px] text-blue-200 font-medium">Najbel Virtual Bank</span>
            </div>
            <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded text-white font-semibold">ACTIVE</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-blue-300 mb-0.5">Account Number</p>
              <p className="text-sm font-mono font-bold tracking-wider">
                {patient?.patient_profile?.unique_id?.replace(/\D/g, '') || "0123456789"}
              </p>
            </div>
            <button
              onClick={() => handleCopy(patient?.patient_profile?.unique_id?.replace(/\D/g, '') || "0123456789")}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition ${copied ? 'bg-emerald-400' : 'bg-white/20 hover:bg-white/30'}`}
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-[10px] text-blue-300">Account Name</p>
            <p className="text-[11px] font-semibold">{patient?.full_name || "Patient"} / NAJBEL</p>
          </div>
        </div>
        <p className="text-[10px] text-blue-200 text-center mt-2">Transfer to the account above to fund wallet</p>
      </div>

      {/* Activity Feed */}
      <div className="mx-1">
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h3 className="text-[13px] font-bold text-gray-900">Activity</h3>
          <button className="text-[11px] text-blue-500 font-semibold flex items-center gap-0.5">Filter <ChevronRight className="w-3 h-3" /></button>
        </div>
        <div className="space-y-1.5">
          {feed.map(item => (
            <div key={item.id} className="bg-white rounded-xl p-3 border border-gray-100/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.status === 'pending' ? 'bg-orange-50 text-orange-500' : item.title === 'Wallet Funding' ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-400'}`}>
                  {item.status === 'pending' ? <Receipt className="w-4 h-4" /> : item.title === 'Wallet Funding' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">{item.title}</p>
                  <p className="text-[10px] text-gray-400">{item.status === 'pending' ? 'Action Required' : item.subtitle}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-[13px] font-bold ${item.title === 'Wallet Funding' ? 'text-emerald-500' : 'text-gray-900'}`}>
                  {item.title === 'Wallet Funding' ? '+' : '-'}₦{item.amount.toLocaleString()}
                </p>
                {item.status === 'pending' ? (
                  <button onClick={() => handleOpenPinModal(item.id as string)} className="mt-0.5 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 transition-colors text-white text-[9px] font-bold rounded">Pay</button>
                ) : (
                  <p className="text-[9px] text-gray-300 mt-0.5">{new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                )}
              </div>
            </div>
          ))}
          {feed.length === 0 && (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
              <History className="w-6 h-6 text-gray-200 mx-auto mb-2" />
              <p className="text-[11px] text-gray-400">No activity yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Wallet PIN Authorization Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[120] flex items-end sm:items-center justify-center p-4" onClick={() => setShowPinModal(false)}>
          <div
            className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPinModal(false)}
              className="absolute top-6 right-6 p-2 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6 mt-4">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100/50 shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">Confirm Payment</h2>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Authorize wallet deduction</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-center border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Enter 4-Digit PIN</p>
              <div className="flex justify-center">
                <input
                  type="text"
                  maxLength={4}
                  autoFocus
                  value={walletPin}
                  onChange={(e) => setWalletPin(e.target.value)}
                  placeholder="PIN"
                  className="w-[180px] text-center text-3xl font-black bg-white border-2 border-gray-200 rounded-xl py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900 shadow-sm"
                />
              </div>
            </div>

            <button
              disabled={walletPin.length < 4 || isSubmitting}
              onClick={handlePayWithPin}
              className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold tracking-wide shadow-lg shadow-gray-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Authorize Transaction</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}