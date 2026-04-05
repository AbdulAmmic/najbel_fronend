"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MessageSquare, Loader2, ArrowLeft, Users, Clock, Send, Play, Pause, Check, CheckCheck, Phone } from "lucide-react";
import api, { auth, getWsBaseUrl } from "@/services/api";

// ─── Types ───────────────────────────────────────────────

interface Patient {
    patient_id: number;
    patient_name: string;
    last_message?: string | null;
    last_timestamp?: string | null;
}

interface Message {
    id: number | string;
    sender: string;
    text: string;
    audioUrl?: string;
    imageUrl?: string;
    time: string;
    isMe: boolean;
    sender_role?: string;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
}

// ─── Helpers ──────────────────────────────────────────────

const CACHE_KEY = (pid: number) => `chat_history_p${pid}`;

const getCached = (pid: number): Message[] => {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY(pid));
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
};

const setCache = (pid: number, msgs: Message[]) => {
    try { sessionStorage.setItem(CACHE_KEY(pid), JSON.stringify(msgs)); } catch { }
};

const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return fmt(iso);
    return d.toLocaleDateString([], { day: "2-digit", month: "short" });
};

const initials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

const avatarColor = (name: string) => {
    const colors = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777"];
    return colors[name.charCodeAt(0) % colors.length];
};

// ─── Mini Audio Player ────────────────────────────────────

const AudioPlayer = ({ url, isMe }: { url: string; isMe: boolean }) => {
    const [playing, setPlaying] = useState(false);
    const ref = useRef<HTMLAudioElement>(null);
    const toggle = () => {
        if (!ref.current) return;
        if (playing) ref.current.pause(); else ref.current.play();
        setPlaying(!playing);
    };
    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl ${isMe ? "bg-indigo-500 text-white" : "bg-white border text-gray-800"}`}>
            <audio ref={ref} src={url} onEnded={() => setPlaying(false)} className="hidden" />
            <button onClick={toggle} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center flex-shrink-0">
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div className="flex-1 h-1 rounded-full bg-white/30">
                <div className="h-full w-1/3 rounded-full bg-white/60" />
            </div>
            <span className="text-xs opacity-70">Voice</span>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────

export default function DoctorChat() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selected, setSelected] = useState<Patient | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [histLoading, setHistLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [me, setMe] = useState<any>(null);
    const [showChat, setShowChat] = useState(false); // mobile: show chat panel

    const wsRef = useRef<WebSocket | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const reconnectRef = useRef<NodeJS.Timeout | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(false);

    // ── Boot ─────────────────────────────────────────────

    useEffect(() => {
        mountedRef.current = true;
        const init = async () => {
            try {
                const [meData, patientList] = await Promise.all([
                    auth.getMe(),
                    api.get("chat/patients/list").then(r => r.data)
                ]);
                if (mountedRef.current) {
                    setMe(meData);
                    setPatients(patientList);
                }
            } catch (e) { console.error("Boot error", e); }
            finally { if (mountedRef.current) setLoading(false); }
        };
        init();
        return () => { mountedRef.current = false; };
    }, []);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ── Load history for selected patient ─────────────────

    const loadHistory = useCallback(async (patientId: number) => {
        // 1. Show cached immediately (instant)
        const cached = getCached(patientId);
        if (cached.length > 0) setMessages(cached);
        setHistLoading(cached.length === 0);

        // 2. Fetch fresh from server
        try {
            const res = await api.get(`chat/patient/${patientId}/history`);
            const fresh: Message[] = res.data.map((m: any) => ({
                id: m.id,
                sender: m.sender_name,
                text: m.message || "",
                audioUrl: m.audio_url || undefined,
                imageUrl: m.image_url || undefined,
                time: fmt(m.created_at),
                isMe: m.sender_role === "doctor" || m.sender_role === "admin",
                sender_role: m.sender_role,
                status: "read" as const
            }));
            if (mountedRef.current) {
                setMessages(prev => {
                    // merge: preserve optimistic sent messages not yet in DB
                    const dbIds = new Set(fresh.map(f => f.id));
                    const pending = prev.filter(m => typeof m.id === "string" && !dbIds.has(m.id));
                    const merged = [...fresh, ...pending];
                    setCache(patientId, fresh); // cache only confirmed messages
                    return merged;
                });
            }
        } catch (e) { console.error("History fetch failed", e); }
        finally { if (mountedRef.current) setHistLoading(false); }
    }, []);

    // ── Select patient ─────────────────────────────────────

    const selectPatient = useCallback((patient: Patient) => {
        // Close previous WS
        if (reconnectRef.current) clearTimeout(reconnectRef.current);
        if (pollRef.current) clearInterval(pollRef.current);
        if (wsRef.current) try { wsRef.current.close(); } catch { }
        wsRef.current = null;

        setSelected(patient);
        setMessages([]); // reset
        setShowChat(true);
        loadHistory(patient.patient_id);
        connectWS(patient.patient_id);
    }, [loadHistory]);

    // ── WebSocket ──────────────────────────────────────────

    const connectWS = useCallback((patientId: number) => {
        if (!mountedRef.current) return;
        const wsBase = getWsBaseUrl();
        const token = localStorage.getItem("token") || "";
        const url = `${wsBase}/ws/patient/${patientId}?role=doctor&token=${token}`;
        console.log(`[WS] Connecting doctor → patient ${patientId}`);

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onmessage = (e) => {
            if (!mountedRef.current) return;
            try {
                const data = JSON.parse(e.data);
                if (data.text || data.audioUrl || data.imageUrl) {
                    setMessages(prev => {
                        if (data.id && prev.some(m => m.id === data.id)) return prev;
                        return [...prev, {
                            id: data.id || Date.now(),
                            sender: data.senderName || "Patient",
                            text: data.text || "",
                            audioUrl: data.audioUrl,
                            imageUrl: data.imageUrl,
                            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                            isMe: data.senderRole === "doctor" || data.senderRole === "admin",
                            status: "read"
                        }];
                    });
                }
            } catch { }
        };

        ws.onclose = () => {
            if (!mountedRef.current) return;
            // Sync every 3s while disconnected
            pollRef.current = setInterval(() => {
                if (mountedRef.current) loadHistory(patientId);
            }, 3000);
            // Reconnect after 4s
            reconnectRef.current = setTimeout(() => {
                if (pollRef.current) clearInterval(pollRef.current);
                connectWS(patientId);
            }, 4000);
        };

        ws.onerror = () => ws.close();
    }, [loadHistory]);

    // ── Send message ───────────────────────────────────────

    const sendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || !selected || sending) return;

        const tempId = `temp-${Date.now()}`;
        const tempMsg: Message = {
            id: tempId,
            sender: me?.full_name || "Doctor",
            text: trimmed,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isMe: true,
            status: "sending"
        };

        setMessages(prev => [...prev, tempMsg]);
        setText("");
        setSending(true);

        // STEP 1: REST (guaranteed DB save)
        try {
            const res = await api.post(`chat/patient/${selected.patient_id}/send`, {
                message: trimmed,
                sender_name: me?.full_name || "Doctor",
                sender_role: "doctor"
            });
            const savedId = res.data?.id;
            setMessages(prev => prev.map(m =>
                m.id === tempId ? { ...m, id: savedId || tempId, status: "sent" } : m
            ));

            // Update patient list preview
            setPatients(prev => prev.map(p =>
                p.patient_id === selected.patient_id
                    ? { ...p, last_message: trimmed, last_timestamp: new Date().toISOString() }
                    : p
            ));

            // STEP 2: WS broadcast for real-time delivery
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    text: trimmed,
                    senderName: me?.full_name || "Doctor",
                    senderRole: "doctor",
                    type: "message"
                }));
            }
        } catch (err) {
            console.error("Send failed:", err);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: "sent" } : m));
        } finally {
            setSending(false);
        }
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // ── Filtered patients ──────────────────────────────────

    const filtered = patients.filter(p =>
        p.patient_name.toLowerCase().includes(search.toLowerCase())
    );

    // ─── Render ────────────────────────────────────────────

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden">

            {/* ── Sidebar: Patient List ────────────────── */}
            <div className={`
                flex flex-col bg-white border-r border-gray-100 shadow-sm
                w-full md:w-80 lg:w-96 flex-shrink-0
                ${showChat ? "hidden md:flex" : "flex"}
                transition-all duration-300
            `}>
                {/* Header */}
                <div className="px-5 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 leading-tight">Clinical Chat</h1>
                            <p className="text-xs text-gray-400">Patient Messenger</p>
                        </div>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search patients..."
                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                        />
                    </div>
                </div>

                {/* Patient list */}
                <div className="flex-1 overflow-y-auto py-2">
                    {loading ? (
                        <div className="flex items-center justify-center h-32 gap-2 text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">Loading patients...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                            <Users className="w-8 h-8 mb-2 opacity-40" />
                            <p className="text-sm">No patients found</p>
                        </div>
                    ) : (
                        filtered.map(p => {
                            const isActive = selected?.patient_id === p.patient_id;
                            return (
                                <button
                                    key={p.patient_id}
                                    onClick={() => selectPatient(p)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-gray-50 ${isActive ? "bg-indigo-50 border-r-2 border-indigo-600" : ""}`}
                                >
                                    {/* Avatar */}
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                                        style={{ background: avatarColor(p.patient_name) }}
                                    >
                                        {initials(p.patient_name)}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className={`font-semibold text-sm truncate ${isActive ? "text-indigo-700" : "text-gray-900"}`}>
                                                {p.patient_name}
                                            </span>
                                            {p.last_timestamp && (
                                                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                                    {fmtDate(p.last_timestamp)}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 truncate">
                                            {p.last_message || "No messages yet"}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Chat Panel ───────────────────────────────── */}
            <div className={`
                flex flex-col flex-1 min-w-0
                ${!showChat ? "hidden md:flex" : "flex"}
            `}>
                {!selected ? (
                    /* Empty state */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-4 shadow-inner">
                            <MessageSquare className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Select a Patient</h2>
                        <p className="text-sm text-gray-400 max-w-xs">
                            Choose a patient from the list to start chatting. Messages are saved in real-time.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div className="flex items-center gap-4 px-5 py-4 bg-white border-b border-gray-100 shadow-sm">
                            <button
                                onClick={() => setShowChat(false)}
                                className="md:hidden w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                                style={{ background: avatarColor(selected.patient_name) }}
                            >
                                {initials(selected.patient_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-bold text-gray-900 leading-tight truncate">{selected.patient_name}</h2>
                                <p className="text-xs text-green-500 font-medium">● Active Patient</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                                    <Phone className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gray-50/80">
                            {histLoading ? (
                                <div className="flex items-center justify-center h-24 gap-2 text-gray-400">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-sm">Loading messages...</span>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                                    <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                                    <p className="text-sm">No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <div key={`${msg.id}-${i}`} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
                                        {!msg.isMe && (
                                            <div
                                                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end"
                                                style={{ background: avatarColor(msg.sender) }}
                                            >
                                                {initials(msg.sender)}
                                            </div>
                                        )}
                                        <div className={`max-w-[72%] ${msg.isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                                            {!msg.isMe && (
                                                <span className="text-xs text-gray-400 px-1">{msg.sender}</span>
                                            )}
                                            <div className={`px-4 py-2.5 rounded-2xl leading-relaxed text-sm shadow-sm ${
                                                msg.isMe
                                                    ? "bg-indigo-600 text-white rounded-br-sm"
                                                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                                            }`}>
                                                {msg.audioUrl ? (
                                                    <AudioPlayer url={msg.audioUrl} isMe={msg.isMe} />
                                                ) : msg.imageUrl ? (
                                                    <img src={msg.imageUrl} className="max-w-[200px] rounded-xl" alt="img" />
                                                ) : (
                                                    msg.text
                                                )}
                                            </div>
                                            <div className={`flex items-center gap-1 px-1 ${msg.isMe ? "justify-end" : "justify-start"}`}>
                                                <span className="text-[10px] text-gray-400">{msg.time}</span>
                                                {msg.isMe && (
                                                    <span className="text-[10px]">
                                                        {msg.status === "sending" ? <Clock className="w-2.5 h-2.5 text-gray-300 inline" /> :
                                                         msg.status === "sent" ? <Check className="w-2.5 h-2.5 text-gray-400 inline" /> :
                                                         <CheckCheck className="w-2.5 h-2.5 text-indigo-400 inline" />}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <div className="bg-white border-t border-gray-100 px-4 py-3">
                            <form onSubmit={sendMessage} className="flex items-end gap-3">
                                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
                                    <textarea
                                        value={text}
                                        onChange={e => setText(e.target.value)}
                                        onKeyDown={handleKey}
                                        placeholder="Type a message..."
                                        rows={1}
                                        className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none leading-relaxed max-h-32"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!text.trim() || sending}
                                    className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all shadow-sm active:scale-95"
                                >
                                    {sending
                                        ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                                        : <Send className="w-4 h-4 text-white" />
                                    }
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
