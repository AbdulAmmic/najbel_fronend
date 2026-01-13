"use client";

import { useState, useEffect } from "react";
import PatientCard from "@/components/Layouts/patientFlipCards";
import PatientSummary from "@/components/patient/patientsSummary";
import { Calendar, Clock } from "lucide-react";
import { auth, appointments, medicalRecords } from "@/services/api";

export default function PatientDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingAppointment, setUpcomingAppointment] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [userData, appointmentsData, recordsData] = await Promise.all([
          auth.getMe(),
          appointments.getAll(),
          medicalRecords.getAll()
        ]);

        setUser(userData);

        // Get the next upcoming appointment
        const upcoming = appointmentsData
          .filter((apt: any) => apt.status === "confirmed" || apt.status === "pending")
          .sort((a: any, b: any) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime())[0];
        setUpcomingAppointment(upcoming);

        // Get recent medical records as activity
        setRecentActivity(recordsData.slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;

  const patientName = user?.full_name || "Patient";
  const patientId = user?.patient_profile ? `PT-2024-${user.patient_profile.id.toString().padStart(6, '0')}` : "N/A";
  const bloodGroup = user?.patient_profile?.blood_group || "Unknown";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Welcome back, {patientName}
        </h1>
        <p className="text-sm text-gray-600">
          Here is a quick overview of your health today.
        </p>
      </div>

      {/* Patient ATM Card */}
      <PatientCard
        name={patientName}
        patientId={patientId}
        bloodGroup={bloodGroup}
        balance="₦12,500.00"
      />

      {/* Dashboard Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left – Primary Medical Info */}
        <div className="lg:col-span-2 space-y-6">

          {/* Upcoming Appointment */}
          <div className="bg-white rounded-xl p-4 space-y-3">
            <h3 className="font-medium text-gray-900">
              Upcoming Appointment
            </h3>

            {upcomingAppointment ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {upcomingAppointment.doctor?.user?.full_name || "Doctor"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {upcomingAppointment.type === "online" ? "Online Consultation" : "In-Person Visit"}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {new Date(upcomingAppointment.appointment_time).toLocaleDateString()} · {new Date(upcomingAppointment.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <span className={`px-3 py-1 text-xs rounded-full ${upcomingAppointment.status === "confirmed" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                  }`}>
                  {upcomingAppointment.status.charAt(0).toUpperCase() + upcomingAppointment.status.slice(1)}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No upcoming appointments</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-4 space-y-3">
            <h3 className="font-medium text-gray-900">
              Recent Activity
            </h3>

            {recentActivity.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-700">
                {recentActivity.map((record, index) => (
                  <li key={index}>• {record.diagnosis || "Medical record"} - {new Date(record.created_at).toLocaleDateString()}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No recent activity</p>
            )}
          </div>
        </div>

        {/* Right – Summary Panel */}
        <div>
          <PatientSummary />
        </div>

      </section>
    </div>
  );
}
