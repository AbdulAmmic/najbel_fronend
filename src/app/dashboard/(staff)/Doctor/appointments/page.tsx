"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  Video,
  MapPin,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  MoreVertical,
  Brain,
  ChevronRight,
  AlertCircle,
  MessageSquare,
  RefreshCcw // Added refresh icon
} from "lucide-react";
import { appointments as appointmentsApi } from "@/services/api";
import { formatDate, formatTime, calculateAge, isValidDate } from "@/utils/date";

// Interfaces
interface Patient {
  id: number;
  name: string;
  age: string | number;
  gender: string;
  avatarColor?: string;
}

interface Appointment {
  id: number;
  patient: Patient;
  time: string;
  date: string;
  fullDate?: string; // ISO string for sorting
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'checked-in' | 'rescheduled';
  type: 'in-person' | 'virtual';
  reason: string;
  duration: string;
  priority: 'low' | 'medium' | 'high';
  aiSummary?: string;
}

const statsInit = [
  { label: "Today", value: "0", sub: "appointments" },
  { label: "Pending", value: "0", sub: "needs action" },
  { label: "Virtual", value: "0", sub: "online" },
  { label: "Completed", value: "0", sub: "today" },
];

export default function DoctorAppointments() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [stats, setStats] = useState(statsInit);

  // Action Modals State
  const [showCancelModal, setShowCancelModal] = useState<number | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState<number | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [newTime, setNewTime] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentsApi.getAll();
      console.log("DEBUG: Appointments Data:", data); // Inspect raw data
      // Transform API data to UI format
      // Assuming API returns array of objects with patient details
      const transformed: Appointment[] = Array.isArray(data) ? data.map((apt: any) => ({
        id: apt.id,
        patient: {
          id: apt.patient_id,
          name: apt.patient?.user?.full_name || apt.patient?.full_name || "Unknown Patient",
          age: calculateAge(apt.patient?.dob),
          gender: apt.patient?.gender || "N/A",
          avatarColor: "bg-blue-500" // Default color, could be random
        },
        time: formatTime(apt.start_time),
        date: isValidDate(apt.start_time) && new Date(apt.start_time).toDateString() === new Date().toDateString() ? "Today" : formatDate(apt.start_time),
        fullDate: apt.start_time,
        status: apt.status.toLowerCase(),
        type: apt.type?.toLowerCase() === 'online' ? 'virtual' : 'in-person', // Map API type
        reason: apt.reason || "General Consultation",
        duration: "30 min", // Default or calc from start/end
        priority: apt.priority?.toLowerCase() || 'medium',
        aiSummary: apt.ai_summary || "No summary available."
      })) : [];

      setAppointments(transformed);

      // Calculate stats
      const today = new Date().toDateString();
      const todayApts = transformed.filter(a => isValidDate(a.fullDate) && new Date(a.fullDate || "").toDateString() === today);

      setStats([
        { label: "Today", value: todayApts.length.toString(), sub: "appointments" },
        { label: "Pending", value: transformed.filter(a => a.status === 'pending').length.toString(), sub: "needs action" },
        { label: "Virtual", value: transformed.filter(a => a.type === 'virtual').length.toString(), sub: "online" },
        { label: "Completed", value: todayApts.filter(a => a.status === 'completed').length.toString(), sub: "today" },
      ]);

    } catch (error) {
      console.error("Failed to fetch appointments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter(apt => {
    const matchesFilter = filter === "all" || apt.status === filter;
    const matchesSearch =
      apt.patient.name.toLowerCase().includes(search.toLowerCase()) ||
      apt.reason.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAccept = async (id: number) => {
    try {
      await appointmentsApi.confirm(id, { note: "" });
      // Optimistic update or refresh
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a));
    } catch (error) {
      console.error("Failed to accept appointment", error);
      alert("Failed to accept appointment");
    }
  };

  const handleDecline = (id: number) => {
    setShowCancelModal(id);
  };

  const submitCancel = async () => {
    if (!showCancelModal) return;
    try {
      setActionLoading(true);
      await appointmentsApi.cancel(showCancelModal, { note: actionNote });
      setAppointments(prev => prev.map(a => a.id === showCancelModal ? { ...a, status: 'cancelled' } : a));
      setShowCancelModal(null);
      setActionNote("");
    } catch (error) {
      console.error("Failed to cancel", error);
      alert("Failed to cancel appointment");
    } finally {
      setActionLoading(false);
    }
  };

  const submitReschedule = async () => {
    if (!showRescheduleModal || !newTime) return;
    try {
      setActionLoading(true);

      // Convert local datetime-local to ISO for backend
      const isoDate = new Date(newTime).toISOString();

      await appointmentsApi.reschedule(showRescheduleModal, { new_time: isoDate, note: actionNote });

      // Optimistic refresh
      await fetchAppointments();
      setShowRescheduleModal(null);
      setActionNote("");
      setNewTime("");
    } catch (error) {
      console.error("Failed to reschedule", error);
      alert("Failed to reschedule appointment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartConsultation = (id: number) => {
    // Logic to choose between online and offline page
    // For now, assuming standard consultation page
    const apt = appointments.find(a => a.id === id);
    if (apt?.type === 'virtual') {
      router.push(`/dashboard/meeting/${id}`);
    } else {
      router.push(`/dashboard/Doctor/consultations/${id}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'rescheduled': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'checked-in': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-1">Manage your daily consultations</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAppointments}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
            >
              <RefreshCcw className="h-5 w-5" />
            </button>
            <button className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today's Schedule
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
              <p className="text-xs text-gray-400">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patient or reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Appointments</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No appointments found</p>
            </div>
          ) : (
            filteredAppointments.map((apt) => (
              <div key={apt.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Section - Patient Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full ${apt.patient.avatarColor || 'bg-blue-500'} flex items-center justify-center text-white font-bold`}>
                        {apt.patient.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{apt.patient.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(apt.status)}`}>
                            {apt.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{apt.patient.age}yrs • {apt.patient.gender}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          {apt.type === 'virtual' ? (
                            <Video className="h-4 w-4 text-purple-600" />
                          ) : (
                            <MapPin className="h-4 w-4 text-blue-600" />
                          )}
                          {apt.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {apt.duration}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(apt.priority)}`}>
                          {apt.priority} priority
                        </span>
                      </div>
                      <p className="font-medium text-gray-800">{apt.reason}</p>
                    </div>
                  </div>

                  {/* Right Section - Time & Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{apt.date}</div>
                      <div className="text-lg font-bold text-gray-900">{apt.time}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {apt.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAccept(apt.id)}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Accept
                          </button>
                          <button
                            onClick={() => { setShowRescheduleModal(apt.id); setActionNote(""); setNewTime(""); }}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 flex items-center gap-1"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleDecline(apt.id)}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            Decline
                          </button>
                        </div>
                      ) : (apt.status === 'confirmed' || apt.status === 'checked-in') ? (
                        <div className="flex gap-2">
                          {apt.type === 'virtual' && (
                            <button
                              onClick={() => router.push(`/dashboard/meeting/${apt.id}`)}
                              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 flex items-center gap-2"
                            >
                              <Video className="h-4 w-4" />
                              Join
                            </button>
                          )}
                          <button
                            onClick={() => handleStartConsultation(apt.id)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                          >
                            Start Consultation
                          </button>
                          <button
                            onClick={() => { setShowRescheduleModal(apt.id); setActionNote(""); setNewTime(""); }}
                            className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleDecline(apt.id)}
                            className="px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : apt.status === 'rescheduled' ? (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1.5 bg-orange-50 text-orange-600 text-xs font-medium rounded-lg border border-orange-100">
                            ⏳ Awaiting Patient Acceptance
                          </span>
                          <button
                            onClick={() => handleDecline(apt.id)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : null}

                      <button
                        onClick={() => setSelectedAppointment(apt)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Summary Preview */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedAppointment(apt)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Brain className="h-4 w-4 text-blue-500" />
                    View AI Summary
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Today */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Next Up
            </h3>
            <div className="space-y-4">
              {appointments
                .filter(a => (a.status === 'confirmed' || a.status === 'checked-in') && a.date === 'Today')
                .slice(0, 3)
                .map((apt) => (
                  <button
                    key={apt.id}
                    onClick={() => handleStartConsultation(apt.id)}
                    className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors flex items-center gap-3 group"
                  >
                    <div className={`w-8 h-8 rounded-full ${apt.patient.avatarColor || 'bg-blue-500'} flex items-center justify-center text-white text-sm font-bold`}>
                      {apt.patient.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{apt.patient.name}</p>
                      <p className="text-xs text-gray-500">{apt.time} • {apt.reason}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </button>
                ))}
              {appointments.filter(a => (a.status === 'confirmed' || a.status === 'checked-in') && a.date === 'Today').length === 0 && (
                <p className="text-sm text-gray-500 italic">No upcoming appointments today.</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Message Patients</p>
                  <p className="text-xs text-gray-500">Send appointment reminders</p>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-green-50 hover:border-green-200 transition-colors flex items-center gap-3">
                <Calendar className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Schedule Block</p>
                  <p className="text-xs text-gray-500">Block time for meetings</p>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-purple-50 hover:border-purple-200 transition-colors flex items-center gap-3">
                <Brain className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">AI Insights</p>
                  <p className="text-xs text-gray-500">View patient patterns</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Appointment</h3>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason to the patient for cancelling this appointment.</p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 mb-4 min-h-[100px]"
              placeholder="Your note here..."
              value={actionNote}
              onChange={e => setActionNote(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                disabled={actionLoading}
                onClick={submitCancel}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
              <button
                onClick={() => setShowCancelModal(null)}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg font-medium"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Reschedule Appointment</h3>
            <p className="text-sm text-gray-600 mb-4">Choose a new time and drop a note for the patient.</p>

            <label className="block text-sm font-medium text-gray-700 mb-1">New Date & Time</label>
            <input
              type="datetime-local"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 mb-4"
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Note for Patient</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 mb-4 min-h-[80px]"
              placeholder="e.g. I have an emergency surgery, moved to tomorrow."
              value={actionNote}
              onChange={e => setActionNote(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                disabled={actionLoading || !newTime}
                onClick={submitReschedule}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg font-medium"
              >
                {actionLoading ? 'Updating...' : 'Confirm Reschedule'}
              </button>
              <button
                onClick={() => setShowRescheduleModal(null)}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">AI Summary</h3>
                  <p className="text-sm text-gray-500">Patient: {selectedAppointment.patient.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedAppointment.aiSummary}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Recommended Actions</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Review previous medical history
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Check recent lab results
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Prepare consultation questions
                  </li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleStartConsultation(selectedAppointment.id)}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start Consultation
                </button>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Banner */}
      <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium">Need help with scheduling?</p>
              <p className="text-sm text-blue-100">Contact the administration team</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50">
            Get Support
          </button>
        </div>
      </div>
    </div>
  );
}