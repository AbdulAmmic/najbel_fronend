"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  FileText,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  X,
  MoreVertical,
  Download,
  Eye,
  Zap,
  Users,
  Activity,
  ShoppingBag
} from "lucide-react";
import { billing, patients } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

export default function InvoiceLedgerPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [newInvoice, setNewInvoice] = useState({
    patient_id: "",
    items: [{ description: "", amount: 0 }],
    category: "consultation"
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invData, patData] = await Promise.all([
        billing.getInvoices(),
        patients.getAll()
      ]);
      setInvoices(invData);
      setAllPatients(patData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInvoice = async () => {
    try {
      const total = newInvoice.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      await billing.createInvoice({
        patient_id: parseInt(newInvoice.patient_id),
        total_amount: total,
        category: newInvoice.category,
        items: newInvoice.items
      });
      setShowCreateModal(false);
      setNewInvoice({ patient_id: "", items: [{ description: "", amount: 0 }], category: "consultation" });
      fetchData();
    } catch (e) {
      alert("Failed to create invoice");
    }
  };

  const addItem = () => setNewInvoice({ ...newInvoice, items: [...newInvoice.items, { description: "", amount: 0 }] });

  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    const search = searchQuery.toLowerCase();
    const matchesSearch = inv.patient_name?.toLowerCase().includes(search) || inv.id.toString().includes(search);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-blue-100/50 shadow-sm">Ledger Systems</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-emerald-100/50">
              <Activity className="w-3 h-3" />
              Live Audit
            </div>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Invoice Repository</h1>
          <p className="text-gray-500 font-medium text-sm">Centralized patient billing records and automated revenue accounting.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group text-sm"
        >
          <Plus className="w-4 h-4" />
          New Invoice Draft
        </button>
      </div>

      {/* Filter Hub */}
      <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="Search Invoice Registry..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/10 placeholder-gray-400 text-sm font-semibold transition-all"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-xl w-full lg:w-auto overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === "all" ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Every Batch
          </button>
          {['pending', 'paid', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === status ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Ledger Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left order-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invoice Unit</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client Name</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valuation</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lifecycle</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50/80">
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse h-16"><td colSpan={6} className="px-6 bg-gray-50/20"></td></tr>
              ))
            ) : filteredInvoices.length > 0 ? (
              filteredInvoices.map(inv => (
                <tr key={inv.id} className="group hover:bg-gray-50/30 transition-all cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-sm tracking-tight group-hover:text-indigo-600 transition-colors">#INV-{inv.id.toString().padStart(4, '0')}</span>
                      <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest mt-1">Logged: {new Date(inv.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center font-black text-[10px] border border-gray-100 shadow-inner group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:rotate-6 transition-all">
                        {inv.patient_name ? inv.patient_name[0] : 'P'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 tracking-tight">{inv.patient_name || 'Anonymous'}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">UID: {inv.patient_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-white border border-gray-100 rounded-lg text-[9px] font-bold text-gray-500 uppercase tracking-widest shadow-sm">
                      {inv.category || 'Consultation'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-gray-900 text-sm tracking-tighter">₦{(inv.total_amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' :
                      inv.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100/50' :
                        'bg-gray-50 text-gray-400 border-gray-100/50'
                      }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-white hover:text-indigo-600 transition-all border border-gray-100/50 shadow-sm">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="p-20 text-center text-gray-300 font-bold uppercase tracking-[0.2em] italic">Null Ledger Hub</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Invoice Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-8 rounded-2xl w-full max-w-xl border border-gray-100 shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <button onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 p-2 rounded-xl hover:bg-gray-100 transition-all text-gray-400 z-20"><X className="w-5 h-5" /></button>

              <div className="mb-8 flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-none">Draft Ledger Item</h2>
                  <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">Financial Commitment Protocol 08-F</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Client Reference</p>
                    <select
                      className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/10 text-sm font-bold cursor-pointer"
                      value={newInvoice.patient_id}
                      onChange={e => setNewInvoice({ ...newInvoice, patient_id: e.target.value })}
                    >
                      <option value="">Select Target Client</option>
                      {allPatients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.unique_id})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Service Designation</p>
                    <select
                      className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/10 text-sm font-bold cursor-pointer"
                      value={newInvoice.category}
                      onChange={e => setNewInvoice({ ...newInvoice, category: e.target.value })}
                    >
                      <option value="consultation">Consultation</option>
                      <option value="lab">Lab Investigations</option>
                      <option value="pharmacy">Drug Fulfilment</option>
                      <option value="ward">In-patient Services</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aggregate Items</p>
                    <button onClick={addItem} className="text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-all">+ Add Line Item</button>
                  </div>
                  <div className="space-y-3">
                    {newInvoice.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-inner">
                        <div className="md:col-span-2 space-y-1">
                          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest ml-1">Item Description</p>
                          <input
                            className="w-full bg-white border border-gray-100 px-3 py-2 rounded-lg text-xs font-semibold"
                            placeholder="e.g. Follow-up consultation"
                            value={item.description}
                            onChange={e => {
                              const newItems = [...newInvoice.items];
                              newItems[index].description = e.target.value;
                              setNewInvoice({ ...newInvoice, items: newItems });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest ml-1">Valuation (NGN)</p>
                          <input
                            type="number"
                            className="w-full bg-white border border-gray-100 px-3 py-2 rounded-lg text-xs font-black tracking-tighter"
                            placeholder="0.00"
                            value={item.amount}
                            onChange={e => {
                              const newItems = [...newInvoice.items];
                              newItems[index].amount = parseFloat(e.target.value);
                              setNewInvoice({ ...newInvoice, items: newItems });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Final Valuation</p>
                  <p className="text-2xl font-black text-gray-900 tracking-tighter">₦{newInvoice.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowCreateModal(false)} className="px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all">Cancel</button>
                  <button onClick={handleCreateInvoice} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-800 shadow-xl active:scale-95 transition-all flex items-center gap-2 group">
                    Commit Ledger <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
