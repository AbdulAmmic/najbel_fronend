"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Video, MessageCircle, X, ExternalLink, AlertTriangle,
  Loader2, ArrowLeft, Maximize2, Minimize2, RefreshCw, Users
} from "lucide-react";
import LiveChat from "@/components/consultation/LiveChat";
import api from "@/services/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://najbelbackend-ammicsystems4174-umj4fvky.leapcell.dev/api/v1";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}
function authH() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

type Panel = "split" | "video" | "chat";

export default function InAppMeetingRoom() {
  const params = useParams();
  const router = useRouter();
  const consultationId = Number(params.id);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [consultation, setConsultation] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [panel, setPanel] = useState<Panel>("split");
  const [iframeKey, setIframeKey] = useState(0); // force reload
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [userRes, consultRes] = await Promise.all([
          api.get("/users/me"),
          fetch(`${API_BASE}/consultations/${consultationId}`, { headers: authH() }),
        ]);
        setCurrentUser(userRes.data);
        if (consultRes.ok) setConsultation(await consultRes.json());
      } catch (e) {
        console.error("Failed to load meeting room", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [consultationId]);

  // Detect iframe block via timeout — Google Meet does block embedding
  useEffect(() => {
    if (!consultation?.meet_link) return;
    const timer = setTimeout(() => setIframeBlocked(true), 4000);
    return () => clearTimeout(timer);
  }, [consultation?.meet_link]);

  const meetLink = consultation?.meet_link;
  const isDoctor = currentUser?.role === "doctor";
  const displayName = isDoctor
    ? `Dr. ${currentUser?.full_name}`
    : currentUser?.full_name || "Patient";

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 to-violet-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Video className="w-7 h-7 text-violet-300" />
          </div>
          <p className="text-white font-semibold">Entering consultation room...</p>
          <p className="text-violet-300 text-sm mt-1">Setting up your session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white font-semibold text-sm">
              Consultation #{consultationId}
            </span>
          </div>
          {consultation?.patient_name && (
            <span className="hidden sm:block text-slate-400 text-xs">
              {isDoctor ? `Patient: ${consultation.patient_name}` : `Dr. ${consultation.doctor_name}`}
            </span>
          )}
        </div>

        {/* Panel Switcher */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-0.5">
          {([
            { id: "video", icon: Maximize2, label: "Video Only" },
            { id: "split", icon: Users, label: "Split" },
            { id: "chat", icon: MessageCircle, label: "Chat Only" },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => { setPanel(id); setChatUnread(0); }}
              title={label}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                panel === id
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:block">{label}</span>
              {id === "chat" && chatUnread > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                  {chatUnread}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {meetLink && (
            <a
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Open externally</span>
            </a>
          )}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Leave</span>
          </button>
        </div>
      </div>

      {/* ── Main Area ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Video Panel */}
        {(panel === "split" || panel === "video") && (
          <div className={`flex flex-col bg-black relative ${
            panel === "split" ? "w-full lg:flex-1" : "w-full"
          }`}>
            {meetLink ? (
              <>
                {/* Iframe — Google Meet embeds but may show a "join in app" screen */}
                <iframe
                  ref={iframeRef}
                  key={iframeKey}
                  src={meetLink}
                  allow="camera; microphone; display-capture; fullscreen; autoplay"
                  className={`w-full h-full border-0 ${iframeBlocked ? "hidden" : "block"}`}
                  onLoad={() => setIframeBlocked(false)}
                  title="Google Meet"
                />

                {/* Fallback card shown if iframe is blocked */}
                {iframeBlocked && (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                    <div className="text-center max-w-sm px-6">
                      <div className="w-20 h-20 rounded-3xl bg-violet-500/20 flex items-center justify-center mx-auto mb-5">
                        <Video className="w-10 h-10 text-violet-400" />
                      </div>
                      <h2 className="text-white text-xl font-bold mb-2">Google Meet Session</h2>
                      <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        Google Meet can&apos;t be embedded in the app (browser security policy).
                        Click below to open it in a new tab — your chat stays open here.
                      </p>
                      <div className="flex flex-col gap-3">
                        <a
                          href={meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-violet-900/50"
                        >
                          <Video className="w-5 h-5" />
                          Join Google Meet
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => { setIframeBlocked(false); setIframeKey(k => k + 1); }}
                          className="flex items-center justify-center gap-2 text-slate-400 hover:text-white text-sm py-2 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" /> Try embedding again
                        </button>
                      </div>
                      <div className="mt-5 p-3 bg-slate-700/50 rounded-xl text-xs text-slate-400 font-mono break-all">
                        {meetLink}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* No meeting link set yet */
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                <div className="text-center max-w-xs px-6">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-amber-400" />
                  </div>
                  <h2 className="text-white font-bold text-lg mb-2">No Meeting Link Yet</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {isDoctor
                      ? "Paste a Google Meet link in the consultation panel to start the video session."
                      : "Waiting for your doctor to set up the meeting link. You'll be notified when it's ready."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        {panel === "split" && (
          <div className="hidden lg:block w-0.5 bg-slate-800 flex-shrink-0" />
        )}

        {/* Chat Panel */}
        {(panel === "split" || panel === "chat") && (
          <div className={`flex flex-col bg-white ${
            panel === "split" ? "hidden lg:flex lg:w-[360px] xl:w-[400px]" : "w-full"
          } flex-shrink-0`}>
            {/* Chat Header */}
            <div className="bg-violet-600 px-4 py-3 flex items-center gap-2 flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-sm">Live Chat</span>
              <span className="ml-auto text-violet-200 text-xs">{displayName}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <LiveChat
                consultationId={consultationId}
                userName={displayName}
                userRole={isDoctor ? "doctor" : "patient"}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile: show chat below video in split mode */}
      {panel === "split" && (
        <div className="lg:hidden h-48 flex-shrink-0 border-t border-slate-800 bg-white">
          <div className="bg-violet-600 px-4 py-2 flex items-center gap-2">
            <MessageCircle className="w-3.5 h-3.5 text-white" />
            <span className="text-white font-semibold text-xs">Live Chat</span>
          </div>
          <div className="h-full overflow-hidden">
            <LiveChat
              consultationId={consultationId}
              userName={displayName}
              userRole={isDoctor ? "doctor" : "patient"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
