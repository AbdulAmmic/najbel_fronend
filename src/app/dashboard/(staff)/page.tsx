"use client";

import { useState, useEffect } from "react";
import { dashboard, appointments } from "@/services/api";
import {
  Calendar,
  Users,
  Activity,
  Bed,
  Clock,
  UserCheck,
  FileText,
  Pill,
  TrendingUp,
  TrendingDown
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { auth } = await import("@/services/api");
        const [statsData, apptsData, userData] = await Promise.all([
          dashboard.getStats(),
          appointments.getAll(),
          auth.getMe()
        ]);
        setStats(statsData);
        setAppointmentsList(apptsData);
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statsCards = [
    {
      label: "Today's Appointments",
      value: stats?.appointments_today?.toString() || "0",
      delta: stats?.appointments_delta?.toString() || "0",
      icon: <Calendar className="w-5 h-5" />,
      color: "bg-blue-50 text-blue-600",
      trend: "up"
    },
    {
      label: "Active Patients",
      value: stats?.active_patients?.toString() || "0",
      delta: stats?.patients_delta?.toString() || "0",
      icon: <Users className="w-5 h-5" />,
      color: "bg-emerald-50 text-emerald-600",
      trend: "up"
    },
    {
      label: "Pending Lab Results",
      value: stats?.pending_labs?.toString() || "0",
      delta: stats?.labs_delta?.toString() || "0",
      icon: <Activity className="w-5 h-5" />,
      color: "bg-amber-50 text-amber-600",
      trend: "down"
    },
    {
      label: "Available Beds",
      value: stats?.available_beds?.toString() || "0",
      delta: stats?.beds_delta?.toString() || "0",
      icon: <Bed className="w-5 h-5" />,
      color: "bg-indigo-50 text-indigo-600",
      trend: "neutral"
    },
  ];

  const recentPatients = appointmentsList.slice(0, 4).map((apt: any) => ({
    name: apt.patient?.user?.full_name || "Unknown Patient",
    time: new Date(apt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    doctor: apt.doctor?.user?.full_name ? `Dr. ${apt.doctor.user.full_name}` : "Doctor",
    status: apt.status,
    avatarColor: "bg-blue-100 text-blue-600",
    statusColor: apt.status === 'confirmed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
  }));

  const upcomingAppointments = appointmentsList
    .filter((apt: any) => new Date(apt.appointment_time) > new Date())
    .slice(0, 4)
    .map((apt: any) => ({
      time: new Date(apt.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      patient: apt.patient?.user?.full_name || "Unknown",
      type: apt.type,
      icon: <UserCheck className="w-4 h-4" />,
      color: "text-blue-600 bg-blue-50"
    }));

  const quickActions = [
    {
      label: "New Patient",
      icon: <Users className="w-6 h-6" />,
      color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
      description: "Register new patient"
    },
    {
      label: "Schedule",
      icon: <Calendar className="w-6 h-6" />,
      color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
      description: "Create appointment"
    },
    {
      label: "Prescription",
      icon: <Pill className="w-6 h-6" />,
      color: "bg-amber-50 text-amber-600 hover:bg-amber-100",
      description: "Write prescription"
    },
    {
      label: "Lab Order",
      icon: <FileText className="w-6 h-6" />,
      color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
      description: "Order lab tests"
    },
  ];

  if (loading) return <div className="p-10 flex justify-center">Loading dashboard...</div>;

  return (
    <div className="px-6 md:px-10 lg:px-12 py-8 max-w-[1800px] mx-auto">
      {/* Welcome Section with Doctor Info */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, <span className="text-blue-600">{user?.full_name ? `Dr. ${user.full_name}` : "Doctor"}</span>
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Last login: Today at 8:45 AM</span>
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {user?.full_name?.split(' ').map((n: string) => n[0]).join('') || "NB"}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.department || "General Dept."}</p>
              <p className="text-sm text-gray-500">{user?.role === 'doctor' ? 'Senior Consultant' : user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid with Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statsCards.map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${s.color}`}>
                {s.icon}
              </div>
              <div className="flex items-center gap-1">
                {s.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : s.trend === "down" ? (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                ) : null}
                <span className={`text-sm font-medium ${s.trend === "up" ? "text-emerald-600" :
                  s.trend === "down" ? "text-red-500" :
                    "text-gray-400"
                  }`}>
                  {s.delta === "0" ? "No change" : s.delta}
                </span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">{s.value}</p>
            <p className="text-sm text-gray-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        {/* Recent Patients */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <header className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Recent Patients
              </h2>
              <p className="text-sm text-gray-500 mt-1">Today's patient visits</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition">
              View all →
            </button>
          </header>

          <div className="space-y-4">
            {recentPatients.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl ${p.avatarColor} flex items-center justify-center font-semibold`}>
                    {p.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{p.doctor}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs font-medium text-gray-600">{p.time}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${p.statusColor}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Appointments */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <header className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Upcoming Appointments
              </h2>
              <p className="text-sm text-gray-500 mt-1">Next 4 appointments</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition">
              + Schedule
            </button>
          </header>

          <div className="space-y-4">
            {upcomingAppointments.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${a.color}`}>
                    {a.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{a.patient}</p>
                    <p className="text-sm text-gray-500 mt-1">{a.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{a.time}</p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Quick Actions */}
      <section className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Quick Actions
          </h2>
          <p className="text-gray-600">Frequently used tasks for quick access</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {quickActions.map((a, i) => (
            <button
              key={i}
              className={`flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border border-gray-200 hover:scale-[1.02] transition-all duration-300 ${a.color} shadow-sm hover:shadow-md`}
            >
              <div className="p-3 rounded-xl bg-white">
                {a.icon}
              </div>
              <div className="text-center">
                <span className="font-semibold text-gray-900">{a.label}</span>
                <p className="text-xs text-gray-500 mt-2">{a.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Footer Status */}
      <div className="mt-10 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-medium text-gray-900">System Status</span>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
              Operational
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span>Last updated: Today, 10:30 AM</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Patient Records: 1,842</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Appointments Today: 24</span>
          </div>
        </div>
      </div>
    </div>
  );
}