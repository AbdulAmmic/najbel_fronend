"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User, Bot, AlertCircle, Mic, Trash2 } from "lucide-react";

interface Message {
    sender: "me" | "other";
    text: string;
    audioUrl?: string;
    time: string;
    senderName?: string;
}

interface LiveChatProps {
    consultationId: number;
    userName: string; // The name of the current user
    userRole: string; // The role of the current user (e.g., patient, doctor)
}

export default function LiveChat({ consultationId, userName, userRole }: LiveChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [connected, setConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    // Doctor online status state
    const [isDoctorOnline, setIsDoctorOnline] = useState(false);

    const socketRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Voice notes state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    const effectiveRole = userRole === 'doctor'
        ? (isDoctorOnline ? 'doctor' : 'doctor_passive')
        : userRole;

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isRecording]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const hostname = window.location.hostname;
                const response = await fetch(`http://${hostname}:8000/api/v1/chats/history/${consultationId}`);
                if (response.ok) {
                    const history = await response.json();

                    if (Array.isArray(history)) {
                        const formattedHistory = history.map((msg: any): Message => ({
                            sender: msg.sender_role === userRole || (userRole === 'doctor' && msg.sender_role === 'doctor') ? 'me' : 'other',
                            text: msg.message,
                            audioUrl: msg.audioUrl || undefined, // assuming backend doesn't save audio blobs yet in message field, 
                            // but if extended, it'd map here.
                            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }));
                        setMessages(formattedHistory);
                    }
                }
            } catch (error) {
                console.error("Failed to load chat history", error);
            }
        };
        fetchHistory();
    }, [consultationId, userRole]);

    useEffect(() => {
        let wsUrl = `wss://najbelbackend-ammicsystems4174-umj4fvky.leapcell.dev/api/v1/ws/consultations/${consultationId}?role=${effectiveRole}`;
        
        // Ensure proper URI encoding for the ID
        wsUrl = wsUrl.replace(consultationId.toString(), encodeURIComponent(consultationId.toString()));
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const text = event.data;
                let msgData;
                try {
                    msgData = JSON.parse(text);
                } catch {
                    msgData = { senderName: "Unknown", text: text };
                }

                if (msgData.type === "typing" && msgData.senderName !== userName) {
                    setIsTyping(true);
                    setTimeout(() => setIsTyping(false), 5000);
                    return;
                }

                if (msgData.senderName !== userName) {
                    setIsTyping(false);
                    const newMsg: Message = {
                        sender: "other",
                        text: msgData.text || "",
                        audioUrl: msgData.audioUrl,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        senderName: msgData.senderName
                    };
                    setMessages((prev) => [...prev, newMsg]);
                }
            } catch (e) {
                console.error("Error parsing message", e);
            }
        };

        ws.onclose = () => {
            setConnected(false);
        };

        return () => {
            ws.close();
        };
    }, [consultationId, userName, effectiveRole]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim() || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

        const msgPayload = JSON.stringify({
            senderName: userName,
            text: inputValue
        });

        socketRef.current.send(msgPayload);

        const newMsg: Message = {
            sender: "me",
            text: inputValue,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, newMsg]);
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const startRecording = async () => {
        if (!connected) return;
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
                    
                    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                        const msgPayload = JSON.stringify({
                            senderName: userName,
                            text: "🎵 Voice Note",
                            audioUrl: base64Audio
                        });
                        socketRef.current.send(msgPayload);

                        const newMsg: Message = {
                            sender: "me",
                            text: "🎵 Voice Note",
                            audioUrl: base64Audio,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };
                        setMessages((prev) => [...prev, newMsg]);
                    }
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
            mediaRecorderRef.current.onstop = null; // Prevent sending
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

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative">
            {/* Header */}
            <div className="bg-white/90 backdrop-blur-md p-4 border-b border-gray-100 flex justify-between items-center z-10 shadow-sm relative">
                <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 tracking-tight">Consultation Chat</h3>
                        {connected ? (
                            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Connected</span>
                         ) : (
                            <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Disconnected</span>
                         )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Doctor Online Toggle */}
                    {userRole === 'doctor' && (
                        <button
                            onClick={() => setIsDoctorOnline(!isDoctorOnline)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${isDoctorOnline
                                ? "bg-emerald-500 text-white hover:bg-emerald-600 ring-2 ring-emerald-200 ring-offset-1"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            {isDoctorOnline ? "Online (AI Off)" : "Go Online"}
                        </button>
                    )}
                </div>
            </div>

            {/* AI Status Banner for Doctor */}
            {userRole === 'doctor' && !isDoctorOnline && (
                <div className="bg-blue-50/80 backdrop-blur-sm px-4 py-2 border-b border-blue-100 flex items-center justify-center gap-2 text-blue-700 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
                    <Bot className="w-4 h-4 animate-pulse" />
                    <span>AI Copilot is currently handling responses</span>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent" style={{ backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Send className="w-6 h-6 text-gray-400 ml-1" />
                        </div>
                        <p className="font-medium text-gray-500">Your conversation starts here</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex flex-col ${msg.sender === "me" ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                        {msg.sender === "other" && msg.senderName && (
                             <span className="text-[10px] text-gray-400 font-bold ml-2 mb-1 uppercase tracking-wider">{msg.senderName}</span>
                        )}
                        <div
                            className={`max-w-[80%] rounded-2xl px-5 py-3 text-[15px] leading-relaxed relative shadow-md transition-all ${msg.sender === "me"
                                ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-sm shadow-violet-200"
                                : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm"
                                }`}
                        >
                            {msg.text && <p className={msg.audioUrl ? "mb-2 font-medium" : ""}>{msg.text}</p>}
                            
                            {msg.audioUrl && (
                                <div className="mt-1">
                                    <audio 
                                        controls 
                                        src={msg.audioUrl} 
                                        className={`h-10 w-56 rounded-full outline-none ${msg.sender === "me" ? 'filter invert hue-rotate-[220deg] opacity-95' : ''}`} 
                                    />
                                </div>
                            )}

                            <span className={`text-[10px] block mt-1 font-semibold tracking-wide ${msg.sender === "me" ? "text-violet-200 text-right" : "text-gray-400 text-left"}`}>
                                {msg.time}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex justify-start animate-in fade-in">
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input */}
            <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-10">
                {isRecording ? (
                     <div className="flex items-center justify-between p-3 px-5 bg-red-50 text-red-600 rounded-2xl border border-red-100/50 shadow-inner">
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
                                title="Cancel"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <button 
                                type="button" 
                                onClick={stopRecording} 
                                className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transform active:scale-95"
                                title="Send Voice Note"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="relative flex items-center gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Message..."
                            className="flex-1 pl-5 pr-14 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all text-gray-700 placeholder-gray-400 font-medium disabled:opacity-50"
                            disabled={!connected}
                        />
                        
                        <div className="absolute right-2 flex items-center">
                            {inputValue.trim() ? (
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!connected}
                                    className="p-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all shadow-md shadow-violet-500/20 hover:shadow-lg transform active:scale-95 m-1 disabled:opacity-50 disabled:active:scale-100"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={startRecording}
                                    disabled={!connected}
                                    className="p-2.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all focus:outline-none m-1 disabled:opacity-50"
                                    title="Record a voice note"
                                >
                                    <Mic className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
