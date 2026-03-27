"use client";

import React, { useState, useEffect } from 'react';
import { pharmacy } from '@/services/api';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Pill,
    Search,
    Plus,
    AlertTriangle,
    Package,
    Calendar,
    Edit2,
    Trash2,
    X,
    Filter,
    ArrowDown,
    ArrowUp
} from 'lucide-react';

interface InventoryItem {
    id: number;
    name: string;
    description: string;
    quantity: number;
    unit: string;
    reorder_level: number;
    batch_number: string;
    expiry_date: string;
    manufacturer: string;
    price: number;
}

export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { lastMessage } = useWebSocket();

    // Modal State
    const [isAppModalOpen, setAppModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        quantity: 0,
        unit: 'tablets',
        reorder_level: 10,
        batch_number: '',
        expiry_date: '',
        manufacturer: '',
        price: 0
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

    // Real-time updates
    useEffect(() => {
        if (lastMessage && lastMessage.includes('pharmacy')) {
            fetchInventory();
        }
    }, [lastMessage]);

    const handleOpenModal = (item?: InventoryItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                description: item.description || '',
                quantity: item.quantity,
                unit: item.unit,
                reorder_level: item.reorder_level,
                batch_number: item.batch_number,
                expiry_date: item.expiry_date ? new Date(item.expiry_date).toISOString().split('T')[0] : '',
                manufacturer: item.manufacturer || '',
                price: item.price
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                description: '',
                quantity: 0,
                unit: 'tablets',
                reorder_level: 10,
                batch_number: '',
                expiry_date: '',
                manufacturer: '',
                price: 0
            });
        }
        setAppModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                expiry_date: formData.expiry_date ? new Date(formData.expiry_date).toISOString() : null
            };

            if (editingItem) {
                await pharmacy.updateItem(editingItem.id, payload);
            } else {
                await pharmacy.addItem(payload);
            }
            setAppModalOpen(false);
            fetchInventory();
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

    // Derived Stats
    const lowStockCount = inventory.filter(i => i.quantity <= i.reorder_level).length;
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

    const filteredItems = inventory.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Pill className="w-7 h-7 text-blue-600" />
                        Pharmacy Inventory
                    </h1>
                    <p className="text-gray-500 mt-1">Manage medicine stock, reorders, and expiration tracking</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add New Item
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-blue-50 to-transparent" />
                    <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center relative z-10">
                        <Package className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-gray-500">Total Items</p>
                        <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className={`absolute right-0 top-0 h-full w-24 bg-gradient-to-l to-transparent ${lowStockCount > 0 ? 'from-amber-50' : 'from-green-50'}`} />
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center relative z-10 ${lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-gray-500">Low Stock Alerts</p>
                        <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-purple-50 to-transparent" />
                    <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center relative z-10">
                        <ArrowUp className="w-6 h-6" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-gray-500">Total Valuation</p>
                        <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Visual Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or batch number..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                        <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 flex items-center gap-2">
                            <ArrowDown className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Medicine Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Level</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch Info</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price/Unit</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Loading inventory...
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No items found. Add new inventory to get started.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => {
                                    const isLowStock = item.quantity <= item.reorder_level;
                                    const expiryDate = item.expiry_date ? new Date(item.expiry_date) : null;
                                    const isExpiringSoon = expiryDate ? (expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24) < 30 : false;

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                                        <Pill className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{item.name}</div>
                                                        <div className="text-xs text-gray-500">{item.manufacturer}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {item.quantity}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{item.unit}</span>
                                                </div>
                                                {isLowStock && (
                                                    <div className="text-[10px] font-medium text-red-600 bg-red-50 inline-block px-1.5 py-0.5 rounded mt-1">
                                                        Low Stock (Min: {item.reorder_level})
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 font-mono">{item.batch_number}</div>
                                                {expiryDate && (
                                                    <div className={`text-xs flex items-center gap-1 ${isExpiringSoon ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                                                        <Calendar className="w-3 h-3" />
                                                        {expiryDate.toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">${(item.price || 0).toFixed(2)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${item.quantity === 0 ? 'bg-gray-100 text-gray-800' :
                                                    isLowStock ? 'bg-amber-100 text-amber-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {item.quantity === 0 ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleOpenModal(item)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isAppModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100 flex justify-between items-center shrink-0">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {editingItem ? 'Edit Item' : 'New Inventory Item'}
                                </h3>
                                <button onClick={() => setAppModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="e.g. Paracetamol 500mg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                                        <input
                                            type="text"
                                            value={formData.manufacturer}
                                            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="e.g. PharmaCorp"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                                        <input
                                            type="text"
                                            value={formData.batch_number}
                                            onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="e.g. BATCH-001"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                        <input
                                            required
                                            type="number"
                                            min="0"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                        <select
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        >
                                            <option value="tablets">Tablets</option>
                                            <option value="ml">ml</option>
                                            <option value="ampules">Ampules</option>
                                            <option value="boxes">Boxes</option>
                                            <option value="pieces">Pieces</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.reorder_level}
                                            onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                        <input
                                            type="date"
                                            value={formData.expiry_date}
                                            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            rows={2}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="Additional details..."
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
                                    >
                                        {editingItem ? 'Update Item' : 'Add to Inventory'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
