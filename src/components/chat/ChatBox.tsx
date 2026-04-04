"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Phone, Video, Info, Mic, Trash2, StopCircle, Play, Pause, Image as ImageIcon, Check, CheckCheck, Zap, Activity } from "lucide-react";
import api from "@/services/api";

interface Message {
    id: number;
    sender: string;
    text?: string;
    audioUrl?: string; // Will store base64 so it persists
    imageUrl?: string; // Will store base64 so it persists
    time: string;
    isMe: boolean;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    isAI?: boolean;
}

interface ChatBoxProps {
    currentUser: string;
    recipientName: string;
    recipientAvatar?: string;
    consultationId: number | string;
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
        <div className={`flex items-center gap-3 w-60 p-1.5 pr-3 rounded-full ${isMe ? 'bg-indigo-500/80 backdrop-blur-sm text-white border border-indigo-400/50' : 'bg-gray-100 text-gray-800 border border-gray-200 shadow-sm'}`}>
            <button 
                onClick={togglePlayPause}
                className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center transition-all shadow-sm ${isMe ? 'bg-white text-indigo-600 hover:scale-105' : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'}`}
            >
                {isPlaying ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
            </button>
            
            <div className="flex-1 flex items-center h-full">
                {/* Progress bar */}
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

export default function ChatBox({ currentUser, recipientName, recipientAvatar, consultationId }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [typing, setTyping] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load History & Connect WebSocket
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get(`chats/history/${consultationId}`);
                const history = res.data.map((msg: any) => ({
                    id: msg.id,
                    sender: msg.sender_name,
                    text: msg.message,
                    audioUrl: msg.audio_url || undefined,
                    imageUrl: msg.image_url || undefined,
                    time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isMe: msg.sender_role === 'doctor' || msg.sender_role === 'admin',
                    isAI: msg.is_ai || msg.is_ai_assisted,
                    status: 'read' as const
                }));
                setMessages(history);
            } catch (err) {
                console.error("Failed to fetch history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.hostname === "localhost" ? "localhost:8000" : window.location.host;
        const wsUrl = `${protocol}//${host}/api/v1/ws/consultations/${consultationId}?role=doctor`;
        console.log(`[WS] Connecting to: ${wsUrl}`);
        
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log(`[WS] Connected to Unified Room ${consultationId} as doctor`);
        };


        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "typing") {
                    setTyping(true);
                    setTimeout(() => setTyping(false), 3000);
                    return;
                }

                if (data.type === "ack") {
                    if (data.id) {
                        setMessages(prev => {
                            // Find the most recent message from 'me' that has a 'sent' status
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
                    }
                    return;
                }

                if (data.text || data.audioUrl || data.imageUrl) {
                    // All messages received through this block (not ack) are from OTHER participants
                    // OR they are re-broadcasts (which manager.broadcast_to_others prevents)
                    setMessages(prev => [...prev, {
                        id: data.id || Date.now(),
                        sender: data.senderName,
                        text: data.text || "",
                        audioUrl: data.audioUrl,
                        imageUrl: data.imageUrl,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isMe: data.senderRole === 'doctor' || data.senderRole === 'admin',
                        isAI: data.senderRole === 'ai' || data.isAI,
                        status: 'read'
                    }]);
                }
            } catch (e) { console.error("WS Message Error", e); }
        };

        return () => socket.close();
    }, [consultationId]);

    const [newMessage, setNewMessage] = useState("");
    
    // Voice notes state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isRecording]);

    const simulateDeliveryAndRead = (msgId: number) => {
        // Simulate delivery delay
        setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'delivered' } : m));
            
            // Simulate read delay
            setTimeout(() => {
                setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'read' } : m));
            }, 1000);
        }, 1000);
    };

    const handleSendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim()) return;

        const isAiAssisted = true; 
        const payload = {
            text: newMessage,
            senderName: currentUser,
            senderRole: "doctor",
            isAiAssisted: false, 
            type: "message"
        };

        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(payload));
        }

        const msg: Message = {
            id: Date.now(),
            sender: currentUser,
            text: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true,
            isAI: isAiAssisted,
            status: 'sent'
        };

        setMessages(prev => [...prev, msg]);
        setNewMessage("");
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64Image = reader.result as string;
            const msgId = Date.now();
            const msg: Message = {
                id: msgId,
                sender: currentUser,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isMe: true,
                isAI: true,
                imageUrl: base64Image,
                status: 'sent'
            };
            setMessages(prev => [...prev, msg]);
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
                    const msgId = Date.now();
                    const msg: Message = {
                        id: msgId,
                        sender: currentUser,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isMe: true,
                        isAI: true,
                        audioUrl: base64Audio,
                        status: 'sent'
                    };
                    setMessages(prev => [...prev, msg]);
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
            console.error("Error accessing microphone", err);
            alert("Could not access microphone. Please check your permissions.");
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
            mediaRecorderRef.current.onstop = null; // Prevent creating audioUrl
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        }
    };

    const formatTime = (timeInSeconds: number) => {
        const mins = Math.floor(timeInSeconds / 60);
        const secs = timeInSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return (
        <div className="flex flex-col h-[600px] bg-white rounded-[32px] border border-slate-100 items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Secure Channel...</p>
        </div>
    );

    return (
        <div className="flex flex-col h-[600px] bg-gradient-to-br from-white to-sky-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-between z-10 relative shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white transform transition hover:scale-105">
                        {recipientAvatar ? <img src={recipientAvatar} alt="" className="w-full h-full rounded-full object-cover" /> : recipientName[0]}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-lg tracking-tight">{recipientName}</h3>
                            <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                                <Activity className="w-2.5 h-2.5" />
                                SYNC: #{consultationId}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[11px] text-emerald-600 font-semibold tracking-wide uppercase">Active Now</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-100"><Phone className="w-5 h-5" /></button>
                    <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-100"><Video className="w-5 h-5" /></button>
                    <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-100"><Info className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 pb-8 space-y-6 bg-transparent scroll-smooth" style={{ backgroundImage: "linear-gradient(to right, #f8fafc 1px, transparent 1px), linear-gradient(to bottom, #f8fafc 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
                {messages.map((msg, index) => {
                    const isLast = index === messages.length - 1;
                    return (
                        <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-3 duration-300`}>
                            <div className={`max-w-[80%] flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`px-1 py-1 rounded-2xl text-[15px] leading-relaxed relative ${msg.isMe
                                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm shadow-md"
                                        : "bg-white text-gray-800 rounded-bl-sm border border-gray-100 shadow-sm"
                                    }`}>
                                    {msg.isAI && (
                                        <div className={`px-2.5 py-1 mb-2 flex items-center gap-1.5 w-fit rounded-full shadow-sm animate-in fade-in zoom-in duration-500 ${
                                            msg.isMe 
                                            ? 'bg-white/20 backdrop-blur-md text-white border border-white/30' 
                                            : 'bg-indigo-50/80 backdrop-blur-sm text-indigo-600 border border-indigo-100'
                                        }`}>
                                            <div className="relative flex items-center justify-center">
                                                <Zap className="w-3 h-3 fill-current" />
                                                <span className="absolute inset-0 animate-ping opacity-20"><Zap className="w-3 h-3 fill-current" /></span>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">AI Assisted</span>
                                        </div>
                                    )}
                                    {(msg.text || msg.imageUrl) && (
                                        <div className="px-3 pt-2 pb-2">
                                            {msg.imageUrl && (
                                                <div className="mb-2 relative rounded-xl overflow-hidden group shadow-sm bg-black/5">
                                                    <img src={msg.imageUrl} alt="attached" className="max-w-full max-h-[300px] min-w-[200px] object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-300" />
                                                </div>
                                            )}
                                            {msg.text && <p className="leading-snug">{msg.text}</p>}
                                        </div>
                                    )}
                                    {msg.audioUrl && (
                                        <div className={`p-1 ${msg.text || msg.imageUrl ? 'pt-0' : ''}`}>
                                            <CustomAudioPlayer url={msg.audioUrl} isMe={msg.isMe} />
                                        </div>
                                    )}
                                </div>
                                <div className={`flex items-center gap-1 mt-1.5 ${msg.isMe ? "justify-end mr-1" : "justify-start ml-1"}`}>
                                    <span className="text-[10px] font-semibold text-gray-400 tracking-wider">
                                        {msg.time}
                                    </span>
                                    {msg.isMe && (
                                        <span className="ml-0.5">
                                            {msg.status === 'read' ? (
                                                <CheckCheck className="w-[14px] h-[14px] text-blue-500" strokeWidth={2.5} />
                                            ) : msg.status === 'delivered' ? (
                                                <CheckCheck className="w-[14px] h-[14px] text-gray-400" strokeWidth={2.5} />
                                            ) : (
                                                <Check className="w-[14px] h-[14px] text-gray-400" strokeWidth={2.5} />
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 z-10 relative shrink-0 shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)]">
                {isRecording ? (
                    <div className="flex items-center justify-between p-3 px-5 bg-red-50 text-red-600 rounded-full border border-red-100/50 shadow-inner">
                        <div className="flex items-center gap-3">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <span className="font-bold tabular-nums tracking-widest">{formatTime(recordingTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                type="button" 
                                onClick={cancelRecording} 
                                className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-white rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-red-200"
                                title="Cancel recording"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <button 
                                type="button" 
                                onClick={stopRecording} 
                                className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transform active:scale-95"
                                title="Stop & Send"
                            >
                                <Send className="w-5 h-5 ml-1" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="relative flex items-center gap-2 max-w-full">
                        <div className="flex-1 relative flex items-center">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Message here..."
                                className="w-full pl-5 pr-[110px] py-3.5 bg-gray-50 border border-gray-200 focus:border-blue-400 rounded-full outline-none focus:bg-white focus:ring-[3px] focus:ring-blue-100 transition-all text-gray-700 placeholder-gray-400 shadow-sm"
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
                                            className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all focus:outline-none"
                                            title="Send an image"
                                        >
                                            <ImageIcon className="w-[19px] h-[19px]" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={startRecording}
                                            className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all focus:outline-none mr-0.5"
                                            title="Record a voice note"
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
                                className="p-3.5 shrink-0 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 hover:shadow-lg transform active:scale-95 flex items-center justify-center"
                            >
                                <Send className="w-[19px] h-[19px] ml-0.5" />
                            </button>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}
