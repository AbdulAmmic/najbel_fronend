"use client";

import { useEffect, useState } from "react";
import {
    Package,
    AlertTriangle,
    TrendingUp,
    ShoppingCart,
    Search,
    Filter,
    Plus
} from "lucide-react";
import { pharmacy } from "@/services/api";

export default function InventoryDashboard() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const data = await pharmacy.getInventory();
                setItems(data);
            } catch (error) {
                console.error("Failed to fetch inventory", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInventory();
    }, []);

    const lowStockItems = items.filter((i: any) => i.quantity <= (i.reorder_level || 10));
    const totalValue = items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);

    if (loading) return <div className="p-8">Loading Inventory...</div>;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Store & Inventory</h1>
                    <p className="text-gray-500">Manage hospital supplies and equipment</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium">
                    <Plus className="w-4 h-4" />
                    Add New Item
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Items"
                    value={items.length}
                    icon={Package}
                    color="blue"
                />
                <StatsCard
                    title="Low Stock Alerts"
                    value={lowStockItems.length}
                    icon={AlertTriangle}
                    color="red"
                    alert={lowStockItems.length > 0}
                />
                <StatsCard
                    title="Stock Value"
                    value={`$${totalValue.toLocaleString()}`}
                    icon={ShoppingCart}
                    color="green"
                />
                <StatsCard
                    title="Monthly Usage"
                    value="+12%"
                    icon={TrendingUp}
                    color="purple"
                    subtext="vs last month"
                />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Low Stock Alerts (Priority) */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Low Stock Items
                        </h3>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-3">Item Name</th>
                                    <th className="px-5 py-3">Category</th>
                                    <th className="px-5 py-3 text-center">Stock</th>
                                    <th className="px-5 py-3 text-center">Reorder Level</th>
                                    <th className="px-5 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {lowStockItems.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">No stock alerts. Good job!</td></tr>
                                ) : (
                                    lowStockItems.slice(0, 5).map((item: any) => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-900">{item.name}</td>
                                            <td className="px-5 py-3 text-gray-500">{item.category}</td>
                                            <td className="px-5 py-3 text-center">
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-center text-gray-500">{item.reorder_level}</td>
                                            <td className="px-5 py-3">
                                                <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">Restock</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Recent Activity / Procurement */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors group">
                                <span className="text-gray-600 group-hover:text-gray-900 font-medium">Create Purchase Order</span>
                                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                            </button>
                            <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors group">
                                <span className="text-gray-600 group-hover:text-gray-900 font-medium">Receive Delivery</span>
                                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                            </button>
                            <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors group">
                                <span className="text-gray-600 group-hover:text-gray-900 font-medium">Stock Audit</span>
                                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 mb-4">Recent Movements</h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <ShoppingCart className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-900 font-medium">Received 500x Syringes</p>
                                        <p className="text-xs text-gray-500">2 hours ago • PO-#1023</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, color, alert, subtext }: any) {
    const colorClasses: any = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        red: "bg-red-50 text-red-600 border-red-100",
        green: "bg-green-50 text-green-600 border-green-100",
        purple: "bg-purple-50 text-purple-600 border-purple-100",
    };

    return (
        <div className={`p-5 bg-white rounded-2xl border shadow-sm transition-all hover:shadow-md ${alert ? 'border-red-200 ring-2 ring-red-50' : 'border-gray-200'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h4 className="text-2xl font-bold text-gray-900 mt-1">{value}</h4>
                    {subtext && <p className="text-xs text-green-600 font-medium mt-1">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-xl ${colorClasses[color] || colorClasses.blue}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    )
}

function ChevronRightIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    )
}
