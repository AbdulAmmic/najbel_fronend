"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, Calendar, Clock, FlaskConical, Pill,
  Activity, ChevronRight, Play, CheckCircle2,
  Video, Stethoscope, MessageCircle, ArrowUpRight,
  AlertCircle, Bed, Plus
} from "lucide-react";
import {
  auth, appointments, labs, prescriptions, beds, chat, patientService
} from "@/services/api";

const fmtT = (d: string) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const init = (n: string) =>
  n?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";

const STATUS_PILL: Record<string, string> = {
  confirmed:   "bg-emerald-100 text-emerald-700",
  pending:     "bg-amber-100 text-amber-700",
  cancelled:   "bg-red-100 text-red-600",
  rescheduled: "bg-sky-100 text-sky-700",
  "checked-in":"bg-blue-100 text-blue-700",
  completed:   "bg-gray-100 text-gray-500",
};

export default function DoctorDashboard() {
  const router = useRouter();
  const [user, setUser]               = useState<any>(null);
  const [appts, setAppts]             = useState<any[]>([]);
  const [patients, setPatients]       = useState<any[]>([]);
  const [labResults, setLabResults]   = useState<any[]>([]);
  const [rxList, setRxList]           = useState<any[]>([]);
  const [bedsList, setBedsList]       = useState<any[]>([]);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [me, pt, ap, lb, rx, bd, rooms] = await Promise.all([
          auth.getMe(),
          patientService.getAll().catch(() => []),
          appointments.getAll().catch(() => []),
          labs.getAll().catch(() => []),
          prescriptions.getAll().catch(() => []),
          beds.getAll().catch(() => []),
          chat.getActiveRooms().catch(() => []),
        ]);
        setUser(me);
        setPatients(Array.isArray(pt) ? pt : []);
        setAppts((Array.isArray(ap) ? ap : []).sort((a: any, b: any) =>
          new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()
        ));
        setLabResults(Array.isArray(lb) ? lb.slice(0, 20) : []);
        setRxList(Array.isArray(rx) ? rx : []);
        setBedsList(Array.isArray(bd) ? bd : []);
        setActiveRooms(Array.isArray(rooms) ? rooms : []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
    const iv = setInterval(async () => {
      try { setActiveRooms(await chat.getActiveRooms()); } catch {}
    }, 10_000);
    return () => clearInterval(iv);
  }, []);

  const today      = new Date().toISOString().split("T")[0];
  const todayAppts = appts.filter(a => a.appointment_time?.startsWith(today));
  const waiting    = appts.filter(a =>
    ["confirmed", "checked-in"].includes(a.status?.toLowerCase()));
  const pendingLabs = labResults.filter(l => !["completed","validated"].includes(l.status));
  const readyLabs   = labResults.filter(l => l.status === "validated");
  const activeRx    = rxList.filter(r => r.status === "active");
  const freeBeds    = bedsList.filter(b => b.status === "available").length;

  const acceptAppt = async (id: number) => {
    try {
      await appointments.updateStatus(id, "confirmed");
      setAppts(prev => prev.map(a => a.id === id ? { ...a, status: "confirmed" } : a));
    } catch {}
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-200 animate-pulse">
          <Stethoscope className="w-6 h-6 text-white" />
        </div>
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-28">

      {/* ── Hero Greeting Card ─────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-5 pt-8 pb-24 relative overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute top-16 -right-6 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <p className="text-blue-200 text-sm font-semibold mb-1">{greeting} 👋</p>
          <h1 className="text-2xl font-black text-white leading-tight">
            Dr. {user?.full_name?.split(" ").slice(1).join(" ") || user?.full_name || "Doctor"}
          </h1>
          <p className="text-blue-200 text-xs mt-1 font-medium">
            {new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
          </p>

          {/* Live indicator */}
          {activeRooms.length > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white text-xs font-bold">{activeRooms.length} active session{activeRooms.length > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Content card (overlaps hero) ───────────────────────── */}
      <div className="px-4 -mt-16 relative z-10 space-y-4">

        {/* KPI pills */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Patients",    value: patients.length,    color: "bg-blue-600",   icon: Users },
            { label: "Waiting",     value: waiting.length,     color: "bg-amber-500",  icon: Clock },
            { label: "Pending Labs",value: pendingLabs.length, color: "bg-violet-600", icon: FlaskConical },
            { label: "Free Beds",   value: freeBeds,           color: "bg-emerald-600",icon: Bed },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col items-center gap-1">
              <div className={`w-8 h-8 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-lg font-black text-slate-900 leading-none">{value}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide text-center leading-tight">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Appointments",  href: "/dashboard/Doctor/appointments",  icon: Calendar,     color: "from-blue-500 to-blue-700" },
            { label: "My Patients",   href: "/dashboard/Doctor/patients",       icon: Users,        color: "from-indigo-500 to-indigo-700" },
            { label: "Prescriptions", href: "/dashboard/Doctor/prescriptions",  icon: Pill,         color: "from-violet-500 to-purple-700"  },
            { label: "Message Hub",   href: "/dashboard/Doctor/chat",           icon: MessageCircle,color: "from-emerald-500 to-teal-700" },
          ].map(({ label, href, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className={`bg-gradient-to-br ${color} rounded-2xl p-4 flex items-center gap-3 shadow-md active:scale-95 transition-transform`}
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-sm">{label}</span>
            </Link>
          ))}
        </div>

        {/* Active Sessions */}
        {activeRooms.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <h2 className="font-bold text-slate-900 text-sm">Active Sessions</h2>
              </div>
              <Link href="/dashboard/Doctor/chat" className="text-xs text-blue-600 font-semibold">View all</Link>
            </div>
            <div className="divide-y divide-slate-50">
              {activeRooms.slice(0, 3).map((room, i) => (
                <button
                  key={i}
                  onClick={() => router.push(`/dashboard/consultations/${room.consultation_id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50/60 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0">
                    {init(room.patient_name || "P")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">{room.patient_name}</p>
                    <p className="text-xs text-emerald-600 font-semibold">Live consultation</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Play className="w-3 h-3" /> Enter
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Today's Appointments */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <h2 className="font-bold text-slate-900 text-sm">Today's Appointments</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {todayAppts.length}
              </span>
              <Link href="/dashboard/Doctor/appointments" className="text-xs text-slate-400 font-semibold">All</Link>
            </div>
          </div>

          {todayAppts.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3 text-slate-300">
              <Calendar className="w-10 h-10" />
              <p className="text-sm text-slate-400 font-medium">No appointments today</p>
              <Link href="/dashboard/Doctor/appointments" className="text-xs text-blue-600 font-bold">
                View full schedule →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {todayAppts.slice(0, 6).map((a, i) => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50/60 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-sm font-black text-blue-700 shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">
                      {a.patient?.user?.full_name || "Patient"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-300" />
                      <span className="text-[11px] text-slate-400 font-medium">{fmtT(a.appointment_time)}</span>
                      {a.type === "online" && <Video className="w-3 h-3 text-blue-400" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full capitalize ${
                      STATUS_PILL[a.status?.toLowerCase()] || "bg-slate-100 text-slate-500"
                    }`}>
                      {a.status}
                    </span>
                    {a.status === "pending" && (
                      <button
                        onClick={() => acceptAppt(a.id)}
                        className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-100 active:scale-90 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {["confirmed","checked-in"].includes(a.status?.toLowerCase()) && (
                      <button
                        onClick={() => router.push(`/dashboard/consultations/${a.id}`)}
                        className="w-7 h-7 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-700 active:scale-90 transition-all"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {todayAppts.length > 6 && (
                <Link
                  href="/dashboard/Doctor/appointments"
                  className="flex items-center justify-center gap-1.5 py-3 text-xs text-blue-600 font-bold hover:bg-blue-50/30 transition-colors"
                >
                  See {todayAppts.length - 6} more <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Lab Results */}
        {(readyLabs.length > 0 || pendingLabs.length > 0) && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-violet-500" />
                <h2 className="font-bold text-slate-900 text-sm">Lab Results</h2>
              </div>
              <Link href="/dashboard/laboratory/results" className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Summary pills */}
            <div className="flex gap-2 px-4 py-3 border-b border-slate-50">
              {readyLabs.length > 0 && (
                <div className="flex-1 flex items-center gap-2 bg-violet-50 rounded-xl px-3 py-2.5">
                  <CheckCircle2 className="w-4 h-4 text-violet-600 shrink-0" />
                  <div>
                    <p className="text-base font-black text-violet-700">{readyLabs.length}</p>
                    <p className="text-[9px] font-bold text-violet-500 uppercase">Ready to review</p>
                  </div>
                </div>
              )}
              {pendingLabs.length > 0 && (
                <div className="flex-1 flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-base font-black text-amber-700">{pendingLabs.length}</p>
                    <p className="text-[9px] font-bold text-amber-500 uppercase">In progress</p>
                  </div>
                </div>
              )}
            </div>

            <div className="divide-y divide-slate-50">
              {readyLabs.slice(0, 4).map(l => {
                const patient = patients.find(p => p.id === l.patient_id);
                const name = patient?.user?.full_name || `Patient #${l.patient_id}`;
                return (
                  <div key={l.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center shrink-0 relative">
                      <FlaskConical className="w-4 h-4 text-violet-600" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{l.test_name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{name}</p>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full shrink-0">
                      Ready
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Prescriptions count */}
        {activeRx.length > 0 && (
          <Link
            href="/dashboard/Doctor/prescriptions"
            className="flex items-center gap-4 bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-4 active:scale-95 transition-transform"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900 text-sm">{activeRx.length} Active Prescription{activeRx.length > 1 ? "s" : ""}</p>
              <p className="text-xs text-slate-400 mt-0.5">Tap to manage</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </Link>
        )}

      </div>
    </div>
  );
}
