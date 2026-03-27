"use client";

import { useState, useEffect } from "react";
import {
    Bell,
    Calendar,
    CreditCard,
    Activity,
    Info,
    CheckCircle2,
    Clock,
    Trash2,
    ArrowLeft,
    Search,
    CheckCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/services/api";

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'appointment' | 'billing' | 'medical' | 'system';
    is_read: boolean;
    created_at: string;
}

export default function NotificationsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.get("/notifications");
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put("/notifications/read-all");
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'appointment': return <Calendar className="w-5 h-5" />;
            case 'billing': return <CreditCard className="w-5 h-5" />;
            case 'medical': return <Activity className="w-5 h-5" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'appointment': return 'bg-blue-50 text-blue-600';
            case 'billing': return 'bg-amber-50 text-amber-600';
            case 'medical': return 'bg-emerald-50 text-emerald-600';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === "unread") return !n.is_read;
        if (filter === "all") return true;
        return n.type === filter;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 lg:pb-0">
            {/* Header Space */}
            <div className="max-w-4xl mx-auto px-4 pt-8 pb-6">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2.5 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all text-gray-600"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Notifications</h1>
                            <p className="text-sm text-gray-500 font-medium mt-1">Stay updated with your health and activity</p>
                        </div>
                    </div>

                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold text-gray-600 hover:shadow-md hover:border-blue-100 hover:text-blue-600 transition-all"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Mark all as read
                    </button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {["all", "unread", "appointment", "billing", "medical"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-bold capitalize transition-all whitespace-nowrap ${filter === f
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => !n.is_read && markAsRead(n.id)}
                                className={`group relative bg-white p-5 rounded-[2rem] border transition-all cursor-pointer hover:shadow-xl hover:shadow-blue-900/5 ${n.is_read ? 'border-gray-50 opacity-75' : 'border-blue-100 shadow-lg shadow-blue-600/5 ring-1 ring-blue-50'
                                    }`}
                            >
                                {!n.is_read && (
                                    <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-blue-600 rounded-full" />
                                )}

                                <div className="flex gap-5">
                                    <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center ${getTypeColor(n.type)}`}>
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className={`font-black tracking-tight ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                                                {n.title}
                                            </h3>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className={`text-sm leading-relaxed ${n.is_read ? 'text-gray-500' : 'text-gray-600 font-medium'}`}>
                                            {n.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Bell className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">All caught up!</h3>
                            <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                There are no new notifications at the moment. We'll let you know when something important happens.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
