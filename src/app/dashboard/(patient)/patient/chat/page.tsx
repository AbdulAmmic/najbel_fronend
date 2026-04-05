"use client";

import { useState, useEffect, useRef } from "react";
import {
    Send,
    ArrowLeft,
    Paperclip,
    Smile,
    Check,
    CheckCheck,
    MoreVertical,
    Zap,
    Clock,
    Phone,
    Video,
    Mic,
    Trash2,
    Play,
    Pause,
    Image as ImageIcon,
    Activity
} from "lucide-react";
import { useRouter } from "next/navigation";
import api, { consultations, getWsBaseUrl, chat } from "@/services/api";
import { ShoppingBag } from "lucide-react";

interface Message {
    id: number | string;
    sender: string;
    text: string;
    audioUrl?: string;
    imageUrl?: string;
    time: string;
    isMe: boolean;
    status?: 'sent' | 'delivered' | 'read';
    isAI?: boolean;
}

const CustomAudioPlayer = ({ url, isMe }: { url: string, isMe: boolean }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => {
            if (isFinite(audio.duration)) {
                setDuration(audio.duration);
            }
            setCurrentTime(audio.currentTime);
        };

        const setAudioTime = () => setCurrentTime(audio.currentTime);
        const onAudioEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', onAudioEnded);

        if (audio.readyState > 0) {
            setAudioData();
        }

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', onAudioEnded);
        };
    }, []);

    const togglePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.log('Audio play failed', e));
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (time: number) => {
        if (isNaN(time) || !isFinite(time)) return "0:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className={`flex items-center gap-3 w-60 p-1.5 pr-3 rounded-full mt-1 ${isMe ? 'bg-indigo-500/80 backdrop-blur-sm text-white border border-indigo-400/50 shadow-inner shadow-white/10' : 'bg-gray-100 text-gray-800 border border-gray-200 shadow-sm'}`}>
            <button
                onClick={togglePlayPause}
                className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center transition-all shadow-sm ${isMe ? 'bg-white text-indigo-600 hover:scale-105 hover:shadow-md' : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 hover:shadow-md'}`}
            >
                {isPlaying ? <Pause className="w-4 h-4" strokeWidth={3} /> : <Play className="w-4 h-4 ml-0.5" strokeWidth={3} />}
            </button>

            <div className="flex-1 flex items-center h-full">
                <div
                    className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden relative cursor-pointer"
                    onClick={(e) => {
                        if (audioRef.current && duration > 0 && isFinite(duration)) {
                            const bounds = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - bounds.left;
                            const newTime = (x / bounds.width) * duration;
                            audioRef.current.currentTime = newTime;
                            setCurrentTime(newTime);
                        }
                    }}
                >
                    <div
                        className={`absolute left-0 top-0 bottom-0 ${isMe ? 'bg-white' : 'bg-blue-500'} transition-all`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <span className="text-[11px] font-medium w-8 text-right tabular-nums opacity-80">
                {formatTime(currentTime)}
            </span>
            <audio
                ref={audioRef}
                src={url}
                preload="metadata"
                className="hidden"
            />
        </div>
    );
};

export default function ChatPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [typing, setTyping] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Voice notes state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [reason, setReason] = useState<string | null>(null);
    const [consultationId, setConsultationId] = useState<number | null>(null);
    const [notAllowed, setNotAllowed] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Dynamic Discovery of Active Chat Session
    useEffect(() => {
        const discoverSession = async () => {
            try {
                // active-chat returns: {active_chat_id: int | null, reason: str | null}
                const data = await consultations.getActiveChatId();
                if (!data.active_chat_id) {
                    setReason(data.reason || "no_session");
                    setNotAllowed(true);
                    setLoading(false);
                    return;
                }
                setConsultationId(data.active_chat_id);
            } catch (err: any) {
                console.warn("No active chat session found:", err);
                setErrorMessage("Unable to sync clinical channel. Please try again later.");
                setNotAllowed(true);
                setLoading(false);
            }
        };
        discoverSession();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, typing]);

    // cleanup timer
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isRecording]);

    // Format time helper
    const formatTime = (timeInSeconds: number) => {
        const mins = Math.floor(timeInSeconds / 60);
        const secs = timeInSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Keep read receipts simulated for new messages
    const simulateDeliveryAndRead = (msgId: string | number) => {
        setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === msgId && m.status === 'sent' ? { ...m, status: 'delivered' } : m));
            setTimeout(() => {
                setMessages(prev => prev.map(m => m.id === msgId && m.status === 'delivered' ? { ...m, status: 'read' } : m));
            }, 1000);
        }, 1000);
    };

    useEffect(() => {
        if (!consultationId) return;

        // 1. Fetch History from the database
        const syncMessages = async () => {
            try {
                const history = await chat.getHistory(consultationId);
                const formatted = history.map((msg: any) => ({
                    id: msg.id,
                    sender: msg.sender_name,
                    text: msg.message,
                    audioUrl: msg.audio_url || undefined,
                    imageUrl: msg.image_url || undefined,
                    time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isMe: msg.sender_role === 'patient',
                    isAI: msg.sender_role === 'ai',
                    status: 'read' as const
                }));
                setMessages(prev => {
                    const shadow = [...prev];
                    const newIds = new Set(formatted.map((m: any) => m.id));
                    const currentIds = new Set(shadow.filter(m => !m.id.toString().startsWith('temp-')).map(m => m.id));
                    
                    // Logic to update: if we have new messages or status changes
                    if (newIds.size !== currentIds.size) return formatted;
                    return prev;
                });
            } catch (err) { console.error("Sync failed", err); }
        };

        // 2. Connect WebSocket
        const wsBase = getWsBaseUrl();
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const wsUrl = `${wsBase}/ws/consultations/${consultationId}?role=patient${token ? `&token=${token}` : ''}`;
        
        console.log(`[WS] Connecting to: ${wsUrl}`);

        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onmessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "ack" && data.id) {
                    setMessages(prev => {
                        const lastMeIdx = [...prev].reverse().findIndex(m => m.isMe && m.status === 'sent');
                        if (lastMeIdx !== -1) {
                            const realIdx = prev.length - 1 - lastMeIdx;
                            const updated = [...prev];
                            updated[realIdx] = { 
                                ...updated[realIdx], 
                                id: data.id, 
                                status: data.status || 'delivered' 
                            };
                            return updated;
                        }
                        return prev;
                    });
                    return;
                }

                if (data.text || data.audioUrl || data.imageUrl) {
                    setMessages(prev => [...prev, {
                        id: data.id || Date.now(),
                        sender: data.senderName,
                        text: data.text || "",
                        audioUrl: data.audioUrl,
                        imageUrl: data.imageUrl,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isMe: data.senderRole === 'patient',
                        isAI: data.senderRole === 'ai' || data.isAI,
                        status: 'read'
                    }]);
                }
            } catch (e) {
                console.error("WS Message Error", e);
            }
        };

        const pollInterval = setInterval(() => {
            if (socketRef.current?.readyState !== WebSocket.OPEN) {
                syncMessages();
            }
        }, 5000);

        socket.onclose = () => console.log("WS Disconnected");

        return () => {
            clearInterval(pollInterval);
            socket.close();
        };
    }, [consultationId]);

    // Removed localStorage sync to prevent sync issues with DB

    // Handle initial loading
    if (notAllowed) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] bg-[#f8fafc] text-center p-6 -mx-4 -my-6">
                <div className="relative mb-8">
                    <div className={`w-24 h-24 bg-white rounded-[2rem] border border-gray-100 shadow-2xl flex items-center justify-center relative z-10 animate-in zoom-in duration-700 ${reason === 'payment_required' ? 'shadow-orange-200/50' : 'shadow-blue-200/50'}`}>
                        {reason === 'payment_required' ? (
                            <ShoppingBag className="w-12 h-12 text-orange-500 fill-orange-50" />
                        ) : (
                            <Zap className="w-12 h-12 text-blue-600 fill-blue-50" />
                        )}
                    </div>
                    <div className={`absolute inset-0 blur-3xl opacity-20 animate-pulse ${reason === 'payment_required' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                </div>
                
                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {reason === 'payment_required' ? 'Consultation Fee Required' : 'Clinical Channel Locked'}
                </h2>
                
                <div className="max-w-md bg-white border border-gray-100 p-6 rounded-[2rem] shadow-xl shadow-gray-200/40 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <p className="text-lg text-gray-600 leading-relaxed font-semibold mb-2">
                        {reason === 'payment_required' 
                            ? "To access the doctor-patient chat, please settle your consultation fee via the billing dashboard." 
                            : (errorMessage || "You must have an active consultation session to access the medical team chat.")}
                    </p>
                    <p className="text-sm text-gray-400 font-medium italic">
                        The Najbel Clinical Feed is strictly reserved for paid consultations and active care synchronization.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center animate-in fade-in slide-in-from-bottom-12 duration-1000">
                    {reason === 'payment_required' ? (
                        <button 
                            onClick={() => router.push('/dashboard/patient/billing')} 
                            className="px-10 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-500/30 active:scale-95 transition-all flex items-center gap-3 text-lg"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            Go to Billing
                        </button>
                    ) : (
                        <button 
                            onClick={() => router.push('/dashboard/patient/appointments/book')} 
                            className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 active:scale-95 transition-all flex items-center gap-3 text-lg"
                        >
                            <Clock className="w-5 h-5" />
                            Book Appointment
                        </button>
                    )}
                    <button 
                        onClick={() => router.back()} 
                        className="px-10 py-4 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-lg"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (consultationId === null) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Synchronizing clinical channel with your care team...</p>
                </div>
            </div>
        );
    }

    const handleSendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !socketRef.current) return;

        const payload = {
            text: newMessage,
            senderName: "Patient",
            senderRole: "patient",
            type: "message"
        };

        const msgId = `temp-${Date.now()}`;
        const msg: Message = {
            id: msgId,
            sender: "You",
            text: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            isMe: true,
            status: 'sent'
        };

        setMessages(prev => [...prev, msg]);
        setNewMessage("");

        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(payload));
        } else {
            console.log('[CHAT_DEBUG] WebSocket down, using REST fallback');
            chat.sendMessage({ 
                ...payload, 
                consultation_id: consultationId,
                message: newMessage,
                sender_name: "Patient",
                sender_role: "patient"
            })
                .then(res => {
                    if (res) {
                        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, id: res.id, status: 'delivered' } : m));
                    }
                })
                .catch(err => console.error("REST send failed", err));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64Image = reader.result as string;
            const msgId = `temp-${Date.now()}`;

            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                const msgPayload = JSON.stringify({
                    text: "📷 Image",
                    senderName: "Patient",
                    senderRole: "patient",
                    imageUrl: base64Image,
                    type: "message"
                });
                socketRef.current.send(msgPayload);
            }

            const newMsg: Message = {
                id: msgId,
                sender: "You",
                text: "📷 Image",
                imageUrl: base64Image,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                isMe: true,
                status: 'sent'
            };
            setMessages((prev) => [...prev, newMsg]);
            simulateDeliveryAndRead(msgId);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        };
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result as string;
                    const msgId = `temp-${Date.now()}`;

                    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                        const msgPayload = JSON.stringify({
                            text: "🎵 Voice Note",
                            senderName: "Patient",
                            senderRole: "patient",
                            audioUrl: base64Audio,
                            type: "message"
                        });
                        socketRef.current.send(msgPayload);
                    }

                    const newMsg: Message = {
                        id: msgId,
                        sender: "You",
                        text: "🎵 Voice Note",
                        audioUrl: base64Audio,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isMe: true,
                        status: 'sent'
                    };
                    setMessages((prev) => [...prev, newMsg]);
                    simulateDeliveryAndRead(msgId);
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            recordingTimerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error(err);
            alert("Microphone access denied.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        }
    };

    return (
        <div className="-mx-4 -my-6 -mb-20 flex flex-col h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)]">
            <div className="flex-1 min-h-0 overflow-hidden relative bg-[#f8fafc] flex flex-col">
                {/* High-End Chat Header */}
                <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-6 py-4 relative z-20 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 lg:hidden">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="relative">
                            <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-blue-100">
                                <Zap className="w-6 h-6 fill-white" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-lg border-2 border-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">Najbel Support</h1>
                                <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                    <Activity className="w-2.5 h-2.5" />
                                    SYNC: #{consultationId}
                                </span>
                            </div>
                            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                Live AI Concierge
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="hidden sm:flex p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                            <Phone className="w-5 h-5" />
                        </button>
                        <button className="hidden sm:flex p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                            <Video className="w-5 h-5" />
                        </button>
                        <button className="p-3 text-gray-400 hover:text-gray-900 rounded-2xl transition-all">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages Canvas */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8fafc] custom-scrollbar relative">
                    <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-20 right-10 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-widest">Encrypting Connection...</span>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-center mb-8">
                                <div className="px-4 py-1.5 bg-white/50 backdrop-blur-md rounded-full border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    Today
                                </div>
                            </div>

                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
                                    <div className={`max-w-[85%] sm:max-w-[70%] group relative`}>
                                        <div className={`px-5 py-4 rounded-[1.8rem] shadow-xl text-sm leading-relaxed transition-all duration-300 ${msg.isMe
                                            ? "bg-blue-600 text-white rounded-tr-none shadow-blue-200"
                                            : "bg-white text-gray-800 rounded-tl-none border border-gray-50 shadow-sm"
                                            }`}>
                                            {msg.isAI && (
                                                <div className={`px-2.5 py-1 mb-2 flex items-center gap-1.5 w-fit rounded-full shadow-sm animate-in fade-in zoom-in duration-500 ${
                                                    msg.isMe 
                                                    ? 'bg-blue-500/20 backdrop-blur-md text-white border border-white/30' 
                                                    : 'bg-blue-50/80 backdrop-blur-sm text-blue-600 border border-blue-100'
                                                }`}>
                                                    <div className="relative flex items-center justify-center text-blue-500">
                                                        <Zap className="w-3 h-3 fill-current" />
                                                        <span className="absolute inset-0 animate-ping opacity-20"><Zap className="w-3 h-3 fill-current" /></span>
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Doctor · AI Assisted</span>
                                                </div>
                                            )}

                                            {msg.imageUrl && (
                                                <div className="mb-2 relative rounded-xl overflow-hidden group shadow-sm bg-black/5">
                                                    <img src={msg.imageUrl} alt="attached" className="max-w-full max-h-[300px] min-w-[200px] object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-300" />
                                                </div>
                                            )}

                                            {msg.text && <p className={msg.audioUrl ? "mb-1 font-medium" : ""}>{msg.text}</p>}

                                            {msg.audioUrl && (
                                                <CustomAudioPlayer url={msg.audioUrl} isMe={msg.isMe} />
                                            )}
                                        </div>
                                        <div className={`mt-2 flex items-center gap-2 px-1 ${msg.isMe ? "flex-row-reverse" : "flex-row"}`}>
                                            <p className="text-[10px] font-bold text-gray-400 opacity-60">
                                                {msg.time}
                                            </p>
                                            {msg.isMe && (
                                                <div className="text-blue-500">
                                                    {msg.status === 'read' ? (
                                                        <CheckCheck className="w-[14px] h-[14px]" strokeWidth={2.5} />
                                                    ) : msg.status === 'delivered' ? (
                                                        <CheckCheck className="w-[14px] h-[14px] text-gray-400" strokeWidth={2.5} />
                                                    ) : (
                                                        <Check className="w-[14px] h-[14px] text-gray-400" strokeWidth={2.5} />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {typing && (
                                <div className="flex items-center gap-2 text-gray-400">
                                    <div className="p-4 bg-white rounded-2xl rounded-tl-none border border-gray-50 flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-100" />
                                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-200" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Premium Command Input */}
                <div className="bg-white/95 backdrop-blur-xl p-4 pt-3 border-t border-gray-100/50 relative z-20 shrink-0 pb-[90px] sm:pb-[90px] lg:pb-4">
                    {isRecording ? (
                        <div className="max-w-4xl mx-auto flex items-center justify-between p-3 px-6 bg-red-50 text-red-600 rounded-full border border-red-100/50 shadow-inner mt-1">
                            <div className="flex items-center gap-4">
                                <span className="relative flex h-3.5 w-3.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                                </span>
                                <span className="font-bold tabular-nums tracking-widest">{formatTime(recordingTime)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={cancelRecording}
                                    className="p-3 text-gray-500 hover:text-red-600 hover:bg-white rounded-full transition-all focus:outline-none"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={stopRecording}
                                    className="w-12 h-12 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-md active:scale-95"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-2 mt-1 relative">
                            <div className="flex-1 relative flex items-center">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Message AI Support..."
                                    disabled={loading}
                                    className="w-full pl-5 pr-[110px] py-3.5 bg-gray-50 border-2 border-gray-100/50 rounded-full outline-none focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all font-bold text-gray-700 placeholder:text-gray-400 disabled:opacity-50"
                                />
                                <div className="absolute right-1.5 flex items-center gap-0.5">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                    />
                                    {newMessage.trim() === "" && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={loading}
                                                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all focus:outline-none disabled:opacity-50"
                                            >
                                                <ImageIcon className="w-[19px] h-[19px]" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={startRecording}
                                                disabled={loading}
                                                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all focus:outline-none mr-0.5 disabled:opacity-50"
                                            >
                                                <Mic className="w-[19px] h-[19px]" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {newMessage.trim() !== "" && (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-12 h-12 shrink-0 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-20 flex-none"
                                >
                                    <Send className="w-[19px] h-[19px] ml-0.5 fill-none" />
                                </button>
                            )}
                        </form>
                    )}
                </div>

                <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                `}</style>
            </div>
        </div>
    );
}
