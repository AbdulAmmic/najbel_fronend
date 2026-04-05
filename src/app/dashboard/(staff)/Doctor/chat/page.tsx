"use client";

import { useState, useEffect } from "react";
import { 
    Search,
    MessageSquare,
    Loader2
} from "lucide-react";
import { chat, auth } from "@/services/api";
import ChatBox from "@/components/chat/ChatBox";

interface ActiveRoom {
    consultation_id: number;
    patient_id: number;
    patient_name: string;
    created_at: string;
    last_message?: string;
    last_timestamp?: string;
}

export default function ClinicalMessenger() {
    const [rooms, setRooms] = useState<ActiveRoom[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [userMe, setUserMe] = useState<any>(null);

    // Initial load
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

    // WebSocket for Clinical Feed (Listen for all patient messages)
    useEffect(() => {
        if (!userMe) return;

        const wsBase = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/v1";
        const wsToken = localStorage.getItem("token") || "";
        const ws = new WebSocket(`${wsBase}/chat/ws/clinical_feed?token=${wsToken}`);

        ws.onopen = () => console.log("[ClinicalFeed] Connected");
        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                // We only care about patient messages to update the rooms list
                // If it's a message for a room we have in the list, update its preview
                setRooms(prev => {
                    const updated = [...prev];
                    const roomIdx = updated.findIndex(r => r.consultation_id === Number(payload.consultationId));
                    if (roomIdx > -1) {
                        updated[roomIdx] = {
                            ...updated[roomIdx],
                            last_message: payload.text || payload.message,
                            last_timestamp: payload.timestamp || payload.created_at || new Date().toISOString()
                        };
                        // Move to top
                        const room = updated.splice(roomIdx, 1)[0];
                        updated.unshift(room);
                    }
                    return updated;
                });
            } catch (err) {
                console.error("[ClinicalFeed] Parse error:", err);
            }
        };

        return () => ws.close();
    }, [userMe]);

    const filteredRooms = rooms.filter(r => 
        r.patient_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-160px)] flex bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
            {/* Sidebar: Chat List */}
            <div className="w-80 md:w-96 border-r border-slate-50 flex flex-col">
                <div className="p-6 border-b border-slate-50 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Chats</h2>
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                            {rooms.length} Rooms
                        </span>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Find Patient..." 
                            className="w-full bg-slate-50 border-none rounded-xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 transition-all font-semibold text-slate-800"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {filteredRooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-10 text-slate-300">
                             <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                             <p className="text-sm font-bold">No active chats</p>
                        </div>
                    ) : (
                        filteredRooms.map(room => (
                            <button 
                                key={room.consultation_id}
                                onClick={() => setSelectedRoomId(room.consultation_id)}
                                className={`w-full text-left p-6 transition-all border-b border-slate-50 flex items-center gap-4 ${
                                    selectedRoomId === room.consultation_id ? "bg-blue-50/50 border-r-4 border-r-blue-600 shadow-inner" : "hover:bg-slate-50/50"
                                }`}
                            >
                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black shrink-0 uppercase">
                                    {room.patient_name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-black text-slate-900 truncate pr-2">{room.patient_name}</p>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">
                                            {room.last_timestamp ? new Date(room.last_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate font-semibold">
                                        {room.last_message || "Active Session"}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 bg-slate-50/30 flex flex-col relative">
                {selectedRoomId ? (
                    <div className="flex-1 flex flex-col">
                         <ChatBox 
                            consultationId={selectedRoomId} 
                            user={userMe}
                         />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center text-blue-600 mb-6 border border-slate-100">
                            <MessageSquare className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Clinical Messenger</h3>
                        <p className="max-w-md text-slate-400 font-medium text-sm">
                            Select a patient from the list on the left to view history and start communicating in real-time.
                        </p>
                        <div className="mt-8 flex gap-3">
                            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                Shared Pool: Active
                            </div>
                            <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                Monitoring Live Feed
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
