"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  CreditCard, Upload, FlaskConical, Pill, AlertCircle, CheckCircle2, 
  Loader2, Video, ChevronRight, RefreshCw, Wallet
} from "lucide-react";

interface PendingInvoice {
  invoice_id: number;
  invoice_number: string;
  amount: number;
  invoice_type: string;
  consultation_id?: number;
  due_date: string;
}

interface PendingUpload {
  lab_result_id: number;
  test_name: string;
  consultation_id?: number;
}

interface ConsultationStatus {
  active_chat_id: number | null;
  reason: string;
  invoice_id?: number;
  amount?: number;
  meet_link?: string;
  last_consultation_id?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://najbelbackend-ammicsystems4174-umj4fvky.leapcell.dev/api/v1";

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }
function authH() { return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }; }

function formatNGN(amount: number) {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

function getInvoiceTypeIcon(type: string) {
  switch (type) {
    case "consultation_fee": return <CreditCard className="w-4 h-4 text-blue-500" />;
    case "lab_test": return <FlaskConical className="w-4 h-4 text-purple-500" />;
    case "medication": return <Pill className="w-4 h-4 text-green-500" />;
    default: return <CreditCard className="w-4 h-4 text-gray-500" />;
  }
}

function getInvoiceTypeLabel(type: string) {
  switch (type) {
    case "consultation_fee": return "Consultation Fee";
    case "lab_test": return "Lab Test";
    case "medication": return "Medication";
    default: return "Payment";
  }
}

export default function ConsultationActions() {
  const router = useRouter();
  const [status, setStatus] = useState<ConsultationStatus | null>(null);
  const [payments, setPayments] = useState<PendingInvoice[]>([]);
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<number, string>>({});
  const [walletPin, setWalletPin] = useState("");
  const [pinModalInvoice, setPinModalInvoice] = useState<PendingInvoice | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [chatRes, actionsRes, walletRes] = await Promise.all([
        fetch(`${API_BASE}/consultations/active-chat`, { headers: authH() }),
        fetch(`${API_BASE}/consultations/pending-actions`, { headers: authH() }),
        fetch(`${API_BASE}/billing/wallet`, { headers: authH() }),
      ]);
      if (chatRes.ok) setStatus(await chatRes.json());
      if (actionsRes.ok) {
        const data = await actionsRes.json();
        setPayments(data.payments || []);
        setUploads(data.uploads || []);
      }
      if (walletRes.ok) {
        const w = await walletRes.json();
        setWalletBalance(w.balance);
      }
    } catch (e) {
      console.error("Failed to load consultation actions", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const payInvoice = async (invoice: PendingInvoice) => {
    if (!walletPin) {
      setPinModalInvoice(invoice);
      return;
    }
    setPayingId(invoice.invoice_id);
    try {
      const res = await fetch(
        `${API_BASE}/billing/invoices/${invoice.invoice_id}/pay?payment_method=wallet&wallet_pin=${walletPin}`,
        { method: "PUT", headers: authH() }
      );
      const data = await res.json();
      if (res.ok) {
        setFeedbacks(p => ({ ...p, [invoice.invoice_id]: "✓ Payment successful!" }));
        setPinModalInvoice(null);
        setWalletPin("");
        await load(); // Refresh everything
      } else {
        setFeedbacks(p => ({ ...p, [invoice.invoice_id]: data.detail || "Payment failed" }));
      }
    } catch {
      setFeedbacks(p => ({ ...p, [invoice.invoice_id]: "Network error" }));
    } finally {
      setPayingId(null);
    }
  };

  const handleFileUpload = async (labResultId: number, file: File) => {
    setUploadingId(labResultId);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/labs/${labResultId}/upload-result`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbacks(p => ({ ...p, [labResultId]: "✓ Result uploaded successfully!" }));
        await load();
      } else {
        setFeedbacks(p => ({ ...p, [labResultId]: data.detail || "Upload failed" }));
      }
    } catch {
      setFeedbacks(p => ({ ...p, [labResultId]: "Upload error" }));
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  const hasActions = payments.length > 0 || uploads.length > 0;

  return (
    <div className="space-y-4">
      {/* Wallet Balance */}
      {walletBalance !== null && (
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl border border-violet-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Wallet Balance</p>
              <p className="text-base font-bold text-violet-700">{formatNGN(walletBalance)}</p>
            </div>
          </div>
          <button onClick={load} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-100 rounded-xl transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Consultation Banner */}
      {status?.reason === "active" && (
        <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-sm">Consultation is Active! 🎉</h3>
              <p className="text-green-100 text-xs mt-0.5">Your doctor is ready — join the session now</p>
            </div>
            <button
              onClick={() => router.push(`/dashboard/meeting/${status.active_chat_id}`)}
              className="flex items-center gap-1.5 bg-white text-green-700 font-bold text-xs px-4 py-2 rounded-xl shadow hover:shadow-md transition-all"
            >
              <Video className="w-4 h-4" />
              Join Meeting
            </button>
          </div>
        </div>
      )}

      {/* Payment Required Banner */}
      {status?.reason === "payment_required" && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-amber-800 font-bold text-sm">Payment Required</h3>
              <p className="text-amber-600 text-xs mt-0.5">
                Pay the consultation fee to unlock chat and Google Meet access.
              </p>
              {status.amount && (
                <p className="text-amber-800 font-bold text-lg mt-1">{formatNGN(status.amount)}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pending Payments */}
      {payments.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> Pending Payments ({payments.length})
          </h3>
          <div className="space-y-2">
            {payments.map(inv => (
              <div key={inv.invoice_id} className="p-4 bg-white rounded-2xl border-2 border-amber-200 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      {getInvoiceTypeIcon(inv.invoice_type)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{getInvoiceTypeLabel(inv.invoice_type)}</p>
                      <p className="text-xs text-gray-500">{inv.invoice_number}</p>
                      <p className="text-base font-bold text-gray-900 mt-1">{formatNGN(inv.amount)}</p>
                      {feedbacks[inv.invoice_id] && (
                        <p className={`text-xs mt-1 font-medium ${feedbacks[inv.invoice_id].startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
                          {feedbacks[inv.invoice_id]}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setPinModalInvoice(inv)}
                    disabled={payingId === inv.invoice_id}
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                  >
                    {payingId === inv.invoice_id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CreditCard className="w-3.5 h-3.5" />
                    )}
                    Pay Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Uploads */}
      {uploads.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Upload Required ({uploads.length})
          </h3>
          <div className="space-y-2">
            {uploads.map(up => (
              <div key={up.lab_result_id} className="p-4 bg-white rounded-2xl border-2 border-blue-200 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <FlaskConical className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{up.test_name}</p>
                      <p className="text-xs text-blue-600 font-medium">Upload your result (PDF/image)</p>
                      {feedbacks[up.lab_result_id] && (
                        <p className={`text-xs mt-1 font-medium ${feedbacks[up.lab_result_id].startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
                          {feedbacks[up.lab_result_id]}
                        </p>
                      )}
                    </div>
                  </div>
                  <label className={`flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${uploadingId === up.lab_result_id ? "opacity-50" : ""}`}>
                    {uploadingId === up.lab_result_id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Upload
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      disabled={uploadingId === up.lab_result_id}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(up.lab_result_id, file);
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Clear */}
      {!loading && !hasActions && status?.reason !== "active" && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-gray-600 font-semibold text-sm">No pending actions</p>
          <p className="text-gray-400 text-xs mt-1">You&apos;re all caught up!</p>
        </div>
      )}

      {/* Wallet PIN Modal */}
      {pinModalInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Confirm Payment</h3>
                <p className="text-sm text-gray-500">{getInvoiceTypeLabel(pinModalInvoice.invoice_type)}</p>
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900 text-center py-3">{formatNGN(pinModalInvoice.amount)}</p>
            {walletBalance !== null && (
              <p className="text-xs text-center text-gray-500 mb-3">
                Wallet balance after: <span className={walletBalance - pinModalInvoice.amount < 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                  {formatNGN(walletBalance - pinModalInvoice.amount)}
                </span>
              </p>
            )}
            {walletBalance !== null && walletBalance < pinModalInvoice.amount && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 text-xs text-red-700 font-medium text-center">
                ⚠️ Insufficient wallet balance. Please top up first.
              </div>
            )}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 block mb-1">Wallet PIN</label>
              <input
                type="password"
                value={walletPin}
                onChange={e => setWalletPin(e.target.value)}
                placeholder="Enter your wallet PIN"
                maxLength={6}
                className="w-full text-center text-xl font-bold tracking-widest px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setPinModalInvoice(null); setWalletPin(""); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => payInvoice(pinModalInvoice)}
                disabled={!walletPin || (walletBalance !== null && walletBalance < pinModalInvoice.amount) || payingId !== null}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {payingId !== null ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Pay {formatNGN(pinModalInvoice.amount)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
