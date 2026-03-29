"use client";

import { useState, useEffect } from "react";
import {
    Package,
    AlertTriangle,
    Search,
    Plus,
    Filter,
    Edit,
    Trash2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Pill,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronRight,
    ClipboardList
} from "lucide-react";
import { pharmacy } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

export default function PharmacyPage() {
    const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions'>('inventory');
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [selectedRx, setSelectedRx] = useState<any | null>(null);
    const [isRxModalOpen, setIsRxModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        category: "General",
        batch_number: "",
        expiry_date: "",
        quantity: 0,
        unit_price: 0,
        reorder_level: 10,
        location: "",
        supplier: "",
        description: ""
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invData, rxData] = await Promise.all([
                pharmacy.getInventory(),
                pharmacy.getQueue()
            ]);
            setInventory(invData);
            setPrescriptions(rxData);
        } catch (error) {
            console.error("Failed to load pharmacy data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setFormData({
            name: "",
            category: "General",
            batch_number: "",
            expiry_date: "",
            quantity: 0,
            unit_price: 0,
            reorder_level: 10,
            location: "",
            supplier: "",
            description: ""
        });
        setEditingItem(null);
    };

    const handleSave = async () => {
        try {
            if (editingItem) {
                await pharmacy.updateItem(editingItem.id, formData);
            } else {
                await pharmacy.addItem(formData);
            }
            fetchData();
            setIsAddModalOpen(false);
            resetForm();
        } catch (error) {
            console.error("Failed to save item", error);
            alert("Failed to save item");
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this item?")) {
            try {
                await pharmacy.deleteItem(id);
                fetchData();
            } catch (error) {
                console.error("Failed to delete item", error);
            }
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date,
            quantity: item.quantity,
            unit_price: item.unit_price,
            reorder_level: item.reorder_level,
            location: item.location || "",
            supplier: item.supplier || "",
            description: item.description || ""
        });
        setIsAddModalOpen(true);
    };

    const handleUpdateItemStatus = async (itemId: number, status: string) => {
        setProcessing(true);
        try {
            await pharmacy.updateItemStatus(itemId, status);
            // Refresh data
            const rxData = await pharmacy.getQueue();
            setPrescriptions(rxData);
            // Also update selectedRx if open
            if (selectedRx) {
                const updated = rxData.find((r: any) => r.id === selectedRx.id);
                if (updated) setSelectedRx(updated);
            }
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setProcessing(false);
        }
    };

    // Derived State
    const lowStockItems = inventory.filter(i => i.quantity <= i.reorder_level);
    const expiredItems = inventory.filter(i => new Date(i.expiry_date) < new Date());

    const filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batch_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-12 text-center text-gray-500">Loading Pharmacy System...</div>;

    return (
        <div className="p-6 max-w-[1800px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Pharmacy Management</h1>
                    <p className="text-gray-500 mt-2">Track inventory, manage prescriptions, and monitor stock levels</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Add Medicine
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Products</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{inventory.length}</p>
                    </div>
                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Low Stock Alerts</p>
                        <p className="text-2xl font-bold text-amber-600 mt-1">{lowStockItems.length}</p>
                    </div>
                    <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Expired Items</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">{expiredItems.length}</p>
                    </div>
                    <div className="h-10 w-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Pending RX Queue</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{prescriptions.length}</p>
                        <span className="text-xs text-emerald-600">Dispensing Queue</span>
                    </div>
                    <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                        <ClipboardList className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex gap-2 bg-gray-100/50 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'inventory' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Inventory
                        </button>
                        <button
                            onClick={() => setActiveTab('prescriptions')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'prescriptions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Prescriptions
                        </button>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, batch number..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Inventory Table */}
                {activeTab === 'inventory' && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Drug Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch Info</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredInventory.map((item) => {
                                    const isLowStock = item.quantity <= item.reorder_level;
                                    const isExpired = new Date(item.expiry_date) < new Date();

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{item.name}</div>
                                                <div className="text-xs text-gray-500">{item.description}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-mono text-gray-700">{item.batch_number}</div>
                                                <div className={`text-xs ${isExpired ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                                    Exp: {new Date(item.expiry_date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{item.quantity}</div>
                                                <div className="text-xs text-gray-500">Threshold: {item.reorder_level}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                ₦{item.unit_price.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isExpired ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        Expired
                                                    </span>
                                                ) : isLowStock ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                        Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                        In Stock
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredInventory.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            No items found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Prescriptions Tab */}
                {activeTab === 'prescriptions' && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">RX ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {prescriptions.map((rx) => (
                                    <tr key={rx.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-black text-blue-600">#{rx.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900">Patient #{rx.patient_id}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Najbel Clinic</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                                                {rx.items?.length || 0} Meds
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {new Date(rx.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                rx.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                                rx.status === 'dispensing' ? 'bg-blue-100 text-blue-800' :
                                                'bg-amber-100 text-amber-800'
                                            }`}>
                                                {rx.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => { setSelectedRx(rx); setIsRxModalOpen(true); }}
                                                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
                                            >
                                                Process
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {prescriptions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-bold">
                                            <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                            No prescriptions in queue.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Prescription Processing Modal */}
            <AnimatePresence>
                {isRxModalOpen && selectedRx && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl">
                                        <Pill className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black">Process Prescription</h2>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Ref: RX-{selectedRx.id} · Patient #{selectedRx.patient_id}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsRxModalOpen(false)} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                                    <span className="text-2xl">&times;</span>
                                </button>
                            </div>

                            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Medication Handover</h3>
                                    </div>
                                    
                                    <div className="divide-y divide-slate-50 border border-slate-100 rounded-[32px] overflow-hidden">
                                        {selectedRx.items?.map((item: any) => (
                                            <div key={item.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-slate-900 text-sm">{item.drug_name}</p>
                                                        {item.is_internal ? (
                                                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg uppercase">Internal</span>
                                                        ) : (
                                                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-lg uppercase">External</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">{item.dosage} · {item.frequency} · {item.duration} · Qty: {item.quantity}</p>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    {item.status === 'pending' ? (
                                                        <div className="flex gap-2">
                                                            <button 
                                                                disabled={processing}
                                                                onClick={() => handleUpdateItemStatus(item.id, 'dispensed')}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5" /> Dispense
                                                            </button>
                                                            <button 
                                                                disabled={processing}
                                                                onClick={() => handleUpdateItemStatus(item.id, 'out_of_stock')}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50"
                                                            >
                                                                <AlertCircle className="w-3.5 h-3.5" /> Stock-out
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                            item.status === 'dispensed' ? 'bg-emerald-50 text-emerald-600' :
                                                            item.status === 'out_of_stock' ? 'bg-amber-50 text-amber-600' :
                                                            'bg-red-50 text-red-600'
                                                        }`}>
                                                            {item.status === 'dispensed' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                            {item.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedRx.instructions && (
                                    <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 italic">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Doctor's Notes</p>
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">"{selectedRx.instructions}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-end">
                                <button 
                                    onClick={() => setIsRxModalOpen(false)}
                                    className="px-10 py-4 bg-slate-900 text-white rounded-3xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 active:scale-95 transition-all"
                                >
                                    Dismiss Queue
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
                        >
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">{editingItem ? 'Edit Medication' : 'Add New Inventory'}</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Pharmacy Stock Management</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
                                    <span className="text-2xl">&times;</span>
                                </button>
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Drug Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="e.g. Paracetamol 500mg"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Category</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="General">General</option>
                                        <option value="Antibiotic">Antibiotic</option>
                                        <option value="Analgesic">Analgesic</option>
                                        <option value="Antiseptic">Antiseptic</option>
                                        <option value="Vitamin">Vitamin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Batch Number</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="BATCH-001"
                                        value={formData.batch_number}
                                        onChange={e => setFormData({ ...formData, batch_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Expiry Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.expiry_date}
                                        onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Quantity</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Unit Price (₦)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.unit_price}
                                        onChange={e => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Low Stock Threshold</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.reorder_level}
                                        onChange={e => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Description</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-8 py-4 bg-white text-slate-500 rounded-3xl text-xs font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-10 py-4 bg-blue-600 text-white rounded-3xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                                >
                                    {editingItem ? 'Update Item' : 'Add to Stock'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
