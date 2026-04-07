"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Calendar,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Wallet,
  ShoppingBag,
  ArrowUpRight,
  ChevronRight,
  MoreVertical,
  Zap,
  BarChart3,
  Search,
  Pill
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { dashboard, appointments as appointmentsApi } from "@/services/api";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, appointmentsData] = await Promise.all([
          dashboard.getStats(),
          appointmentsApi.getAll()
        ]);
        setStats(statsData);
        const sorted = (appointmentsData || []).sort((a: any, b: any) =>
          new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime()
        ).slice(0, 5);
        setRecentAppointments(sorted);
      } catch (err) {
        console.error("Failed to fetch admin dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-[#FBFBFE]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 relative">
            <div className="absolute inset-0 rounded-full border-2 border-blue-600/10"></div>
            <div className="absolute inset-0 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-blue-900/40 font-bold uppercase text-[10px] tracking-[0.2em]">Synchronizing Command...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Active Patients",
      value: stats?.active_patients || "0",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "blue",
      accent: "bg-blue-500",
      light: "bg-blue-50",
      text: "text-blue-600"
    },
    {
      title: "Today's Ledger",
      value: stats?.appointments_today || "0",
      change: "+4.2%",
      trend: "up",
      icon: Calendar,
      color: "emerald",
      accent: "bg-emerald-500",
      light: "bg-emerald-50",
      text: "text-emerald-600"
    },
    {
      title: "Ward Capacity",
      value: stats?.available_beds || "0",
      change: "Stable",
      trend: "neutral",
      icon: Activity,
      color: "indigo",
      accent: "bg-indigo-500",
      light: "bg-indigo-50",
      text: "text-indigo-600"
    },
    {
      title: "Lab Backlog",
      value: stats?.pending_labs || "0",
      change: "-2.1%",
      trend: "down",
      icon: AlertCircle,
      color: "rose",
      accent: "bg-rose-500",
      light: "bg-rose-50",
      text: "text-rose-600"
    }
  ];

  const quickActions = [
    { name: "New Patient", icon: Plus, href: "/dashboard/reception/register", color: "bg-blue-600" },
    { name: "Appointments", icon: Calendar, href: "/dashboard/admin/appointments", color: "bg-indigo-600" },
    { name: "User Control", icon: Users, href: "/dashboard/admin/users", color: "bg-violet-600" },
    { name: "Financials", icon: Wallet, href: "/dashboard/billing", color: "bg-emerald-600" },
    { name: "Drugs Control", icon: Pill, href: "/dashboard/pharmacy/inventory", color: "bg-amber-600" },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-8 bg-[#FBFBFE] min-h-screen">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Protocol Active</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Command Center</h1>
          <p className="text-slate-400 font-medium text-sm">Operational overview for <span className="text-slate-900 font-bold underline decoration-blue-500/20 underline-offset-4 caret-transparent">Najbel Medical.</span></p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
            <input
              placeholder="Search Logs..."
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-semibold focus:ring-4 focus:ring-blue-500/5 transition-all w-48 group-hover:w-64"
            />
          </div>
          <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-200 hover:bg-black transition-all flex items-center gap-2 group text-xs uppercase tracking-widest active:scale-95">
            Generate Audit <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
            className="group relative p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`p-3.5 rounded-xl ${stat.light} ${stat.text} shadow-sm group-hover:shadow-lg transition-all`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black ${stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.title}</p>
            </div>
            <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full ${stat.accent} transition-all duration-500 rounded-b-2xl opacity-40`}></div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Activity Ledger */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Activity Ledger</h2>
            </div>
            <Link href="/dashboard/admin/appointments" className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 hover:text-blue-800 flex items-center gap-1.5 group">
              Full Spectrum <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">Descriptor</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">Entity Name</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">Timeline</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">Lifecycle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentAppointments.length > 0 ? (
                    recentAppointments.map((app, i) => (
                      <tr key={i} className="group hover:bg-slate-50/30 transition-all cursor-pointer">
                        <td className="px-8 py-5">
                          <span className="font-black text-slate-900 text-sm tracking-tight group-hover:text-blue-600 transition-colors">#APT-{app.id.toString().padStart(4, '0')}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400 group-hover:rotate-6 transition-transform">
                              {app.patient_name ? app.patient_name[0] : 'U'}
                            </div>
                            <span className="text-sm font-bold text-slate-700">{app.patient_name || `Unit ${app.patient_id}`}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                            <Clock className="w-3.5 h-3.5 text-slate-300" />
                            {new Date(app.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${app.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              app.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-slate-50 text-slate-300 border-slate-100'
                            }`}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-16 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic animate-pulse">Scanning Frequency...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Panel & Pulse */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 px-1 tracking-tight">Direct Access</h2>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, i) => (
                <Link
                  key={i}
                  href={action.href}
                  className="group p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all text-left relative overflow-hidden active:scale-95"
                >
                  <div className={`w-11 h-11 rounded-xl ${action.color} text-white flex items-center justify-center mb-4 shadow-lg group-hover:rotate-12 transition-transform relative z-10`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-black text-slate-900 leading-none mb-1 relative z-10">{action.name}</p>
                  <ArrowRight className="absolute bottom-5 right-5 w-4 h-4 text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                </Link>
              ))}
            </div>
          </div>

          <div className="p-8 bg-slate-900 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400 group-hover:text-amber-400 transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 group-hover:text-amber-400 transition-colors">Core Pulse</span>
                </div>
                <span className="px-2.5 py-1 bg-white/5 border border-white/10 text-white/40 text-[9px] font-black uppercase rounded-lg">Operational</span>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Resource Load", value: "12%", color: "bg-emerald-500", width: "12%" },
                  { label: "API Symmetry", value: "44ms", color: "bg-blue-500", width: "25%" }
                ].map((p, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                      <span>{p.label}</span>
                      <span className="text-white">{p.value}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: p.width }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${p.color} rounded-full`}
                      ></motion.div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full py-3.5 bg-white/5 hover:bg-white text-white hover:text-slate-900 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95">
                Audit Subsystems
              </button>
            </div>
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-500/10 transition-colors duration-1000"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full -ml-16 -mb-16 blur-3xl group-hover:bg-blue-500/10 transition-colors duration-1000"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);
