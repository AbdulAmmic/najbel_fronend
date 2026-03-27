"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  ArrowRight,
  Activity,
  ClipboardList,
  ChevronRight,
  Wallet,
  Pill,
  TestTubes,
  Heart,
  Thermometer,
  Weight,
  Droplets,
  FileText,
  Receipt,
  TrendingUp,
  CreditCard,
  Plus,
  Shield,
  CheckCircle2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, appointments, medicalRecords, billing, vitals, labs, prescriptions } from "@/services/api";
import Link from "next/link";

export default function PatientDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingAppointment, setUpcomingAppointment] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<any[]>([]);
  const [prescriptionsList, setPrescriptionsList] = useState<any[]>([]);
  const [vitalsData, setVitalsData] = useState<any[]>([]);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    weight: "",
    height: "",
    blood_pressure: "",
    heart_rate: "",
    temperature: "",
    oxygen_saturation: ""
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [userData, appointmentsData, recordsData, walletData, invoicesData, vitalsRes, labsRes, presRes] = await Promise.all([
          auth.getMe().catch(() => null),
          appointments.getAll().catch(() => []),
          medicalRecords.getAll().catch(() => []),
          billing.getWallet().catch(() => null),
          billing.getInvoices().catch(() => []),
          vitals.getAll().catch(() => []),
          labs.getAll().catch(() => []),
          prescriptions.getAll().catch(() => []),
        ]);
        setUser(userData);
        const upcoming = appointmentsData
          .filter((apt: any) => apt.status === "confirmed" || apt.status === "pending")
          .sort((a: any, b: any) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime())[0];
        setUpcomingAppointment(upcoming);
        setRecentActivity(recordsData.slice(0, 3));
        setWallet(walletData);
        setInvoices(invoicesData);
        setVitalsData(vitalsRes);
        setLabResults(labsRes);
        setPrescriptionsList(presRes);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleRecordVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordLoading(true);
    setFeedback(null);
    try {
      await vitals.create({
        weight: vitalsForm.weight ? parseFloat(vitalsForm.weight) : null,
        height: vitalsForm.height ? parseFloat(vitalsForm.height) : null,
        blood_pressure: vitalsForm.blood_pressure || null,
        heart_rate: vitalsForm.heart_rate ? parseInt(vitalsForm.heart_rate) : null,
        temperature: vitalsForm.temperature ? parseFloat(vitalsForm.temperature) : null,
        oxygen_saturation: vitalsForm.oxygen_saturation ? parseInt(vitalsForm.oxygen_saturation) : null,
      });

      // Refresh vitals
      const updatedVitals = await vitals.getAll();
      setVitalsData(updatedVitals);

      setFeedback({ type: 'success', msg: 'Vitals recorded successfully (Self-recorded status)' });
      setTimeout(() => {
        setShowRecordModal(false);
        setFeedback(null);
        setVitalsForm({
          weight: "", height: "", blood_pressure: "", heart_rate: "", temperature: "", oxygen_saturation: ""
        });
      }, 2000);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', msg: 'Failed to record vitals' });
    } finally {
      setRecordLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400 text-sm font-medium animate-pulse">Loading...</p>
    </div>
  );

  const patientName = user?.full_name || "Patient";
  const walletBalance = wallet ? `₦${wallet.balance.toLocaleString()}` : "₦0.00";
  const latestVitals = vitalsData[0] || {};
  const activeMeds = prescriptionsList.filter((p: any) => p.status?.toLowerCase() === "active");

  const invStatus = (s: string) => {
    switch (s?.toLowerCase()) {
      case "paid": return "bg-emerald-500/10 text-emerald-600";
      case "pending": return "bg-amber-500/10 text-amber-600";
      case "overdue": return "bg-red-500/10 text-red-600";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  const labStatus = (s: string) => {
    switch (s?.toLowerCase()) {
      case "normal": return "bg-emerald-500/10 text-emerald-600";
      case "abnormal": return "bg-red-500/10 text-red-600";
      case "pending": return "bg-amber-500/10 text-amber-600";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-8 -mx-1">

      {/* ──── GREETING ──── */}
      {/* <div className="px-1 pt-1">
        <h1 className="text-xl font-bold text-gray-900">
          Hi, {patientName.split(' ')[0]} 
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Your health at a glance</p>
      </div> */}

      {/* ──── WALLET CARD ──── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white mx-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-blue-200 font-medium">Wallet Balance</p>
            <p className="text-2xl font-bold mt-0.5">{walletBalance}</p>
          </div>
          <Link href="/dashboard/patient/wallets" className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition">
            <Wallet className="w-4 h-4" />
          </Link>
        </div>
        <div className="flex gap-2 mt-3">
          <Link href="/dashboard/patient/wallets" className="flex-1 py-2 bg-white/15 rounded-lg text-center text-[11px] font-semibold hover:bg-white/25 transition">
            Top Up
          </Link>
          <Link href="/dashboard/patient/appointments" className="flex-1 py-2 bg-white rounded-lg text-center text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition">
            Book Visit
          </Link>
        </div>
      </div>

      {/* ──── QUICK STATS ──── */}
      <div className="grid grid-cols-4 gap-2 px-1">
        <MiniStat icon={<Calendar className="w-4 h-4" />} label="Visits" value={upcomingAppointment ? "1" : "0"} color="blue" />
        <MiniStat icon={<Pill className="w-4 h-4" />} label="Meds" value={String(activeMeds.length)} color="violet" />
        <MiniStat icon={<TestTubes className="w-4 h-4" />} label="Labs" value={String(labResults.length)} color="emerald" />
        <MiniStat icon={<Receipt className="w-4 h-4" />} label="Bills" value={String(invoices.length)} color="orange" />
      </div>

      {/* ──── QUICK ACTIONS ──── */}
      <div className="grid grid-cols-4 gap-1 px-1">
        {[
          { icon: Calendar, label: "Appts", href: "/dashboard/patient/appointments", c: "text-blue-500 bg-blue-50" },
          { icon: TestTubes, label: "Labs", href: "/dashboard/patient/records/labs", c: "text-emerald-500 bg-emerald-50" },
          { icon: Pill, label: "Rx", href: "/dashboard/patient/records/prescriptions", c: "text-violet-500 bg-violet-50" },
          { icon: CreditCard, label: "Bills", href: "/dashboard/patient/wallets", c: "text-orange-500 bg-orange-50" },
        ].map((a, i) => (
          <Link key={i} href={a.href} className="flex flex-col items-center gap-1.5 py-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.c}`}>
              <a.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold text-gray-600">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* ──── NEXT APPOINTMENT ──── */}
      {upcomingAppointment && (
        <Section title="Upcoming" linkHref="/dashboard/patient/appointments">
          <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm shrink-0">
              {upcomingAppointment.doctor?.user?.full_name?.charAt(0) || "D"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                Dr. {upcomingAppointment.doctor?.user?.full_name || "Specialist"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(upcomingAppointment.appointment_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(upcomingAppointment.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <span className={`px-2 py-1 text-[10px] font-bold rounded-md ${upcomingAppointment.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {upcomingAppointment.status?.toUpperCase()}
            </span>
          </div>
        </Section>
      )}

      {/* ──── VITALS ──── */}
      <Section
        title="Vitals"
        linkHref="/dashboard/patient/vitals"
        onAction={user?.role === "patient" ? () => setShowRecordModal(true) : undefined}
        actionIcon={<Plus className="w-4 h-4" />}
        actionLabel="Record"
      >
        {vitalsData.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 relative">
            {!latestVitals.is_verified && latestVitals.id && (
              <div className="absolute -top-6 right-0 bg-amber-50 text-amber-600 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1 uppercase tracking-tighter">
                <Shield className="w-2.5 h-2.5" /> Self-Recorded
              </div>
            )}
            <VitalTile icon={<Droplets className="w-3.5 h-3.5" />} label="BP" value={latestVitals.blood_pressure || "—"} color="red" />
            <VitalTile icon={<Heart className="w-3.5 h-3.5" />} label="Heart" value={latestVitals.heart_rate ? `${latestVitals.heart_rate}bpm` : "—"} color="pink" />
            <VitalTile icon={<Weight className="w-3.5 h-3.5" />} label="Weight" value={latestVitals.weight ? `${latestVitals.weight}kg` : "—"} color="blue" />
            <VitalTile icon={<Thermometer className="w-3.5 h-3.5" />} label="Temp" value={latestVitals.temperature ? `${latestVitals.temperature}°C` : "—"} color="amber" />
          </div>
        ) : (
          <Empty msg="No vitals recorded yet" />
        )}
      </Section>

      {/* ──── INVOICES ──── */}
      <Section title="Invoices" linkHref="/dashboard/patient/wallets">
        {invoices.length > 0 ? (
          <div className="space-y-1">
            {invoices.slice(0, 4).map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between py-2.5 px-1 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-[13px]">{inv.invoice_number || "Invoice"}</p>
                    <p className="text-[10px] text-gray-400">{new Date(inv.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 text-[13px]">₦{inv.amount?.toLocaleString()}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${invStatus(inv.status)}`}>
                    {(inv.status || "pending").toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty msg="No invoices" />
        )}
      </Section>

      {/* ──── LAB RESULTS ──── */}
      <Section title="Lab Tests" linkHref="/dashboard/patient/records/labs">
        {labResults.length > 0 ? (
          <div className="space-y-1">
            {labResults.slice(0, 4).map((lab: any) => (
              <div key={lab.id} className="flex items-center justify-between py-2.5 px-1 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <TestTubes className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-[13px]">{lab.test_name || "Lab Test"}</p>
                    <p className="text-[10px] text-gray-400">{lab.test_date ? new Date(lab.test_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[12px] text-gray-500 font-medium">{lab.result || "—"}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${labStatus(lab.status)}`}>
                    {(lab.status || "pending").toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty msg="No lab results" />
        )}
      </Section>

      {/* ──── MEDICATIONS ──── */}
      <Section title="Medications" linkHref="/dashboard/patient/records/prescriptions">
        {prescriptionsList.length > 0 ? (
          <div className="space-y-1">
            {prescriptionsList.slice(0, 4).map((rx: any) => (
              <div key={rx.id} className="flex items-center justify-between py-2.5 px-1 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Pill className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-[13px]">{rx.medication || "Medication"}</p>
                    <p className="text-[10px] text-gray-400">{rx.dosage} · {rx.frequency}</p>
                  </div>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${rx.status?.toLowerCase() === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                  {(rx.status || "active").toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Empty msg="No prescriptions" />
        )}
      </Section>

      {/* ──── RECENT ACTIVITY ──── */}
      <Section title="Activity" linkHref="/dashboard/patient/records">
        {recentActivity.length > 0 ? (
          <div className="space-y-0.5">
            {recentActivity.map((record, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2 px-1">
                <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-[13px] truncate">{record.diagnosis || "Medical Exam"}</p>
                  <p className="text-[10px] text-gray-400">{new Date(record.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            ))}
          </div>
        ) : (
          <Empty msg="No activity yet" />
        )}
      </Section>

      {/* ──── HEALTH TIP ──── */}
      <div className="mx-1 bg-amber-50 rounded-xl p-3 flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-amber-800">Health Tip</p>
          <p className="text-[11px] text-amber-700 leading-relaxed mt-0.5">
            Stay hydrated — aim for 8 glasses of water daily to boost energy and support kidney function.
          </p>
        </div>
      </div>

      {/* ──── RECORD VITALS MODAL ──── */}
      <AnimatePresence>
        {
          showRecordModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl relative"
              >
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 sm:hidden" />

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">Record Vitals</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Self-monitor your health</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRecordModal(false)}
                    className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {feedback && (
                  <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Activity className="w-5 h-5 rotate-180" />}
                    <p className="text-xs font-bold uppercase tracking-tight">{feedback.msg}</p>
                  </div>
                )}

                <form onSubmit={handleRecordVitals} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">BP (e.g. 120/80)</label>
                      <input
                        type="text"
                        placeholder="120/80"
                        value={vitalsForm.blood_pressure}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, blood_pressure: e.target.value })}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Heart Rate (bpm)</label>
                      <input
                        type="number"
                        placeholder="72"
                        value={vitalsForm.heart_rate}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, heart_rate: e.target.value })}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="70.5"
                        value={vitalsForm.weight}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Temp (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="36.5"
                        value={vitalsForm.temperature}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold outline-none transition-all"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Oxygen Saturation (%)</label>
                      <input
                        type="number"
                        placeholder="98"
                        value={vitalsForm.oxygen_saturation}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, oxygen_saturation: e.target.value })}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3 mt-2">
                    <Shield className="w-5 h-5 text-blue-600 shrink-0" />
                    <p className="text-[9px] font-bold text-blue-700 leading-relaxed uppercase tracking-tight">
                      Self-recorded vitals are marked as "Unverified" until reviewed by clinic staff. Ensure accuracy for your medical records.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={recordLoading}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2"
                  >
                    {recordLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Confirm & Record Vitals"
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )
        }
      </AnimatePresence >
    </div >
  );
}


/* ──── COMPONENTS ──── */

function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const c: Record<string, string> = {
    blue: "text-blue-500 bg-blue-50",
    violet: "text-violet-500 bg-violet-50",
    emerald: "text-emerald-500 bg-emerald-50",
    orange: "text-orange-500 bg-orange-50",
  };
  return (
    <div className="bg-white rounded-xl p-2.5 border border-gray-100/80 text-center">
      <div className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center mb-1.5 ${c[color]}`}>{icon}</div>
      <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-[9px] font-medium text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function VitalTile({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const c: Record<string, string> = {
    red: "text-red-500 bg-red-50",
    pink: "text-pink-500 bg-pink-50",
    blue: "text-blue-500 bg-blue-50",
    amber: "text-amber-500 bg-amber-50",
  };
  return (
    <div className="bg-white rounded-lg p-2.5 border border-gray-100/60 flex items-center gap-2.5">
      <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${c[color]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, linkHref, children, onAction, actionIcon, actionLabel }: { title: string; linkHref?: string; children: React.ReactNode; onAction?: () => void; actionIcon?: React.ReactNode; actionLabel?: string }) {
  return (
    <div className="bg-white rounded-xl mx-1 p-3 border border-gray-100/80">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-[13px] font-bold text-gray-900">{title}</h3>
        <div className="flex items-center gap-3">
          {onAction && (
            <button
              onClick={onAction}
              className="px-2 py-1.5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm"
            >
              {actionIcon}
              {actionLabel && <span className="text-[10px] font-black uppercase tracking-tight">{actionLabel}</span>}
            </button>
          )}
          {linkHref && (
            <Link href={linkHref} className="text-[11px] text-blue-500 font-semibold flex items-center gap-0.5">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <p className="text-[12px] text-gray-400 text-center py-4">{msg}</p>;
}
