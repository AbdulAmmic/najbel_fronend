"use client";

import { useState, useEffect } from "react";
import {
    ShoppingBag,
    Search,
    Filter,
    Clock,
    Truck,
    CheckCircle2,
    Package,
    MapPin,
    Phone,
    ChevronRight,
    MoreVertical,
    X,
    Wallet,
    AlertCircle,
    Activity,
    Zap
} from "lucide-react";
import { pharmacy } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { useWebSocket } from "@/contexts/WebSocketContext";

export default function PharmacyOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const { lastMessage } = useWebSocket();

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await pharmacy.getAllOrders();
            setOrders(data);
        } catch (e) {
            console.error("Failed to fetch pharmacy orders", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        if (lastMessage && lastMessage.includes('pharmacy_update')) {
            fetchOrders();
        }
    }, [lastMessage]);

    const handleUpdateStatus = async (orderId: number, newStatus: string) => {
        try {
            await pharmacy.updateOrderStatus(orderId, newStatus);
            fetchOrders();
            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (e) {
            console.error("Failed to update order status", e);
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        const search = searchQuery.toLowerCase();
        const matchesSearch = o.patient_name.toLowerCase().includes(search) ||
            o.id.toString().includes(search) ||
            o.delivery_address.toLowerCase().includes(search);
        return matchesStatus && matchesSearch;
    });

    const statusOptions = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'];

    return (
        <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6 bg-white min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-amber-100/50 shadow-sm">Pharmacy Logistics</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-blue-100/50">
                            <Activity className="w-3 h-3" />
                            Live Fulfillment
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none text-highlight">Drug Dispatch Hub</h1>
                    <p className="text-gray-500 font-medium text-sm">Managing patient prescriptions, <span className="text-gray-900 font-bold">home deliveries</span>, and stock flow.</p>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="px-4 py-1 text-center border-r border-gray-200">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Incoming</p>
                        <p className="text-lg font-black text-gray-900 leading-none">{orders.filter(o => o.status === 'pending').length}</p>
                    </div>
                    <div className="px-4 py-1 text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">In Transit</p>
                        <p className="text-lg font-black text-blue-600 leading-none">{orders.filter(o => o.status === 'dispatched').length}</p>
                    </div>
                </div>
            </div>

            {/* Filter Hub */}
            <div className="flex flex-col lg:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-hover:text-amber-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search Prescription ID or Client Unit..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500/10 placeholder-gray-400 text-sm font-semibold transition-all"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-xl w-full lg:w-auto overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setStatusFilter("all")}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === "all" ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Every Batch
                    </button>
                    {statusOptions.map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === status ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left order-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prescription Ref</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recipient Unit</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location Matrix</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valuation</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lifecycle</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50/80">
                        {loading ? (
                            Array(6).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse h-16"><td colSpan={6} className="px-6 bg-gray-50/20"></td></tr>
                            ))
                        ) : filteredOrders.length > 0 ? (
                            filteredOrders.map(order => (
                                <tr key={order.id} className="group hover:bg-gray-50/30 transition-all cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors text-sm tracking-tight">#RX-{order.id.toString().padStart(5, '0')}</span>
                                            <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest mt-1">Logged: {new Date(order.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center font-black text-xs border border-gray-100 shadow-inner group-hover:bg-amber-50 group-hover:text-amber-600 transition-all">
                                                {order.patient_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 tracking-tight">{order.patient_name}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">UID: {order.patient_id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold group-hover:text-gray-900 transition-colors max-w-[200px] truncate">
                                            <MapPin className="w-3.5 h-3.5 text-amber-500/40" />
                                            {order.delivery_address}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-black text-gray-900 tracking-tighter">₦{(order.total_amount || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' :
                                                order.status === 'dispatched' ? 'bg-blue-50 text-blue-600 border-blue-100/50' :
                                                    order.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100/50' :
                                                        'bg-gray-50 text-gray-400 border-gray-100/50'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 rounded-xl bg-white text-gray-400 hover:text-amber-600 transition-all border border-gray-100 shadow-sm group-hover:border-amber-100">
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={6} className="p-20 text-center text-gray-300 font-bold uppercase tracking-[0.2em] italic">Null Fulfillment Queue</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Immersive Fulfillment Drawer */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl w-full max-w-xl shadow-2xl p-8 lg:p-10 relative overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
                        >
                            <button onClick={() => setSelectedOrder(null)} className="absolute top-8 right-8 p-3 rounded-xl hover:bg-gray-100 transition-all text-gray-400 group active:scale-95 z-20"><X className="w-5 h-5 group-hover:text-gray-900" /></button>

                            <div className="mb-10 flex items-center gap-5">
                                <div className="p-4 bg-amber-500 rounded-xl text-white shadow-lg">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-none">Fulfillment Protocol</h2>
                                    <p className="text-gray-400 font-bold mt-1.5 uppercase text-[9px] tracking-widest flex items-center gap-1.5 text-highlight">
                                        Active Batch <ChevronRight className="w-3 h-3" /> RX-{selectedOrder.id}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-8 pr-2 scrollbar-hide py-2">
                                {/* Prescribed Units */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Prescribed Meds & Analytics</p>
                                    <div className="bg-gray-50/50 rounded-xl p-6 space-y-4 border border-gray-100 shadow-inner">
                                        {selectedOrder.items.map((item: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center font-black text-[9px] text-amber-600 shadow-sm">{item.quantity}×</div>
                                                    <span className="text-xs font-bold text-gray-900 tracking-tight">{item.name}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 group-hover:text-amber-600 transition-colors tracking-tighter">NGN {(item.unit_price || 0).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="pt-5 border-t border-gray-200/50 flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Valuation</span>
                                            <span className="text-xl font-black text-gray-900 tracking-tighter">₦{(selectedOrder.total_amount || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Logistics Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-5 bg-blue-50/50 rounded-xl space-y-3 border border-blue-100/50 shadow-sm">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                        <div className="space-y-0.5">
                                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Coordinate Link</p>
                                            <p className="text-[11px] font-bold text-blue-900 leading-relaxed">{selectedOrder.delivery_address}</p>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-indigo-50/50 rounded-xl space-y-3 border border-indigo-100/50 shadow-sm">
                                        <Phone className="w-5 h-5 text-indigo-600" />
                                        <div className="space-y-0.5">
                                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Comm Link</p>
                                            <p className="text-[11px] font-black text-indigo-900 tracking-widest">{selectedOrder.delivery_phone}</p>
                                        </div>
                                    </div>
                                </div>

                                {selectedOrder.delivery_note && (
                                    <div className="p-5 bg-amber-50/30 rounded-xl flex items-start gap-4 border border-amber-100/20">
                                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-[11px] font-bold text-amber-900 italic leading-relaxed">"{selectedOrder.delivery_note}"</p>
                                    </div>
                                )}

                                {/* Lifecycle Management */}
                                <div className="space-y-4 pt-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Lifecycle Action Override</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {statusOptions.map(s => (
                                            <button
                                                key={s}
                                                disabled={selectedOrder.status === s}
                                                onClick={() => handleUpdateStatus(selectedOrder.id, s)}
                                                className={`py-4 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-2 active:scale-95 group shadow-sm ${selectedOrder.status === s
                                                    ? 'bg-amber-100 text-amber-700 opacity-50 border-amber-200 cursor-not-allowed'
                                                    : 'bg-white border border-gray-100 text-gray-900 hover:shadow-lg hover:border-amber-500'
                                                    }`}
                                            >
                                                <div className={`p-2 rounded-lg group-hover:scale-110 transition-transform ${selectedOrder.status === s ? 'bg-amber-200/50' : 'bg-gray-50'}`}>
                                                    {s === 'dispatched' ? <Truck className="w-3.5 h-3.5" /> :
                                                        s === 'delivered' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                                                            s === 'pending' ? <Clock className="w-3.5 h-3.5" /> :
                                                                s === 'confirmed' ? <Zap className="w-3.5 h-3.5" /> :
                                                                    <Package className="w-3.5 h-3.5" />}
                                                </div>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="px-10 py-3 bg-gray-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-black active:scale-95 transition-all"
                                >
                                    Fulfillment Complete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
