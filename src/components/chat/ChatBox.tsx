"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User, Search, Phone, Video, Info, MoreVertical } from "lucide-react";

interface Message {
    id: number;
    sender: string;
    text: string;
    time: string;
    isMe: boolean;
}

interface ChatBoxProps {
    currentUser: string;
    recipientName: string;
    recipientAvatar?: string;
}

export default function ChatBox({ currentUser, recipientName, recipientAvatar }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, sender: recipientName, text: "Hello! How can I help you today?", time: "09:00 AM", isMe: false },
        { id: 2, sender: currentUser, text: "I have some questions about my prescription.", time: "09:05 AM", isMe: true },
    ]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msg: Message = {
            id: Date.now(),
            sender: currentUser,
            text: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true
        };

        setMessages([...messages, msg]);
        setNewMessage("");

        // Simulate response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: recipientName,
                text: "Thank you for your message. I will check and get back to you shortly.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isMe: false
            }]);
        }, 2000);
    };

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                        {recipientAvatar ? <img src={recipientAvatar} alt="" className="w-full h-full rounded-full" /> : recipientName[0]}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{recipientName}</h3>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs text-gray-500 font-medium">Online</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"><Phone className="w-5 h-5" /></button>
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"><Video className="w-5 h-5" /></button>
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"><Info className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] space-y-1`}>
                            <div className={`p-4 rounded-2xl text-sm ${msg.isMe
                                    ? "bg-blue-600 text-white rounded-tr-none shadow-blue-200 shadow-lg"
                                    : "bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm"
                                }`}>
                                {msg.text}
                            </div>
                            <p className={`text-[10px] font-medium text-gray-400 ${msg.isMe ? "text-right" : "text-left"}`}>
                                {msg.time}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
                <div className="relative flex items-center gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message here..."
                        className="flex-1 pl-4 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700"
                    />
                    <button
                        type="submit"
                        className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-90"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
