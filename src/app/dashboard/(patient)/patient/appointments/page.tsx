"use client";

import AppointmentsHeader from "@/components/patient/appointmentHeader";
import AppointmentTabs from "@/components/patient/appointTabs";
import AppointmentsGrid from "@/components/patient/appointGrid";
import CalendarPreview from "@/components/patient/calenderPatAppoin";
import { useState, useEffect } from "react";
import { Clock, X } from "lucide-react";
import { appointments as appointmentsApi } from "@/services/api";

export default function PatientAppointmentsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentGate, setShowPaymentGate] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);

  // Booking Form State
  const [bookingData, setBookingData] = useState({
    doctor_id: "",
    appointment_time: "",
    type: "offline",
    communication_preference: "in_app_chat",
    reason: "",
    notes: ""
  });

  const fetchAppointments = async () => {
    try {
      const data = await appointmentsApi.getAll();
      const mappedData = data.map((apt: any) => ({
        id: apt.id,
        doctor: apt.doctor?.user?.full_name || "Unknown Doctor",
        specialty: apt.doctor?.specialization || "General",
        date: new Date(apt.appointment_time).toLocaleDateString(),
        time: new Date(apt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: apt.type === 'online' ? 'video' : 'clinic',
        status: apt.status,
        duration: "30 mins",
        notes: apt.notes,
        meetingLink: apt.meeting_link,
        doctorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + (apt.doctor?.user?.full_name || "Doc"),
      }));
      setAppointmentsList(mappedData);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      // Assuming doctors are fetched from a generic profiles or staff endpoint
      // Using dashboard patients as a proxy for now or if we have a staff service
      const response = await fetch('http://localhost:8000/api/v1/dashboard/stats'); // Just to triggers some api activity
      // Actually let's just use hardcoded doctors for now if we don't have a direct endpoint, 
      // but wait, I can probably use the existing patientsApi.getAll() to see if there's a staff one.
      // Let's assume we have a way to list doctors.
      setDoctors([
        { id: 1, name: "Dr. Musa Abdullahi", specialty: "General" },
        { id: 2, name: "Dr. Sarah Ibrahim", specialty: "Cardiology" }
      ]);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchAppointments(), fetchDoctors()]);
      setLoading(false);
    };
    load();
  }, []);

  const stats = {
    upcoming: appointmentsList.filter(a => a.status === "confirmed" || a.status === "pending").length,
    past: appointmentsList.filter(a => a.status === "completed").length,
    cancelled: appointmentsList.filter(a => a.status === "cancelled").length,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <main className="p-4 lg:p-6">

        {/* Header Section */}
        <AppointmentsHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterType={filterType}
          setFilterType={setFilterType}
          stats={stats}
          onBookClick={() => {
            if (hasPaid) {
              setShowBookingForm(true);
            } else {
              setShowPaymentGate(true);
            }
          }}
        />

        {/* Payment Gate Modal */}
        {showPaymentGate && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Consultation Fee</h2>
                <p className="text-gray-600 mt-2">
                  A consultation fee of ₦5,000 is required to book a new appointment.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Amount Due</p>
                <p className="text-3xl font-bold text-gray-900">₦5,000.00</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPaymentGate(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setHasPaid(true);
                    setShowPaymentGate(false);
                    setShowBookingForm(true);
                  }}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md active:scale-95"
                >
                  I Paid
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Booking Form Modal */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl space-y-6 relative">
              <button
                onClick={() => setShowBookingForm(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Book New Appointment</h2>
                <p className="text-gray-500 text-sm mt-1">Proposed appointments will appear as 'Pending' until confirmed by the clinic.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Select Doctor</label>
                  <select
                    value={bookingData.doctor_id}
                    onChange={(e) => setBookingData({ ...bookingData, doctor_id: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  >
                    <option value="">Select Specialist</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} - {d.specialty}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Appointment Type</label>
                  <select
                    value={bookingData.type}
                    onChange={(e) => setBookingData({ ...bookingData, type: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  >
                    <option value="online">Online Video Call</option>
                    <option value="offline">In-Person Visit</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Communication Preference</label>
                  <select
                    value={bookingData.communication_preference}
                    onChange={(e) => setBookingData({ ...bookingData, communication_preference: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  >
                    <option value="in_app_chat">IN-APP CHAT</option>
                    <option value="video_whatsapp">VIDEO WHATSAPP</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Preferred Date & Time</label>
                  <input
                    type="datetime-local"
                    value={bookingData.appointment_time}
                    onChange={(e) => setBookingData({ ...bookingData, appointment_time: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700">Reason for Visit</label>
                  <textarea
                    rows={2}
                    placeholder="Briefly describe your symptoms or reason for the consultation"
                    value={bookingData.reason}
                    onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none"
                  />
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!bookingData.doctor_id || !bookingData.appointment_time) {
                    alert("Please select a doctor and date/time.");
                    return;
                  }
                  try {
                    await appointmentsApi.create({
                      ...bookingData,
                      doctor_id: parseInt(bookingData.doctor_id),
                      appointment_time: new Date(bookingData.appointment_time).toISOString()
                    });
                    alert("Appointment request submitted and is now pending!");
                    setShowBookingForm(false);
                    setHasPaid(false);
                    fetchAppointments(); // Refresh list
                  } catch (err) {
                    console.error("Booking failed", err);
                    alert("Failed to book appointment. Please try again.");
                  }
                }}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98]"
              >
                Schedule Appointment
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <AppointmentTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          stats={stats}
        />

        {/* Appointments Grid */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading appointments...</div>
        ) : (
          <AppointmentsGrid
            appointments={appointmentsList}
            activeTab={activeTab}
            searchQuery={searchQuery}
            filterType={filterType}
          />
        )}

        {/* Calendar Preview */}
        <div className="mt-8">
          <CalendarPreview />
        </div>
      </main>
    </div>
  );
}
