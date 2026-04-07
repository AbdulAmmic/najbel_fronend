"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Calendar, Phone, Video, ExternalLink, Stethoscope, Loader2 } from "lucide-react";
import { appointments, auth } from "@/services/api";
import LiveChat from "@/components/consultation/LiveChat";
import DoctorConsultationPanel from "@/components/consultation/DoctorConsultationPanel";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://najbelbackend-ammicsystems4174-umj4fvky.leapcell.dev/api/v1";

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") : null; }
function authH() { return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }; }

interface Appointment {
  id: number;
  reason: string;
  type: string;
  appointment_time: string;
  patient: {
    id: number;
    sex?: string;
    date_of_birth?: string;
    user: { full_name: string; email?: string; phone?: string };
  };
}

export default function ConsultationRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [consultation, setConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [apptData, userData] = await Promise.all([
          appointments.getById(Number(id)),
          auth.getMe(),
        ]);
        setAppointment(apptData);
        setCurrentUser(userData);

        // Start / get consultation
        setStarting(true);
        const res = await fetch(`${API_BASE}/consultations/start/${id}`, {
          method: "POST",
          headers: authH(),
        });
        if (res.ok) {
          const data = await res.json();
          setConsultation(data);
        } else if (res.status === 403) {
          // Fee not paid — still load appointment but show warning
          setError("Fee not paid yet. Chat is locked until payment is confirmed.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load consultation room.");
      } finally {
        setLoading(false);
        setStarting(false);
      }
    };
    init();
  }, [id]);

  const handleComplete = () => {
    router.push("/dashboard/consultations");
  };

  if (loading || starting) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 to-indigo-950">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-7 h-7 text-violet-400 animate-pulse" />
          </div>
          <p className="text-white font-semibold">Loading Consultation Room...</p>
          <p className="text-violet-300 text-sm mt-1">Starting session</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500">
        <p className="font-semibold">Appointment not found</p>
        <button onClick={() => router.back()} className="mt-3 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm">Go Back</button>
      </div>
    );
  }

  const patient = appointment.patient;
  const patientAge = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      {/* ── LEFT: Chat + Patient Card ─────────────────────────────────── */}
      <div className="w-full lg:w-[380px] flex flex-col bg-white border-r border-gray-100 shadow-lg z-20 h-[400px] lg:h-auto shrink-0">
        {/* Patient Header */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 p-5 text-white">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-violet-200 hover:text-white text-xs mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Consultations
          </button>

          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl font-black border border-white/10 flex-shrink-0">
              {patient.user.full_name.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">{patient.user.full_name}</h2>
              <p className="text-violet-200 text-xs mt-0.5">
                {patient.sex && <span>{patient.sex}</span>}
                {patientAge && <span> · {patientAge} yrs</span>}
                {patient.user.phone && <span> · {patient.user.phone}</span>}
              </p>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-3 backdrop-blur">
            <p className="text-[10px] text-violet-200 font-bold uppercase tracking-wider mb-1">Chief Complaint</p>
            <p className="text-sm text-white/90 leading-snug">{appointment.reason || "Not specified"}</p>
          </div>

          {/* Meet Link if Available */}
          {consultation?.meet_link && (
            <a
              href={consultation.meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all"
            >
              <Video className="w-4 h-4" />
              Open Google Meet
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {/* Status badge */}
          {consultation && (
            <div className={`mt-2 text-center text-[10px] font-bold px-3 py-1 rounded-full ${
              consultation.status === "active"
                ? "bg-green-500/20 text-green-200"
                : consultation.status === "completed"
                ? "bg-gray-500/20 text-gray-200"
                : "bg-amber-500/20 text-amber-200"
            }`}>
              {consultation.status?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-amber-700 text-xs font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Live Chat */}
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
          <LiveChat
            consultationId={consultation?.consultation_id || Number(id)}
            userName={currentUser?.full_name || "Doctor"}
            userRole="doctor"
          />
        </div>
      </div>

      {/* ── RIGHT: Clinical Panel ────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden h-full">
        {consultation?.consultation_id ? (
          <DoctorConsultationPanel
            consultationId={consultation.consultation_id}
            appointmentReason={appointment.reason}
            meetLink={consultation.meet_link}
            onComplete={handleComplete}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-3">
            <Stethoscope className="w-16 h-16 text-gray-200" />
            <p className="font-semibold text-gray-500">Clinical panel not yet available</p>
            <p className="text-sm">
              {error || "Consultation may still be in DRAFT state (awaiting payment)"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
