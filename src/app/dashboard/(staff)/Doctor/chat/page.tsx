"use client";

import { useState, useEffect, useRef } from "react";
import {
    Search,
    MessageSquare,
    Loader2,
    Mic,
    Image as ImageIcon,
    ArrowLeft,
    Users,
    ChevronRight,
    X
} from "lucide-react";
import { chat, auth, getWsBaseUrl } from "@/services/api";
import ChatBox from "@/components/chat/ChatBox";

interface ActiveRoom {
    consultation_id: number;
    patient_id: number;
    patient_name: string;
    created_at: string;
    last_message?: string;
    last_timestamp?: string;
    unread?: number;
}

export default function ClinicalMessenger() {
    const [rooms, setRooms] = useState<ActiveRoom[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<ActiveRoom | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [userMe, setUserMe] = useState<any>(null);
    const [showSidebar, setShowSidebar] = useState(false); // mobile sidebar toggle
    const feedWsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const [me, activeRooms] = await Promise.all([
                    auth.getMe(),
                    chat.getActiveRooms()
                ]);
                setUserMe(me);
                setRooms(activeRooms);
            } catch (err) {
                console.error("Failed to load clinical messenger data:", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // Subscribe to ALL patient messages via clinical_feed WebSocket
    useEffect(() => {
        if (!userMe) return;

        const wsBase = getWsBaseUrl();
        const wsToken = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
        const wsUrl = `${wsBase}/ws/clinical_feed?token=${wsToken}`;

        console.log("[ClinicalFeed] Connecting to:", wsUrl);
        const ws = new WebSocket(wsUrl);
        feedWsRef.current = ws;

        ws.onopen = () => console.log("[ClinicalFeed] Connected");
        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                const roomId = Number(payload.consultationId);
                const preview = payload.audioUrl
                    ? "🎵 Voice note"
                    : payload.imageUrl
                    ? "📷 Image"
                    : payload.text || payload.message || "New message";

                setRooms((prev) => {
                    const updated = [...prev];
                    const idx = updated.findIndex((r) => r.consultation_id === roomId);
                    if (idx > -1) {
                        const isSelected = selectedRoom?.consultation_id === roomId;
                        const room = {
                            ...updated[idx],
                            last_message: preview,
                            last_timestamp: new Date().toISOString(),
                            unread: isSelected ? 0 : (updated[idx].unread || 0) + 1,
                        };
                        updated.splice(idx, 1);
                        updated.unshift(room);
                    }
                    return updated;
                });
            } catch (err) {
                console.error("[ClinicalFeed] Parse error:", err);
            }
        };
        ws.onerror = (e) => console.error("[ClinicalFeed] Error", e);
        ws.onclose = () => console.log("[ClinicalFeed] Disconnected");

        return () => ws.close();
    }, [userMe]);

    const handleSelectRoom = (room: ActiveRoom) => {
        setSelectedRoom(room);
        setShowSidebar(false);
        // Clear unread
        setRooms((prev) =>
            prev.map((r) =>
                r.consultation_id === room.consultation_id ? { ...r, unread: 0 } : r
            )
        );
    };

    const totalUnread = rooms.reduce((sum, r) => sum + (r.unread || 0), 0);

    const filteredRooms = rooms.filter((r) =>
        r.patient_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <p className="text-sm text-slate-500 font-semibold">Loading Clinical Messenger...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100svh-64px)] md:h-[calc(100vh-80px)] bg-slate-50">

            {/* ——— MOBILE HEADER (only when chat is open) ——— */}
            {selectedRoom && (
                <div className="flex md:hidden items-center gap-3 px-4 py-3 bg-white border-b border-slate-100 shrink-0 shadow-sm z-20">
                    <button
                        onClick={() => setSelectedRoom(null)}
                        className="p-2 -ml-1 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-9 h-9 rounded-2xl bg-blue-100 flex items-center justify-center font-black text-blue-700 text-sm uppercase shrink-0">
                        {selectedRoom.patient_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 text-sm truncate">{selectedRoom.patient_name}</p>
                        <p className="text-[11px] text-emerald-600 font-semibold">● Active</p>
                    </div>
                    <button
                        onClick={() => setShowSidebar(true)}
                        className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500"
                    >
                        <Users className="w-5 h-5" />
                        {totalUnread > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                                {totalUnread}
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* ——— MOBILE TOP BAR (when no chat selected) ——— */}
            {!selectedRoom && (
                <div className="flex md:hidden items-center justify-between px-5 pt-4 pb-3 bg-white border-b border-slate-100 shrink-0">
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Clinical Chat</h1>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">{rooms.length} active rooms</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] text-emerald-600 font-black uppercase">Live</span>
                    </div>
                </div>
            )}

            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* ——— SIDEBAR (always visible on desktop, slide-over on mobile) ——— */}
                {/* Mobile slide-over backdrop */}
                {showSidebar && (
                    <div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setShowSidebar(false)}
                    />
                )}

                <aside
                    className={`
                        w-full md:w-80 lg:w-96 bg-white border-r border-slate-100
                        flex flex-col shrink-0 overflow-hidden
                        transition-all duration-300 ease-in-out
                        ${/* Mobile: show full list until a room is picked, or as slide-over */
                        selectedRoom
                            ? `fixed inset-y-0 left-0 z-50 md:relative md:inset-auto shadow-2xl md:shadow-none
                               ${showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`
                            : "relative translate-x-0"}
                    `}
                >
                    {/* Sidebar Header */}
                    <div className="p-5 border-b border-slate-50 space-y-3 shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 tracking-tight">Active Chats</h2>
                                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{rooms.length} sessions</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Close button for mobile slide-over */}
                                {showSidebar && (
                                    <button
                                        onClick={() => setShowSidebar(false)}
                                        className="p-2 rounded-full hover:bg-slate-100 text-slate-400 md:hidden"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase hidden md:block">
                                    {rooms.length}
                                </span>
                            </div>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search patients..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-200 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Room List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredRooms.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
                                    <MessageSquare className="w-8 h-8 text-slate-200" />
                                </div>
                                <p className="text-sm font-bold text-slate-400">No active chats</p>
                                <p className="text-xs text-slate-300 mt-1">Patient conversations will appear here</p>
                            </div>
                        ) : (
                            filteredRooms.map((room) => (
                                <button
                                    key={room.consultation_id}
                                    onClick={() => handleSelectRoom(room)}
                                    className={`w-full text-left px-5 py-4 transition-all border-b border-slate-50 flex items-center gap-3 active:bg-blue-50/50 ${
                                        selectedRoom?.consultation_id === room.consultation_id
                                            ? "bg-blue-50/60 border-r-2 border-r-blue-600"
                                            : "hover:bg-slate-50/80"
                                    }`}
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center font-black text-blue-700 uppercase text-sm shadow-sm">
                                            {room.patient_name[0]}
                                        </div>
                                        {(room.unread || 0) > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
                                                {room.unread}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <p className="font-black text-slate-900 text-sm truncate pr-2">{room.patient_name}</p>
                                            <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap shrink-0">
                                                {room.last_timestamp
                                                    ? new Date(room.last_timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                                    : ""}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-1">
                                            {room.last_message?.startsWith("🎵") && <Mic className="w-3 h-3 text-purple-400 shrink-0" />}
                                            {room.last_message?.startsWith("📷") && <ImageIcon className="w-3 h-3 text-blue-400 shrink-0" />}
                                            {room.last_message || "Active Session"}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 hidden md:block" />
                                </button>
                            ))
                        )}
                    </div>
                </aside>

                {/* ——— MAIN CHAT AREA ——— */}
                <main className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
                    /* On mobile: hide list when room is picked, show chat */
                    !selectedRoom ? "hidden md:flex" : "flex"
                }`}>
                    {selectedRoom ? (
                        <div className="flex-1 flex flex-col min-h-0 p-0 md:p-4 lg:p-6">
                            <div className="flex-1 min-h-0 rounded-none md:rounded-2xl overflow-hidden shadow-none md:shadow-xl">
                                <ChatBox
                                    currentUser={`Dr. ${userMe?.full_name || "Doctor"}`}
                                    recipientName={selectedRoom.patient_name}
                                    consultationId={selectedRoom.consultation_id}
                                />
                            </div>
                        </div>
                    ) : (
                        /* Empty state — only visible on desktop */
                        <div className="flex-1 flex-col items-center justify-center p-12 text-center hidden md:flex">
                            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 flex items-center justify-center text-blue-500 mb-6 border border-slate-100">
                                <MessageSquare className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Clinical Messenger</h3>
                            <p className="max-w-xs text-slate-400 font-medium text-sm leading-relaxed">
                                Select a patient from the sidebar to start communicating in real-time.
                            </p>
                            <div className="mt-8 flex flex-wrap justify-center gap-3">
                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    Shared Pool Active
                                </div>
                                <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                    {rooms.length} Rooms Live
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
