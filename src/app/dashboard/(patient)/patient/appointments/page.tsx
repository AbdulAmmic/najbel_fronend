"use client";

import { useState, useEffect } from "react";
import {
  Clock, X, Calendar, Plus, Search, Video, MapPin, CheckCircle2,
  ChevronRight, Stethoscope, Activity, ArrowUpRight, CalendarClock
} from "lucide-react";
import { appointments as appointmentsApi, auth, users } from "@/services/api";
import { useRouter } from "next/navigation";

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentGate, setShowPaymentGate] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [walletPin, setWalletPin] = useState("");
  const [hasWalletPin, setHasWalletPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [bookingData, setBookingData] = useState({
    doctor_id: "", appointment_time: "", type: "offline",
    communication_preference: "in_app_chat", reason: "", notes: ""
  });

  const fetchAppointments = async () => {
    try {
      const data = await appointmentsApi.getAll();
      const mapped = data.map((apt: any) => ({
        id: apt.id,
        doctor: apt.doctor?.user?.full_name || "Unknown Doctor",
        specialty: apt.doctor?.specialization || "General",
        date: new Date(apt.appointment_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        time: new Date(apt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: apt.type || 'offline',
        status: apt.status,
        notes: apt.notes,
        reschedule_note: apt.reschedule_note,
      }));
      setAppointmentsList(mapped);
    } catch (err) { console.error("Failed to fetch appointments", err); }
  };

  const fetchDoctors = async () => {
    try {
      const res = await import("@/services/api").then(m => m.default.get("/users/doctors"));
      setDoctors(res.data);
    } catch (err) { console.error("Failed to fetch doctors", err); }
  };

  const fetchMe = async () => {
    try {
      const me = await auth.getMe();
      setHasWalletPin(me.has_wallet_pin);
    } catch (err) { console.error("Failed to fetch user data", err); }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchAppointments(), fetchDoctors(), fetchMe()]);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = appointmentsList.filter(apt => {
    if (activeTab === "upcoming") return apt.status === "confirmed" || apt.status === "pending" || apt.status === "rescheduled";
    if (activeTab === "history") return apt.status === "completed" || apt.status === "cancelled";
    return true;
  }).filter(apt =>
    apt.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColor = (s: string) => {
    switch (s) {
      case "confirmed": return "bg-emerald-500/10 text-emerald-600";
      case "pending": return "bg-amber-500/10 text-amber-600";
      case "rescheduled": return "bg-orange-500/10 text-orange-600";
      case "completed": return "bg-blue-500/10 text-blue-600";
      case "cancelled": return "bg-red-500/10 text-red-600";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-8 -mx-1">
      {/* Header */}
      <div className="px-1 pt-1 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Appointments</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">Manage your visits</p>
          </div>
          <button
            onClick={() => setShowBookingForm(true)}
            className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mx-1 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="Search doctor or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-blue-500 transition text-[13px] placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-1 mb-4 p-0.5 bg-gray-100 rounded-lg w-fit">
        {["upcoming", "history"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-[11px] font-semibold capitalize transition ${activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2 mx-1">
        {loading ? (
          <div className="flex flex-col items-center py-16 gap-2">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[11px] text-gray-400">Loading...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map(apt => (
            <div key={apt.id} className="bg-white rounded-xl p-3 border border-gray-100/80 hover:border-blue-100 transition">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                    {apt.doctor.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-[13px]">{apt.doctor}</p>
                    <p className="text-[10px] text-gray-400">{apt.specialty}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${statusColor(apt.status)}`}>
                  {apt.status?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-2.5">
                <div className="flex-1 flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5">
                  <Calendar className="w-3 h-3 text-gray-400" /> {apt.date}
                </div>
                <div className="flex-1 flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-50 rounded-lg px-2.5 py-1.5">
                  <Clock className="w-3 h-3 text-gray-400" /> {apt.time}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 rounded-lg px-2.5 py-1.5">
                  {apt.type === 'online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                  {apt.type === 'online' ? 'Online' : 'Clinic'}
                </div>
              </div>
              {apt.status === 'confirmed' && apt.type === 'online' && (
                <button
                  onClick={() => router.push(`/dashboard/meeting/${apt.id}`)}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-700 active:scale-[0.98] transition"
                >
                  <Video className="w-3.5 h-3.5" /> Join Video Call <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
              {apt.status === 'rescheduled' && (
                <div className="space-y-2">
                  {apt.reschedule_note && (
                    <div className="flex items-start gap-2 bg-orange-50 rounded-lg p-2.5 border border-orange-100">
                      <CalendarClock className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-orange-700">
                        <span className="font-semibold">Doctor's note:</span> {apt.reschedule_note}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        await appointmentsApi.acceptReschedule(apt.id);
                        setAppointmentsList(prev => prev.map(a => a.id === apt.id ? { ...a, status: 'confirmed', reschedule_note: null } : a));
                      } catch (err: any) {
                        alert(err?.response?.data?.detail || "Failed to accept reschedule");
                      }
                    }}
                    className="w-full py-2 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-700 active:scale-[0.98] transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accept New Schedule
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <Calendar className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700 mb-1">No appointments</p>
            <p className="text-[11px] text-gray-400">Schedule a visit to get started</p>
            <button
              onClick={() => setShowBookingForm(true)}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-[11px] font-semibold"
            >
              Book Visit
            </button>
          </div>
        )}
      </div>

      {/* Payment Gate Modal (Wallet PIN Entry) */}
      {showPaymentGate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[120] flex items-end sm:items-center justify-center" onClick={() => setShowPaymentGate(false)}>
          <div className="bg-white rounded-t-xl sm:rounded-xl p-5 w-full sm:max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">{hasWalletPin ? "Confirm Payment" : "Set Wallet PIN"}</h2>
              <p className="text-[11px] text-gray-400 mt-1">{hasWalletPin ? "Consultation fee required" : "Secure your wallet before booking"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-5 text-center">
              <p className="text-[10px] text-gray-400 font-medium mb-1">
                {hasWalletPin ? "Enter your 4-digit Wallet PIN to authorize deduction." : "Create a 4-digit Wallet PIN to protect your funds."}
              </p>
              <div className="flex justify-center mt-3">
                <input
                  type="text"
                  maxLength={4}
                  autoFocus
                  value={walletPin}
                  onChange={(e) => setWalletPin(e.target.value)}
                  placeholder="PIN"
                  className="w-[180px] text-center text-3xl font-black bg-white border-2 border-gray-200 rounded-xl py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all text-gray-900 shadow-sm"
                />
              </div>
            </div>
            <button
              disabled={walletPin.length < 4 || isSubmitting}
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  if (!hasWalletPin) {
                    await users.updatePin(walletPin);
                    setHasWalletPin(true);
                  }

                  await appointmentsApi.create({
                    ...bookingData,
                    doctor_id: parseInt(bookingData.doctor_id),
                    appointment_time: new Date(bookingData.appointment_time).toISOString(),
                    wallet_pin: walletPin
                  });
                  setShowPaymentGate(false);
                  setShowBookingForm(false);
                  setWalletPin("");
                  fetchAppointments();
                } catch (err: any) {
                  console.error("Appointment Error:", err);
                  const msg = err.response?.data?.detail || err.message || "An unexpected error occurred";
                  alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition"
            >
              {isSubmitting ? "Processing..." : (hasWalletPin ? "Authorize & Book" : "Set PIN & Book")}
            </button>
            <button onClick={() => setShowPaymentGate(false)} className="w-full py-2 mt-2 text-gray-400 text-[11px] font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Booking Form Modal — Full-screen bottom sheet on mobile, centered card on desktop */}
      {showBookingForm && !showPaymentGate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] overflow-hidden" onClick={() => setShowBookingForm(false)}>
          {/* Mobile: slides up from bottom, full width, scrollable */}
          {/* Desktop: centered card */}
          <div className="absolute inset-x-0 bottom-0 sm:relative sm:inset-auto sm:flex sm:items-center sm:justify-center sm:min-h-full sm:p-4">
            <div
              className="bg-white rounded-t-xl sm:rounded-xl w-full sm:max-w-md shadow-xl max-h-[92vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Drag handle (mobile) */}
              <div className="sticky top-0 bg-white pt-3 pb-2 px-5 border-b border-gray-50 z-10 sm:border-0 sm:pb-0">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3 sm:hidden" />
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Book Appointment</h2>
                  <button onClick={() => setShowBookingForm(false)} className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:text-gray-600 active:scale-95 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Doctor Select */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Doctor</label>
                  <select
                    value={bookingData.doctor_id}
                    onChange={(e) => setBookingData({ ...bookingData, doctor_id: e.target.value })}
                    className="w-full px-3 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-blue-500 text-[13px]"
                  >
                    <option value="">Select doctor...</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} · {d.specialty}</option>)}
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Type</label>
                  <div className="flex bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                    <button onClick={() => setBookingData({ ...bookingData, type: 'online' })} className={`flex-1 py-2.5 rounded-lg text-[11px] font-semibold transition ${bookingData.type === 'online' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>Online</button>
                    <button onClick={() => setBookingData({ ...bookingData, type: 'offline' })} className={`flex-1 py-2.5 rounded-lg text-[11px] font-semibold transition ${bookingData.type === 'offline' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>Clinic</button>
                  </div>
                </div>

                {/* Date & Time */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={bookingData.appointment_time}
                    onChange={(e) => setBookingData({ ...bookingData, appointment_time: e.target.value })}
                    className="w-full px-3 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-blue-500 text-[13px]"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Reason</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your health concern..."
                    value={bookingData.reason}
                    onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                    className="w-full px-3 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-blue-500 text-[13px] resize-none placeholder:text-gray-300"
                  />
                </div>

                {/* Submit */}
                <div className="pt-1 pb-2">
                  <button
                    onClick={async () => {
                      if (!bookingData.doctor_id || !bookingData.appointment_time) { alert("Please fill required fields"); return; }
                      // Trigger payment gate
                      setShowPaymentGate(true);
                    }}
                    className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm active:scale-[0.98] transition"
                  >
                    Continue to Payment
                  </button>
                  <button onClick={() => setShowBookingForm(false)} className="w-full py-2 mt-1 text-gray-400 text-[11px] font-medium sm:hidden">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
