"use client";

import { useEffect, useState } from "react";
import { dashboard } from "@/services/api";
import {
    Activity,
    Users,
    CreditCard,
    Calendar,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    DollarSign,
    UserPlus
} from "lucide-react";
import { motion } from "framer-motion";

export default function OverviewPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await dashboard.getStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <p className="text-gray-500 font-medium">Loading clinic overview...</p>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: "Total Revenue",
            value: "₦12.5M",
            change: "+12.5%",
            trend: "up",
            icon: DollarSign,
            color: "blue",
            description: "Monthly revenue"
        },
        {
            title: "Active Patients",
            value: stats?.active_patients || "1,240",
            change: "+4.3%",
            trend: "up",
            icon: Users,
            color: "emerald",
            description: "Registered patients"
        },
        {
            title: "Appointments",
            value: stats?.appointments_today || "42",
            change: "-2.1%",
            trend: "down",
            icon: Calendar,
            color: "violet",
            description: "Scheduled today"
        },
        {
            title: "Lab Requests",
            value: stats?.pending_labs || "18",
            change: "+8.4%",
            trend: "up",
            icon: Activity,
            color: "amber",
            description: "Pending results"
        }
    ];

    return (
        <div className="p-4 max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Clinic Overview</h1>
                    <p className="text-gray-500 mt-1">Real-time insights and performance metrics</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">Last 30 Days</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                        <UserPlus className="w-4 h-4" />
                        <span className="text-sm font-medium">New Patient</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
                {statCards.map((stat, i) => (
                    <motion.div
                        key={i}
                        variants={item}
                        className="group p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                <h3 className="text-xl font-bold text-gray-900 mt-2">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:bg-${stat.color}-600 group-hover:text-white transition-colors duration-300`}>
                                <stat.icon className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 text-sm">
                            <span className={`flex items-center gap-1 font-medium ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-500'
                                }`}>
                                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {stat.change}
                            </span>
                            <span className="text-gray-400">vs last month</span>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Charts Section Placeholder */}
            <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-gray-900">Revenue Analytics</h3>
                        <button className="text-sm text-blue-600 font-medium hover:underline">View Report</button>
                    </div>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm">Revenue Chart Visualization Component</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-gray-900">Department Performance</h3>
                        <button className="p-1 hover:bg-gray-100 rounded-lg">
                            <ArrowUpRight className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {[
                            { name: "General Practice", val: 85, color: "bg-blue-500" },
                            { name: "Dentistry", val: 62, color: "bg-emerald-500" },
                            { name: "Pediatrics", val: 45, color: "bg-amber-500" },
                            { name: "Cardiology", val: 30, color: "bg-rose-500" },
                        ].map((dept, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">{dept.name}</span>
                                    <span className="text-gray-500">{dept.val}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${dept.color} rounded-full`}
                                        style={{ width: `${dept.val}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
