"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

// Define the shape of the context
interface WebSocketContextType {
    lastMessage: string | null;
    isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
    lastMessage: null,
    isConnected: false,
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lastMessage, setLastMessage] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<NodeJS.Timeout>(null);

    const connect = () => {
        if (typeof window === 'undefined') return;

        // Avoiding multiple connections
        if (ws.current?.readyState === WebSocket.OPEN) return;

        // Use standard WebSocket
        // Using relative path or env var would be better        console.log('Initializing WebSocket Context...');
        
        // Connect securely to the deployed backend WebSocket
        const socket = new WebSocket('wss://najbelbackend-ammicsystems4174-umj4fvky.leapcell.dev/api/v1/ws');

        socket.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
        };

        socket.onmessage = (event) => {
            console.log('WS Message:', event.data);
            setLastMessage(event.data);
            // Optional: Notification/Toast here if we had a library
            // For now, we rely on the UI components to react to lastMessage
        };

        socket.onclose = () => {
            console.log('WebSocket Disconnected. Reconnecting...');
            setIsConnected(false);
            ws.current = null;
            // Reconnect after 3 seconds
            reconnectTimeout.current = setTimeout(connect, 3000);
        };

        socket.onerror = (err) => {
            console.error('WebSocket Error:', err);
            socket.close();
        };

        ws.current = socket;
    };

    useEffect(() => {
        connect();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
        };
    }, []);

    return (
        <WebSocketContext.Provider value={{ lastMessage, isConnected }}>
            {children}
            {/* Connection Indicator specific for the Staff Dashboard */}
            <div className={`fixed bottom-4 right-4 p-2 rounded-full border shadow-lg z-50 transition-colors ${isConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                <div className="flex items-center gap-2 px-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-xs font-bold">{isConnected ? 'Live' : 'Offline'}</span>
                </div>
            </div>
        </WebSocketContext.Provider>
    );
};
