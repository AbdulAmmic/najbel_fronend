'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VideoConference from '@/components/video/VideoConference';
import api from '@/services/api';

// Define types locally if not imported
interface User {
    full_name: string;
    email: string;
    role?: string;
}

interface AppointmentType {
    id: number;
    meeting_link: string | null;
    doctor?: { user: User };
    patient?: { user: User };
}

export default function MeetingPage() {
    const params = useParams();
    const router = useRouter();
    const [appointment, setAppointment] = useState<AppointmentType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<{ name: string; email?: string } | null>(null);

    useEffect(() => {
        // ID must be present
        if (!params.id) return;

        const fetchData = async () => {
            try {
                // 1. Get current user
                const userRes = await api.get('/users/me');

                const user = userRes.data;
                const name = user.role === 'doctor' ? `Dr. ${user.full_name}` : user.full_name;
                setCurrentUser({ name, email: user.email });

                // 2. Get Appointment
                const apptRes = await api.get(`/appointments/${params.id}`);
                setAppointment(apptRes.data);
                
                // 3. Auto-mark as completed if a Doctor joins the meeting
                if (user.role === 'doctor' && apptRes.data.status !== 'completed') {
                    try {
                        await api.put(`/appointments/${params.id}`, { status: 'completed' });
                    } catch (statusErr) {
                        console.error('Failed to auto-complete appointment:', statusErr);
                    }
                }
            } catch (err: any) {
                console.error(err);
                if (err.response?.status === 401) {
                    router.push('/login');
                    return;
                }
                setError("Could not load meeting details.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.id, router]);

    if (loading) return <div className="h-screen flex items-center justify-center">Loading Meeting...</div>;

    if (error || !appointment) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-red-500 text-lg">{error || "Meeting not found"}</p>
                <button onClick={() => router.back()} className="px-4 py-2 bg-gray-200 rounded">Go Back</button>
            </div>
        );
    }

    // Parse room name from link or fallback
    let roomName = `najbel-${appointment.id}-fallback`;
    if (appointment.meeting_link) {
        const parts = appointment.meeting_link.split('/');
        roomName = parts[parts.length - 1];
    }

    return (
        <VideoConference
            roomName={roomName}
            displayName={currentUser?.name || 'Guest'}
            email={currentUser?.email}
            onClose={() => router.back()}
        />
    );
}
