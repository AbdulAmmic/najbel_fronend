"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Search, MessageSquare, Loader2, ArrowLeft,
    Users, Clock, Send, Play, Pause, Check, CheckCheck,
    Phone, Wifi, WifiOff
} from "lucide-react";
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
    try { const raw = sessionStorage.getItem(CACHE_KEY(pid)); return raw ? JSON.parse(raw) : []; } catch { return []; }
};
const setCache = (pid: number, msgs: Message[]) => {
    try { sessionStorage.setItem(CACHE_KEY(pid), JSON.stringify(msgs)); } catch { }
};

const fmt = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return fmt(iso);
    return d.toLocaleDateString([], { day: "2-digit", month: "short" });
};

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

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
    const [wsOnline, setWsOnline] = useState(false);
    const [showChat, setShowChat] = useState(false); // mobile: show chat panel

    const wsRef = useRef<WebSocket | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const reconnectRef = useRef<NodeJS.Timeout | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(false);

    // ── Boot ────────────────────────────────────────────

    useEffect(() => {
        mountedRef.current = true;
        const init = async () => {
            try {
                const [meData, patientList] = await Promise.all([
                    auth.getMe(),
                    api.get("chat/patients/list").then(r => r.data)
                ]);
                if (mountedRef.current) { setMe(meData); setPatients(patientList); }
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

    // Auto-resize textarea
    const adjustTextarea = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 120) + "px";
    };

    // ── Load history ────────────────────────────────────

    const loadHistory = useCallback(async (patientId: number) => {
        const cached = getCached(patientId);
        if (cached.length > 0) setMessages(cached);
        setHistLoading(cached.length === 0);
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
                    const dbIds = new Set(fresh.map(f => f.id));
                    const pending = prev.filter(m => typeof m.id === "string" && !dbIds.has(m.id));
                    const merged = [...fresh, ...pending];
                    setCache(patientId, fresh);
                    return merged;
                });
            }
        } catch (e) { console.error("History fetch failed", e); }
        finally { if (mountedRef.current) setHistLoading(false); }
    }, []);

    // ── Select patient ──────────────────────────────────

    const selectPatient = useCallback((patient: Patient) => {
        if (reconnectRef.current) clearTimeout(reconnectRef.current);
        if (pollRef.current) clearInterval(pollRef.current);
        if (wsRef.current) try { wsRef.current.close(); } catch { }
        wsRef.current = null;
        setWsOnline(false);
        setSelected(patient);
        setMessages([]);
        setShowChat(true);
        loadHistory(patient.patient_id);
        connectWS(patient.patient_id);
    }, [loadHistory]);

    // ── WebSocket ────────────────────────────────────────

    const connectWS = useCallback((patientId: number) => {
        if (!mountedRef.current) return;
        const wsBase = getWsBaseUrl();
        const token = localStorage.getItem("token") || "";
        const ws = new WebSocket(`${wsBase}/ws/patient/${patientId}?role=doctor&token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => { if (mountedRef.current) setWsOnline(true); };
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
            setWsOnline(false);
            pollRef.current = setInterval(() => { if (mountedRef.current) loadHistory(patientId); }, 3000);
            reconnectRef.current = setTimeout(() => {
                if (pollRef.current) clearInterval(pollRef.current);
                connectWS(patientId);
            }, 4000);
        };
        ws.onerror = () => ws.close();
    }, [loadHistory]);

    // ── Send message ─────────────────────────────────────

    const sendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || !selected || sending) return;
        const tempId = `temp-${Date.now()}`;
        const tempMsg: Message = {
            id: tempId, sender: me?.full_name || "Doctor", text: trimmed,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isMe: true, status: "sending"
        };
        setMessages(prev => [...prev, tempMsg]);
        setText("");
        if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
        setSending(true);
        try {
            const res = await api.post(`chat/patient/${selected.patient_id}/send`, {
                message: trimmed, sender_name: me?.full_name || "Doctor", sender_role: "doctor"
            });
            const savedId = res.data?.id;
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: savedId || tempId, status: "sent" } : m));
            setPatients(prev => prev.map(p =>
                p.patient_id === selected.patient_id
                    ? { ...p, last_message: trimmed, last_timestamp: new Date().toISOString() }
                    : p
            ));
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ text: trimmed, senderName: me?.full_name || "Doctor", senderRole: "doctor", type: "message" }));
            }
        } catch (err) {
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: "sent" } : m));
        } finally { setSending(false); }
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const filtered = patients.filter(p => p.patient_name.toLowerCase().includes(search.toLowerCase()));

    // ─── Render ────────────────────────────────────────────
    // Layout:
    // - Header: fixed, ~58px (set by DoctorHeader)
    // - BottomNav: fixed bottom-4, pill ~72px visible + 16px gap = 88px from bottom on mobile
    // - So on mobile: h = 100dvh - header - bottomnav = 100dvh - 58px - 88px
    // - On md+: h = 100dvh - header = 100dvh - 58px (no bottom nav)

    return (
        <div
            className="flex overflow-hidden bg-gray-50"
            style={{
                height: "calc(100dvh - 58px)",        // subtract header
                paddingBottom: "env(safe-area-inset-bottom)"
            }}
        >
            {/* ── Sidebar ──────────────────────────────────────── */}
            <div className={`
                flex flex-col bg-white border-r border-gray-100
                w-full md:w-80 lg:w-96 flex-shrink-0
                ${showChat ? "hidden md:flex" : "flex"}
            `}>
                {/* Sidebar header */}
                <div className="px-4 pt-5 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
                            <MessageSquare className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-[15px] font-black text-gray-900 leading-tight">Clinical Chat</h1>
                            <p className="text-[10px] text-gray-400 font-medium">Patient Messenger</p>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search patients..."
                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                        />
                    </div>
                </div>

                {/* Patient list — scrollable, reserve space for bottom nav on mobile */}
                <div className="flex-1 overflow-y-auto pb-[88px] md:pb-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-32 gap-2 text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">Loading...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                            <Users className="w-8 h-8 mb-2 opacity-30" />
                            <p className="text-sm">No patients found</p>
                        </div>
                    ) : (
                        <div className="py-2 space-y-0.5">
                            {filtered.map(p => {
                                const isActive = selected?.patient_id === p.patient_id;
                                return (
                                    <button
                                        key={p.patient_id}
                                        onClick={() => selectPatient(p)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all active:scale-[0.98] ${isActive
                                            ? "bg-indigo-50 border-r-[3px] border-indigo-600"
                                            : "hover:bg-gray-50/80"
                                        }`}
                                    >
                                        <div
                                            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                                            style={{ background: avatarColor(p.patient_name) }}
                                        >
                                            {initials(p.patient_name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className={`font-bold text-[13px] truncate ${isActive ? "text-indigo-700" : "text-gray-900"}`}>
                                                    {p.patient_name}
                                                </span>
                                                {p.last_timestamp && (
                                                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{fmtDate(p.last_timestamp)}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 truncate leading-relaxed">
                                                {p.last_message || "No messages yet"}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Chat Panel ────────────────────────────────────── */}
            <div className={`flex flex-col flex-1 min-w-0 ${!showChat ? "hidden md:flex" : "flex"}`}>
                {!selected ? (
                    /* Empty state */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 pb-[88px] md:pb-8">
                        <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-4">
                            <MessageSquare className="w-10 h-10 text-indigo-300" />
                        </div>
                        <h2 className="text-lg font-black text-gray-800 mb-2">Select a Patient</h2>
                        <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                            Choose a patient from the list to start a clinical conversation.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
                            <button
                                onClick={() => setShowChat(false)}
                                className="md:hidden w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors active:scale-95"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div
                                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                                style={{ background: avatarColor(selected.patient_name) }}
                            >
                                {initials(selected.patient_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-black text-[14px] text-gray-900 leading-tight truncate">{selected.patient_name}</h2>
                                <div className="flex items-center gap-1.5">
                                    {wsOnline
                                        ? <><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[10px] text-emerald-600 font-bold">Connected</span></>
                                        : <><WifiOff className="w-2.5 h-2.5 text-gray-400" /><span className="text-[10px] text-gray-400">Reconnecting...</span></>
                                    }
                                </div>
                            </div>
                            <button className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                                <Phone className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages — takes all remaining space between header and input */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-[#F0F4FF]/60">
                            {histLoading ? (
                                <div className="flex items-center justify-center h-24 gap-2 text-gray-400">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-sm">Loading messages...</span>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-gray-400">
                                    <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                                    <p className="text-sm">No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <div key={`${msg.id}-${i}`} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
                                        {!msg.isMe && (
                                            <div
                                                className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-[10px] font-bold mr-1.5 flex-shrink-0 self-end mb-1"
                                                style={{ background: avatarColor(msg.sender) }}
                                            >
                                                {initials(msg.sender)}
                                            </div>
                                        )}
                                        <div className={`max-w-[75%] flex flex-col gap-0.5 ${msg.isMe ? "items-end" : "items-start"}`}>
                                            {!msg.isMe && (
                                                <span className="text-[10px] text-gray-400 px-1">{msg.sender}</span>
                                            )}
                                            <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                                msg.isMe
                                                    ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-sm"
                                                    : "bg-white text-gray-800 border border-gray-100/80 rounded-bl-sm shadow-xs"
                                            } ${msg.status === "sending" ? "opacity-70" : ""}`}>
                                                {msg.audioUrl ? (
                                                    <AudioPlayer url={msg.audioUrl} isMe={msg.isMe} />
                                                ) : msg.imageUrl ? (
                                                    <img src={msg.imageUrl} className="max-w-[200px] rounded-xl" alt="img" />
                                                ) : msg.text}
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

                        {/* Input bar — FIXED at bottom, respects bottom nav height on mobile */}
                        <div className="bg-white border-t border-gray-100 flex-shrink-0
                                        pb-[env(safe-area-inset-bottom)]
                                        mb-[88px] md:mb-0">
                            <form onSubmit={sendMessage} className="flex items-end gap-2.5 px-3 py-2.5">
                                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-300 transition-all">
                                    <textarea
                                        ref={textareaRef}
                                        value={text}
                                        onChange={e => { setText(e.target.value); adjustTextarea(); }}
                                        onKeyDown={handleKey}
                                        placeholder="Type a message..."
                                        rows={1}
                                        className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none leading-relaxed"
                                        style={{ maxHeight: "120px", overflowY: "auto" }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!text.trim() || sending}
                                    className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all shadow-md shadow-indigo-200 active:scale-95 self-end"
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
