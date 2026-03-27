"use client";

import { useEffect, useState } from "react";
import {
    Users,
    Calendar,
    UserPlus,
    Clock,
    Search,
    CheckCircle,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { appointments, billing } from "@/services/api";
import BookAppointmentModal from "@/components/reception/BookAppointmentModal";
import RequestLabModal from "@/components/reception/RequestLabModal";
import CheckInModal from "@/components/reception/CheckInModal";
import { Calendar as CalendarIcon, ExternalLink, FlaskConical, MapPin } from "lucide-react";

interface User {
    full_name: string;
}

interface Doctor {
    user: User;
}

interface Patient {
    id: number;
    user: User;
}

interface Appointment {
    id: number;
    appointment_time: string;
    status: string;
    patient: Patient;
    doctor: Doctor;
    // Add other fields as needed
}

export default function ReceptionDashboard() {
    const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBookModal, setShowBookModal] = useState(false);
    const [showLabModal, setShowLabModal] = useState(false);
    const [showCheckInModal, setShowCheckInModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // In a real app, this should be filtered by date=today on the backend
                const data = await appointments.getAll();
                // Filter client-side for "today" as a fallback if API returns all
                const today = new Date().toDateString();
                const todays = data.filter((a: any) => new Date(a.appointment_time).toDateString() === today);
                // Sort by time
                todays.sort((a: any, b: any) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime());
                setTodaysAppointments(todays);
            } catch (error) {
                console.error("Failed to fetch reception data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [refreshTrigger]);

    const handleCheckIn = async (appointment: Appointment) => {
        if (!confirm(`Check in ${appointment.patient?.user?.full_name}? Confirm payment has been received.`)) return;

        try {
            await appointments.updateStatus(appointment.id, 'checked-in');
            // Refresh
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error("Check-in failed", error);
            alert("Failed to check in patient.");
        }
    };

    const waitingCount = todaysAppointments.filter((a) => a.status === 'checked-in').length;

    if (loading) return <div className="p-8">Loading Front Desk...</div>;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Front Desk</h1>
                    <p className="text-gray-500">Patient Registration & Queue Management</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowCheckInModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-shadow shadow-lg shadow-green-200 font-bold"
                    >
                        <MapPin className="w-5 h-5" />
                        Patient Arrived
                    </button>
                    <button
                        onClick={() => setShowLabModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                        <FlaskConical className="w-5 h-5" />
                        Request Lab
                    </button>
                    <button
                        onClick={() => setShowBookModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                        <CalendarIcon className="w-5 h-5" />
                        Book Appointment
                    </button>
                    <Link href="/dashboard/reception/register" className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-shadow shadow-lg shadow-blue-200 font-medium">
                        <UserPlus className="w-5 h-5" />
                        New Patient
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-blue-600 font-medium">Waiting Room</p>
                        <h3 className="text-2xl font-bold text-gray-900">{waitingCount}</h3>
                    </div>
                </div>
                <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-4">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-orange-600 font-medium">Expected Today</p>
                        <h3 className="text-2xl font-bold text-gray-900">{todaysAppointments.length}</h3>
                    </div>
                </div>
                <div className="p-5 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-green-600 font-medium">Checked In</p>
                        <h3 className="text-2xl font-bold text-gray-900">{waitingCount}</h3>
                    </div>
                </div>
                <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-purple-600 font-medium">New Patients</p>
                        <h3 className="text-2xl font-bold text-gray-900">3</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main List: Today's Appointments */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-900">Today's Schedule</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="Find patient..." className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </div>
                    </div>

                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-5 py-3">Time</th>
                                <th className="px-5 py-3">Patient</th>
                                <th className="px-5 py-3">Doctor</th>
                                <th className="px-5 py-3 text-center">Status</th>
                                <th className="px-5 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {todaysAppointments.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No appointments found for today.</td></tr>
                            ) : (
                                todaysAppointments.map((apt) => (
                                    <tr key={apt.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3 font-mono text-gray-600">
                                            {new Date(apt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-5 py-3 font-medium text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                    {apt.patient?.user?.full_name?.[0] || 'P'}
                                                </div>
                                                <div>
                                                    <p>{apt.patient?.user?.full_name || 'Walking Patient'}</p>
                                                    <p className="text-xs text-gray-400 font-normal">ID: {apt.patient?.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500">Dr. {apt.doctor?.user?.full_name?.split(' ')[1] || 'Smith'}</td>
                                        <td className="px-5 py-3 text-center">
                                            <StatusBadge status={apt.status} />
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Billing Link */}
                                                <Link
                                                    href={`/dashboard/billing`}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Go to Billing"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>

                                                {(apt.status === 'pending' || apt.status === 'confirmed') && (
                                                    <button
                                                        onClick={() => handleCheckIn(apt)}
                                                        className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
                                                    >
                                                        Check In
                                                    </button>
                                                )}
                                                {apt.status === 'checked-in' && (
                                                    <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">In Queue</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Right: Quick Actions / Walk-in */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                        <h3 className="font-bold text-lg mb-2">Emergency Admission</h3>
                        <p className="text-blue-100 text-sm mb-4">Fast-track registration for critical patients.</p>
                        <Link href="/dashboard/reception/register?type=emergency" className="block w-full text-center py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">
                            Emergency Check-in
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            Pending Actions
                        </h3>
                        <div className="space-y-3">
                            <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 text-sm">
                                <p className="font-medium text-orange-800">Insurance Verification</p>
                                <p className="text-orange-600 mt-0.5">Patient John Doe - HMO Auth pending</p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-sm">
                                <p className="font-medium text-red-800">Missing Info</p>
                                <p className="text-red-600 mt-0.5">Jane Doe - Phone number required</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showBookModal && (
                <BookAppointmentModal
                    onClose={() => setShowBookModal(false)}
                    onSuccess={() => setRefreshTrigger(prev => prev + 1)}
                />
            )}

            {showLabModal && (
                <RequestLabModal
                    onClose={() => setShowLabModal(false)}
                    onSuccess={() => {
                        setRefreshTrigger(prev => prev + 1);
                        alert("Lab Request Sent & Invoice Created!");
                    }}
                />
            )}

            {showCheckInModal && (
                <CheckInModal
                    onClose={() => setShowCheckInModal(false)}
                    onSuccess={() => setRefreshTrigger(prev => prev + 1)}
                />
            )}

        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        'pending': 'bg-yellow-100 text-yellow-700',
        'pending_payment': 'bg-orange-100 text-orange-700',
        'confirmed': 'bg-blue-100 text-blue-700',
        'checked-in': 'bg-green-100 text-green-700',
        'completed': 'bg-gray-100 text-gray-600',
        'cancelled': 'bg-red-50 text-red-600'
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${styles[status] || styles['pending']}`}>
            {status.replace('_', ' ').replace('-', ' ')}
        </span>
    )
}
