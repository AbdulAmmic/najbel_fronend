"use client";

import { useEffect, useState } from "react";
import { appointments, patients } from "@/services/api";
import {
    Calendar,
    Clock,
    User,
    FileText,
    Video,
    MapPin,
    MoreVertical,
    Search,
    Plus
} from "lucide-react";
import { motion } from "framer-motion";

export default function DoctorDashboard() {
    const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await appointments.getAll();
                setAppointmentsList(data);
            } catch (error) {
                console.error("Failed to fetch doctor data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const upcomingAppointments = appointmentsList
        .filter((a: any) => new Date(a.appointment_time) > new Date())
        .sort((a: any, b: any) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime());

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-blue-100 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Medical Console</h1>
                    <p className="text-gray-500 mt-1">Manage appointments and patient records</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full md:w-64"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">New Record</span>
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Schedule */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                Today's Schedule
                            </h2>
                            <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                {upcomingAppointments.length} Upcoming
                            </span>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {upcomingAppointments.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    No appointments scheduled for today
                                </div>
                            ) : (
                                upcomingAppointments.map((apt: any, i: number) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={apt.id}
                                        className="p-4 hover:bg-gray-50 transition-colors group cursor-pointer"
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Time Column */}
                                            <div className="flex flex-col items-center min-w-[80px]">
                                                <span className="text-lg font-bold text-gray-900">
                                                    {new Date(apt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-xs font-medium text-gray-500 uppercase">
                                                    {new Date(apt.appointment_time) > new Date() ? 'Upcoming' : 'Past'}
                                                </span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                            {apt.patient?.user?.full_name || "Unknown Patient"}
                                                        </h3>
                                                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                                            {apt.type === 'online' ? (
                                                                <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium">
                                                                    <Video className="w-3 h-3" /> Online Consultation
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-medium">
                                                                    <MapPin className="w-3 h-3" /> In-Person Visit
                                                                </span>
                                                            )}
                                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                            <span>{apt.reason || "General Checkup"}</span>
                                                        </p>
                                                    </div>
                                                    <button className="p-2 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreVertical className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                                Start
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                            <button className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                View Full Calendar
                            </button>
                        </div>
                    </section>
                </div>

                {/* Right Column: Quick Stats & Recent */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <div className="flex items-center gap-2 mb-2 text-emerald-700">
                                <User className="w-4 h-4" />
                                <span className="text-sm font-medium">Patients</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-900">12</p>
                            <p className="text-xs text-emerald-600">Seen today</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <div className="flex items-center gap-2 mb-2 text-blue-700">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">Hours</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-900">4.5</p>
                            <p className="text-xs text-blue-600">Time logged</p>
                        </div>
                    </div>

                    {/* Pending Reviews */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                            <span>Pending Reviews</span>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">3</span>
                        </h3>
                        <div className="space-y-3">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
                                    <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Lab Results - John Doe</h4>
                                        <p className="text-xs text-gray-500">Lipid Profile • Urg: High</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* System Status or Quote */}
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
                        <h3 className="font-bold text-lg mb-2">Did you know?</h3>
                        <p className="text-indigo-100 text-sm mb-4">
                            You've maintained a 98% positive patient feedback rating this month!
                        </p>
                        <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm">
                            View Analytics
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
