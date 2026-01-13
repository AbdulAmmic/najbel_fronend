"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User, Bot, AlertCircle } from "lucide-react";

interface Message {
    sender: "me" | "other";
    text: string;
    time: string;
}

interface LiveChatProps {
    consultationId: number;
    userName: string; // The name of the current user
}

export default function LiveChat({ consultationId, userName }: LiveChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Connect to WebSocket
        const wsUrl = `ws://localhost:8000/api/v1/ws/consultations/${consultationId}`;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log("Connected to chat");
            setConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                // The backend currently just echos the text string
                // Ideally we'd send/receive JSON objects with sender info
                // For now, let's parse if possible, or treat as plain text
                const text = event.data;

                // Simple hack: if text starts with "Me:", ignore (echo) - wait, simple echo server sends back everything.
                // We need to differentiate who sent it.
                // Ideally: send JSON { sender: "Dr. House", text: "Hello" }
                // For now, let's assume incoming messages that ARE NOT matches to what we just sent are "other"
                // But this is hard with async. 
                // Better approach: Handle JSON.

                let msgData;
                try {
                    msgData = JSON.parse(text);
                } catch {
                    msgData = { senderName: "Unknown", text: text };
                }

                if (msgData.senderName !== userName) {
                    const newMsg: Message = {
                        sender: "other",
                        text: msgData.text,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    setMessages((prev) => [...prev, newMsg]);
                }
            } catch (e) {
                console.error("Error parsing message", e);
            }
        };

        ws.onclose = () => {
            console.log("Disconnected from chat");
            setConnected(false);
        };

        return () => {
            ws.close();
        };
    }, [consultationId, userName]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim() || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

        const msgPayload = JSON.stringify({
            senderName: userName, // Using name as ID for simplicity in this demo
            text: inputValue
        });

        socketRef.current.send(msgPayload);

        // Optimistic add
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

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-400'}`}></div>
                    <h3 className="font-semibold text-gray-700">Live Consultation Chat</h3>
                </div>
                {!connected && <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Disconnected</span>}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        <p>Start the conversation...</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.sender === "me"
                                    ? "bg-violet-600 text-white rounded-br-none"
                                    : "bg-white border border-gray-100 text-gray-700 rounded-bl-none"
                                }`}
                        >
                            <p>{msg.text}</p>
                            <span className={`text-[10px] block mt-1 opacity-70 ${msg.sender === "me" ? "text-violet-200" : "text-gray-400"}`}>
                                {msg.time}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100">
                <div className="relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                        disabled={!connected}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || !connected}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:hover:bg-violet-600 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
