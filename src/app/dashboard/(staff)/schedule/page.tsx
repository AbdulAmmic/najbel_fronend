"use client";

import { useState, useEffect } from "react";
import {
    Calendar as CalendarIcon,
    Clock,
    User,
    Plus,
    ChevronLeft,
    ChevronRight,
    Users
} from "lucide-react";
import { shifts, users } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { useWebSocket } from "@/contexts/WebSocketContext";

export default function SchedulePage() {
    const [allShifts, setAllShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const { lastMessage } = useWebSocket();

    // Simple Weekly Calendar logic (Mocking current week)
    const [currentDate, setCurrentDate] = useState(new Date());

    const [newShiftData, setNewShiftData] = useState({
        user_id: "",
        date: "",
        start_time: "08:00",
        end_time: "16:00",
        shift_type: "Morning",
        notes: ""
    });

    const fetchShifts = async () => {
        try {
            const data = await shifts.getAll();
            setAllShifts(data);
        } catch (error) {
            console.error("Failed to load shifts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShifts();
        // Fetch staff (doctors/nurses)
        users.getAll().then((data: any[]) => { // Explicit type
            const staff = data.filter((u: any) => ['doctor', 'nurse', 'receptionist'].includes(u.role));
            setStaffList(staff);
        }).catch(console.error);
    }, []);

    useEffect(() => {
        if (lastMessage && lastMessage.includes('shift')) {
            fetchShifts();
        }
    }, [lastMessage]);

    const handleAssignShift = async () => {
        try {
            const startDateTime = new Date(`${newShiftData.date}T${newShiftData.start_time}`);
            const endDateTime = new Date(`${newShiftData.date}T${newShiftData.end_time}`);

            await shifts.assign({
                user_id: parseInt(newShiftData.user_id),
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                shift_type: newShiftData.shift_type,
                notes: newShiftData.notes
            });
            fetchShifts();
            setIsAssignModalOpen(false);
        } catch (error) {
            console.error("Failed to assign shift", error);
        }
    };

    const getDaysOfWeek = (date: Date) => {
        const days = [];
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay() + 1); // Start Monday

        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getDaysOfWeek(currentDate);

    const getShiftsForDay = (date: Date) => {
        return allShifts.filter(s => {
            const shiftDate = new Date(s.start_time);
            return shiftDate.getDate() === date.getDate() &&
                shiftDate.getMonth() === date.getMonth() &&
                shiftDate.getFullYear() === date.getFullYear();
        });
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading Rosters...</div>;

    return (
        <div className="p-6 max-w-[1800px] mx-auto space-y-8 h-screen flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Staff Schedule</h1>
                    <p className="text-gray-500 mt-2">Manage shifts and on-call rotations</p>
                </div>
                <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Assign Shift
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
                {/* Calendar Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-gray-500" />
                        {weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </h2>
                    {/* Add prev/next controls here ideally */}
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                    {weekDays.map((day, i) => (
                        <div key={i} className="p-4 text-center border-r border-gray-200 last:border-r-0">
                            <p className="text-xs font-bold text-gray-500 uppercase">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                            <p className={`text-lg font-bold mt-1 ${day.getDate() === new Date().getDate() ? 'text-blue-600' : 'text-gray-900'}`}>
                                {day.getDate()}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Shifts Grid */}
                <div className="grid grid-cols-7 flex-1 divide-x divide-gray-200 overflow-y-auto">
                    {weekDays.map((day, i) => (
                        <div key={i} className="p-2 space-y-2 min-h-[200px]">
                            {getShiftsForDay(day).map(shift => (
                                <div key={shift.id} className={`p-3 rounded-lg border text-sm shadow-sm ${shift.shift_type === 'Morning' ? 'bg-amber-50 border-amber-100' :
                                    shift.shift_type === 'Afternoon' ? 'bg-blue-50 border-blue-100' :
                                        shift.shift_type === 'Night' ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-200'
                                    }`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] font-bold uppercase px-1.5 rounded ${shift.shift_type === 'Morning' ? 'bg-amber-100 text-amber-700' :
                                            shift.shift_type === 'Afternoon' ? 'bg-blue-100 text-blue-700' :
                                                shift.shift_type === 'Night' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-700'
                                            }`}>
                                            {shift.shift_type}
                                        </span>
                                    </div>
                                    <p className="font-bold text-gray-900 line-clamp-1">User #{shift.user_id}</p>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Assign Modal */}
            <AnimatePresence>
                {isAssignModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6"
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Assign Staff Shift</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none"
                                        value={newShiftData.user_id}
                                        onChange={(e) => setNewShiftData({ ...newShiftData, user_id: e.target.value })}
                                    >
                                        <option value="">-- Select Staff --</option>
                                        {staffList.map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none"
                                        value={newShiftData.date}
                                        onChange={(e) => setNewShiftData({ ...newShiftData, date: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                        <input
                                            type="time"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none"
                                            value={newShiftData.start_time}
                                            onChange={(e) => setNewShiftData({ ...newShiftData, start_time: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                        <input
                                            type="time"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none"
                                            value={newShiftData.end_time}
                                            onChange={(e) => setNewShiftData({ ...newShiftData, end_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Shift Type</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none"
                                        value={newShiftData.shift_type}
                                        onChange={(e) => setNewShiftData({ ...newShiftData, shift_type: e.target.value })}
                                    >
                                        <option>Morning</option>
                                        <option>Afternoon</option>
                                        <option>Night</option>
                                        <option>On Call</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleAssignShift}
                                    className="w-full py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
                                >
                                    Assign Shift
                                </button>
                                <button
                                    onClick={() => setIsAssignModalOpen(false)}
                                    className="w-full py-2 text-gray-500 hover:bg-gray-50 rounded-xl font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
