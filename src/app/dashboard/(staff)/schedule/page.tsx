"use client";

import { Calendar, Clock, User, FileText, Video as VideoIcon } from "lucide-react";
import { appointments } from "@/services/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Appointment {
    id: number;
    patient_id: number;
    doctor_id: number;
    appointment_time: string;
    status: string;
    type: string;
    reason: string;
    meeting_link?: string;
    patient?: { // Depending on if backend enriches it, or we need to fetch
        full_name: string;
    }
}

export default function SchedulePage() {
    const [schedule, setSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const data = await appointments.getAll();
                setSchedule(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, []);

    const handleStartConsultation = (appointmentId: number) => {
        router.push(`/dashboard/consultations/${appointmentId}`);
    };

    const handleJoinMeeting = (link: string) => {
        window.open(link, '_blank');
    };

    return (
        <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Calendar className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
                    <p className="text-gray-500">Your upcoming appointments</p>
                </div>
            </div>

            {loading ? (
                <div>Loading schedule...</div>
            ) : schedule.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
                    <p className="text-gray-500">No appointments scheduled.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {schedule.map((app) => (
                        <div key={app.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex justify-between items-center">
                            <div className="flex gap-6 items-center">
                                <div className="flex flex-col items-center justify-center w-16 h-16 bg-blue-50 text-blue-700 rounded-xl">
                                    <span className="text-xs font-bold uppercase">{new Date(app.appointment_time).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="text-xl font-bold">{new Date(app.appointment_time).getDate()}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-medium text-gray-600">
                                            {new Date(app.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${app.type === 'ONLINE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {app.type}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                        Appointment #{app.id}
                                    </h3>
                                    <p className="text-gray-500 text-sm">{app.reason}</p>
                                    {app.type === 'ONLINE' && app.meeting_link && (
                                        <a href={app.meeting_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
                                            <VideoIcon className="w-3 h-3" />
                                            Join Meeting: {app.meeting_link}
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {app.type === 'ONLINE' && app.meeting_link && (
                                    <button
                                        onClick={() => handleJoinMeeting(app.meeting_link)}
                                        className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-200 transition shadow-sm flex items-center gap-2"
                                    >
                                        <VideoIcon className="w-4 h-4" />
                                        Join
                                    </button>
                                )}
                                <button
                                    onClick={() => handleStartConsultation(app.id)}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
                                >
                                    Start Consultation
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
