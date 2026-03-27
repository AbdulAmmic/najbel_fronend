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
    Pill
} from "lucide-react";
import { pharmacy } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

export default function PharmacyPage() {
    const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions'>('inventory');
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

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

    const fetchInventory = async () => {
        try {
            const data = await pharmacy.getInventory();
            setInventory(data);
        } catch (error) {
            console.error("Failed to load inventory", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
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
            fetchInventory();
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
                fetchInventory();
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
                        <p className="text-sm font-medium text-gray-500">Prescriptions</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">12</p>
                        <span className="text-xs text-emerald-600">+2 today</span>
                    </div>
                    <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                        <Pill className="w-5 h-5" />
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
                                                ${item.unit_price.toFixed(2)}
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
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-gray-900">{editingItem ? 'Edit Medicine' : 'Add New Medicine'}</h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <span className="text-2xl">&times;</span>
                                </button>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Drug Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        placeholder="e.g. Paracetamol 500mg"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        placeholder="BATCH-001"
                                        value={formData.batch_number}
                                        onChange={e => setFormData({ ...formData, batch_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={formData.expiry_date}
                                        onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price ($)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={formData.unit_price}
                                        onChange={e => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        value={formData.reorder_level}
                                        onChange={e => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                                    <textarea
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-24 resize-none"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-medium transition-colors shadow-sm shadow-blue-200"
                                >
                                    {editingItem ? 'Update Medicine' : 'Save Medicine'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
