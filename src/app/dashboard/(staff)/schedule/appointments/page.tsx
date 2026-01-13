"use client";

import { useState, useEffect } from "react";
import {
    Calendar,
    Search,
    Filter,
    Plus,
    Clock,
    User,
    Video,
    MapPin,
    CheckCircle2,
    XCircle,
    AlertCircle,
    X
} from "lucide-react";
import { appointments as appointmentsApi, patients as patientsApi } from "@/services/api";

export default function DoctorAppointmentsPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // New Appointment Form State
    const [formData, setFormData] = useState({
        patient_id: "",
        doctor_id: "1", // Assuming current doctor ID for now
        appointment_time: "",
        type: "offline",
        notes: ""
    });
    const [patients, setPatients] = useState<any[]>([]);

    useEffect(() => {
        fetchAppointments();
        fetchPatients();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const data = await appointmentsApi.getAll();
            setAppointments(data);
        } catch (err) {
            console.error("Failed to fetch appointments", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPatients = async () => {
        try {
            const data = await patientsApi.getAll();
            setPatients(data);
        } catch (err) {
            console.error("Failed to fetch patients", err);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await appointmentsApi.update(id, { status: "confirmed" });
            fetchAppointments();
        } catch (err) {
            console.error("Failed to approve appointment", err);
            alert("Error approving appointment");
        }
    };

    const handleCreateAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await appointmentsApi.create({
                ...formData,
                patient_id: parseInt(formData.patient_id),
                doctor_id: parseInt(formData.doctor_id)
            });
            setShowModal(false);
            fetchAppointments();
            setFormData({
                patient_id: "",
                doctor_id: "1",
                appointment_time: "",
                type: "offline",
                notes: ""
            });
        } catch (err) {
            console.error("Failed to create appointment", err);
            alert("Error creating appointment. Please check your inputs.");
        }
    };

    const filteredAppointments = appointments.filter(apt => {
        const matchesSearch = apt.patient?.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.doctor?.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <Calendar className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manage Appointments</h1>
                        <p className="text-gray-500">View and schedule clinic visits</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    New Appointment
                </button>
            </div>

            {/* Filters and Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by patient or doctor name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Appointments List */}
            {loading ? (
                <div className="py-20 text-center text-gray-500">Loading appointments...</div>
            ) : filteredAppointments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Calendar className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">No appointments found</h3>
                    <p className="text-gray-500 max-w-xs">There are no appointments matching your current criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAppointments.map((apt) => (
                        <div key={apt.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{apt.patient?.user?.full_name}</h3>
                                        <p className="text-xs text-gray-500">Age: {apt.patient?.age || 'N/A'}</p>
                                    </div>
                                </div>
                                <StatusBadge status={apt.status} />
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="p-1.5 rounded-lg bg-gray-50">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <span>{new Date(apt.appointment_time).toLocaleString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="p-1.5 rounded-lg bg-gray-50">
                                        {apt.type === 'online' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                                    </div>
                                    <span className="capitalize">{apt.type} Appointment</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="p-1.5 rounded-lg bg-gray-50">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs">With: {apt.doctor?.user?.full_name}</span>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100">
                                    View Detail
                                </button>
                                {apt.status === 'pending' && (
                                    <button
                                        onClick={() => handleApprove(apt.id)}
                                        className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-md transition-all active:scale-95"
                                    >
                                        Approve
                                    </button>
                                )}
                                {apt.status === 'confirmed' && (
                                    <button className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-semibold hover:bg-emerald-100">
                                        Start Visit
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Appointment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-xl w-full shadow-2xl relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule New Appointment</h2>

                        <form onSubmit={handleCreateAppointment} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Patient</label>
                                    <select
                                        required
                                        value={formData.patient_id}
                                        onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    >
                                        <option value="">Select Patient</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>{p.user?.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Appointment Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    >
                                        <option value="offline">In-Person Clinic</option>
                                        <option value="online">Online Video Call</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Date & Time</label>
                                    <input
                                        required
                                        type="datetime-local"
                                        value={formData.appointment_time}
                                        onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Assigned Doctor ID</label>
                                    <input
                                        type="number"
                                        value={formData.doctor_id}
                                        onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Notes / Reason</label>
                                <textarea
                                    rows={3}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                    placeholder="Enter details about the visit..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98]"
                            >
                                Create Appointment
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        pending: "bg-amber-50 text-amber-600 border-amber-100",
        confirmed: "bg-blue-50 text-blue-600 border-blue-100",
        completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
        cancelled: "bg-red-50 text-red-600 border-red-100",
    };

    const icons: any = {
        pending: <AlertCircle className="w-3 h-3" />,
        confirmed: <CheckCircle2 className="w-3 h-3" />,
        completed: <CheckCircle2 className="w-3 h-3" />,
        cancelled: <XCircle className="w-3 h-3" />,
    };

    return (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 uppercase tracking-wider ${styles[status] || styles.pending}`}>
            {icons[status]}
            {status}
        </span>
    );
}
