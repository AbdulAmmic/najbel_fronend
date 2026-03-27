"use client";

import { useState, useEffect } from "react";
import { X, Search, User, MapPin, Calendar, Clock, AlertTriangle, CheckCircle, ChevronRight, UserPlus } from "lucide-react";
import { appointments, patients } from "@/services/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CheckInModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CheckInModal({ onClose, onSuccess }: CheckInModalProps) {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Find, 2: Action, 3: Confirm
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [searching, setSearching] = useState(false);

    // Action State
    const [todaysAppointment, setTodaysAppointment] = useState<any>(null);
    const [checkInLoading, setCheckInLoading] = useState(false);

    // Step 1: Search Patient
    useEffect(() => {
        if (searchTerm.length > 2) {
            const delay = setTimeout(async () => {
                setSearching(true);
                try {
                    const data = await patients.getAll();
                    const filtered = data.filter((p: any) =>
                        (p.full_name || p.user?.full_name)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.unique_id?.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    setSearchResults(filtered);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setSearching(false);
                }
            }, 500);
            return () => clearTimeout(delay);
        } else {
            setSearchResults([]);
        }
    }, [searchTerm]);

    // When patient is selected, check for existing appointments
    const handlePatientSelect = async (patient: any) => {
        setSelectedPatient(patient);
        setSearching(true);
        try {
            // Check for appointments
            const allAppointments = await appointments.getAll();
            // In a real app, use a specific endpoint: /appointments?patient_id=X&date=today
            const today = new Date().toDateString();
            const found = allAppointments.find((a: any) =>
                a.patient_id === patient.id &&
                new Date(a.appointment_time).toDateString() === today &&
                ['pending', 'confirmed'].includes(a.status)
            );

            if (found) {
                setTodaysAppointment(found);
            } else {
                setTodaysAppointment(null);
            }
            setStep(2);
        } catch (error) {
            console.error("Failed to check appointments", error);
        } finally {
            setSearching(false);
        }
    };

    const handleCheckIn = async () => {
        if (!todaysAppointment) return;
        setCheckInLoading(true);
        try {
            // If confirmed, update to checked-in
            await appointments.updateStatus(todaysAppointment.id, 'checked-in');
            setStep(3); // Success Screen
        } catch (error) {
            console.error("Check-in failed", error);
            alert("Failed to check in");
        } finally {
            setCheckInLoading(false);
        }
    };

    const handleWalkInRedirect = () => {
        // Close modal and let parent handle redirect or just redirect
        onClose();
        router.push("/dashboard/reception/register?mode=walk-in"); // Example redirect
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <MapPin className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-lg">Patient Arrival</h2>
                            <p className="text-xs text-gray-500">Check-in or Walk-in</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Step 1: Find Patient */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center space-y-2 mb-8">
                                <h3 className="text-xl font-bold text-gray-900">Who has arrived?</h3>
                                <p className="text-gray-500">Search patient to check for appointments</p>
                            </div>

                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search name or ID..."
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-lg"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {searching ? (
                                    <div className="text-center py-8 text-gray-400">Searching...</div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(patient => (
                                        <button
                                            key={patient.id}
                                            onClick={() => handlePatientSelect(patient)}
                                            className="w-full p-4 flex items-center gap-4 bg-white border border-gray-100 hover:border-green-500 hover:shadow-md rounded-xl transition-all group text-left"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold text-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                                                {(patient.full_name || patient.user?.full_name)?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-lg group-hover:text-green-600 transition-colors">{patient.full_name || patient.user?.full_name}</p>
                                                <p className="text-sm text-gray-500">ID: {patient.unique_id}</p>
                                            </div>
                                            <ChevronRight className="ml-auto w-5 h-5 text-gray-300 group-hover:text-green-500" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        Can't find them? <Link href="/dashboard/reception/register" className="text-green-600 font-bold hover:underline">Register New Patient</Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Action */}
                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Patient Header */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-12 h-12 rounded-full bg-white text-gray-600 flex items-center justify-center font-bold text-xl shadow-sm border border-gray-100">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{selectedPatient?.full_name || selectedPatient?.user?.full_name}</p>
                                    <p className="text-sm text-gray-500">ID: {selectedPatient?.unique_id}</p>
                                </div>
                                <button onClick={() => setStep(1)} className="ml-auto text-sm text-gray-500 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">Change</button>
                            </div>

                            {todaysAppointment ? (
                                <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center space-y-4">
                                    <div className="w-16 h-16 bg-white text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                        <Calendar className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-green-900">Appointment Found!</h3>
                                        <p className="text-green-700">Scheduled for {new Date(todaysAppointment.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        <p className="text-sm text-green-600 mt-1">Dr. {todaysAppointment.doctor?.user?.full_name || 'Assigned Doctor'}</p>
                                    </div>

                                    <button
                                        onClick={handleCheckIn}
                                        disabled={checkInLoading}
                                        className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        {checkInLoading ? 'Checking In...' : 'Check In Now'}
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 text-center space-y-4">
                                    <div className="w-16 h-16 bg-white text-orange-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                        <AlertTriangle className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-orange-900">No Appointment Today</h3>
                                        <p className="text-orange-700">This patient doesn't have a scheduled visit for today.</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            onClick={handleWalkInRedirect}
                                            className="w-full py-3 bg-white border-2 border-orange-200 text-orange-700 font-bold rounded-xl hover:bg-orange-100 transition-colors"
                                        >
                                            Book Walk-in Visit
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Success */}
                    {step === 3 && (
                        <div className="text-center py-12 animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-2">Checked In!</h3>
                            <p className="text-gray-500 mb-8">Patient has been added to the waiting queue.</p>

                            <button
                                onClick={() => { onSuccess(); onClose(); }}
                                className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-shadow shadow-lg"
                            >
                                Done
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
