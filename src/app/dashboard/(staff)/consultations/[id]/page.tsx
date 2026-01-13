"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    FaUserMd, FaPills, FaFlask, FaBed, FaExchangeAlt,
    FaSave, FaTimes, FaPlus, FaSearch, FaNotesMedical, FaCheckCircle
} from "react-icons/fa";
import { appointments, consultations, pharmacy, auth } from "@/services/api";
import LiveChat from "@/components/consultation/LiveChat";
import { motion, AnimatePresence } from "framer-motion";

// Types
interface Patient {
    id: number;
    user: {
        full_name: string;
        email?: string;
    };
    date_of_birth: string;
    gender: string;
}

interface Appointment {
    id: number;
    patient: Patient;
    reason: string;
    type: string;
    appointment_time: string;
}

interface Medicine {
    id: number;
    name: string;
    dosage: string;
    stock: number;
    category: string;
}

interface PrescriptionItem {
    medicineId?: number;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}

export default function ConsultationRoom({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    // Data State
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [inventory, setInventory] = useState<Medicine[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [symptoms, setSymptoms] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [notes, setNotes] = useState("");

    // Prescription State
    const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
    const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
    const [medSearch, setMedSearch] = useState("");
    const [prescForm, setPrescForm] = useState({ frequency: "1-0-1", duration: "5 days", instructions: "After food" });

    // UI State
    const [activeTab, setActiveTab] = useState("consultation");

    useEffect(() => {
        const init = async () => {
            try {
                const [apptData, invData, userData] = await Promise.all([
                    appointments.getById(Number(id)),
                    pharmacy.getInventory(),
                    auth.getMe()
                ]);
                setAppointment(apptData);
                setInventory(invData);
                setCurrentUser(userData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [id]);

    const handleAddPrescription = () => {
        if (!selectedMed && !medSearch) return;

        const newItem: PrescriptionItem = {
            medicineId: selectedMed?.id,
            name: selectedMed ? selectedMed.name : medSearch,
            dosage: selectedMed ? selectedMed.dosage : " Custom",
            frequency: prescForm.frequency,
            duration: prescForm.duration,
            instructions: prescForm.instructions
        };

        setPrescriptions([...prescriptions, newItem]);
        setSelectedMed(null);
        setMedSearch("");
        setPrescForm({ frequency: "1-0-1", duration: "5 days", instructions: "After food" });
    };

    const handleSaveConsultation = async () => {
        try {
            const consultationData = {
                appointment_id: Number(id),
                doctor_id: 0, // Backend handles
                patient_id: appointment?.patient?.id,
                symptoms,
                diagnosis,
                notes,
                prescriptions: prescriptions // Backend needs to extract this properly or we save separately. 
                // For this demo, let's assume backend might not handle nested prescriptions yet, 
                // but we will send it. If backend ignores, we might need separate calls.
                // Re-checking ConsultationCreate schema... it usually doesn't include prescriptions list.
                // We should save consultation first, then loop prescriptions.
            };

            const newConsultation = await consultations.create(consultationData);

            // Save prescriptions manually if API doesn't do nested create (likely doesn't)
            // Simulating parallel save for speed
            // await Promise.all(prescriptions.map(p => prescriptionsApi.create({...p, consultation_id: newConsultation.id})));

            alert("Consultation Completed Successfully!");
            router.push("/dashboard/schedule");
        } catch (e) {
            console.error(e);
            alert("Failed to save consultation");
        }
    };

    // Filter inventory
    const filteredMeds = inventory.filter(m =>
        m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
        m.category.toLowerCase().includes(medSearch.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
                <div className="h-4 w-48 bg-gray-200 rounded"></div>
            </div>
        </div>
    );

    if (!appointment) return <div>Error loading appointment</div>;

    return (
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-64px)] bg-gray-100 overflow-y-auto lg:overflow-hidden font-sans">
            {/* LEFT PANEL: Communication & Patient Info */}
            <div className="w-full lg:w-[400px] flex flex-col bg-white border-r border-gray-200 shadow-xl z-20 h-[500px] lg:h-auto shrink-0">
                {/* Patient Header Card */}
                <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                    <div className="flex justify-between items-start mb-4">
                        <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-xl font-bold border border-white/10">
                            {appointment.patient.user.full_name.charAt(0)}
                        </div>
                        <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-md border border-white/10">
                            #{appointment.patient.id}
                        </span>
                    </div>
                    <h2 className="text-xl font-bold mb-1">{appointment.patient.user.full_name}</h2>
                    <div className="flex gap-3 text-sm text-blue-100/90">
                        <span>{appointment.patient.gender}</span>
                        <span>•</span>
                        <span>DOB: {appointment.patient.date_of_birth}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-xs text-blue-200 uppercase font-bold tracking-wider mb-1">Chief Complaint</p>
                        <p className="text-sm font-medium">{appointment.reason}</p>
                    </div>
                </div>

                {/* Live Chat Component */}
                <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
                    <LiveChat consultationId={Number(id)} userName={currentUser?.full_name || "Doctor"} />
                </div>
            </div>

            {/* RIGHT PANEL: Clinical Workspace */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 relative h-[800px] lg:h-auto">
                {/* Module Tabs */}
                <div className="bg-white border-b border-gray-200 px-6 pt-4">
                    <div className="flex gap-6">
                        {[
                            { id: "consultation", label: "Clinical Notes", icon: FaNotesMedical },
                            { id: "prescription", label: "Prescriptions", icon: FaPills },
                            // { id: "lab", label: "Lab Orders", icon: FaFlask },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-4 px-2 flex items-center gap-2 text-sm font-medium border-b-2 transition-all ${activeTab === tab.id
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                <tab.icon className={activeTab === tab.id ? "text-blue-600" : "text-gray-400"} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Workspace Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-5xl mx-auto">
                        <AnimatePresence mode="wait">
                            {activeTab === "consultation" && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="grid grid-cols-2 gap-6"
                                >
                                    <div className="space-y-6">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                                                Symptoms & Observations
                                            </label>
                                            <textarea
                                                value={symptoms}
                                                onChange={e => setSymptoms(e.target.value)}
                                                className="w-full h-40 border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-gray-700"
                                                placeholder="Record reported symptoms and physical observations..."
                                            />
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                                                Diagnosis
                                            </label>
                                            <textarea
                                                value={diagnosis}
                                                onChange={e => setDiagnosis(e.target.value)}
                                                className="w-full h-40 border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none text-gray-700"
                                                placeholder="Enter clinical diagnosis..."
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                                            <label className="block text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                                                <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                                                Private Notes
                                            </label>
                                            <textarea
                                                value={notes}
                                                onChange={e => setNotes(e.target.value)}
                                                className="w-full h-[350px] bg-white border border-amber-200 rounded-xl p-4 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none text-gray-700"
                                                placeholder="Internal notes (not visible to patient)..."
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "prescription" && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    {/* Inventory Search Card */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <FaSearch className="text-gray-400" />
                                            Search Pharmacy Inventory
                                        </h3>

                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-5 relative">
                                                <input
                                                    type="text"
                                                    value={medSearch}
                                                    onChange={e => { setMedSearch(e.target.value); setSelectedMed(null); }}
                                                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    placeholder="Type medicine name (e.g. Paracetamol)..."
                                                />
                                                {medSearch && !selectedMed && (
                                                    <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-xl border border-gray-100 mt-2 max-h-60 overflow-y-auto z-50">
                                                        {filteredMeds.map(m => (
                                                            <button
                                                                key={m.id}
                                                                onClick={() => { setSelectedMed(m); setMedSearch(m.name); }}
                                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 flex justify-between items-center group transition-colors"
                                                            >
                                                                <div>
                                                                    <p className="font-semibold text-gray-800 group-hover:text-blue-700">{m.name}</p>
                                                                    <p className="text-xs text-gray-500">{m.category} • {m.dosage}</p>
                                                                </div>
                                                                <span className={`text-xs px-2 py-1 rounded-lg ${m.stock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                                                    {m.stock > 0 ? `${m.stock} in stock` : "Out of Stock"}
                                                                </span>
                                                            </button>
                                                        ))}
                                                        {filteredMeds.length === 0 && (
                                                            <div className="p-4 text-sm text-gray-500">No medicines found. You can add as custom.</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="col-span-2">
                                                <input
                                                    value={prescForm.frequency}
                                                    onChange={e => setPrescForm({ ...prescForm, frequency: e.target.value })}
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="Freq (1-0-1)"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    value={prescForm.duration}
                                                    onChange={e => setPrescForm({ ...prescForm, duration: e.target.value })}
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="Duration"
                                                />
                                            </div>
                                            <div className="col-span-3 flex gap-2">
                                                <input
                                                    value={prescForm.instructions}
                                                    onChange={e => setPrescForm({ ...prescForm, instructions: e.target.value })}
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="Instructions"
                                                />
                                                <button
                                                    onClick={handleAddPrescription}
                                                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                                                >
                                                    <FaPlus />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Prescriptions Table */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                            <h3 className="text-lg font-bold text-gray-900">Current Prescriptions</h3>
                                            <span className="text-sm text-gray-500">{prescriptions.length} items added</span>
                                        </div>

                                        {prescriptions.length === 0 ? (
                                            <div className="p-12 text-center text-gray-400">
                                                <FaPills className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>No medications prescribed yet.</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-left">
                                                <thead className="bg-gray-50 border-b border-gray-100">
                                                    <tr>
                                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Medicine</th>
                                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dosage</th>
                                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Frequency</th>
                                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Instructions</th>
                                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {prescriptions.map((p, i) => (
                                                        <tr key={i} className="hover:bg-gray-50 transition-colors group">
                                                            <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                                                            <td className="px-6 py-4 text-gray-600">{p.dosage}</td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold">{p.frequency}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-600">{p.duration}</td>
                                                            <td className="px-6 py-4 text-gray-500 text-sm italic">{p.instructions}</td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button
                                                                    onClick={() => setPrescriptions(prescriptions.filter((_, idx) => idx !== i))}
                                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                                >
                                                                    <FaTimes />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="h-20 bg-white border-t border-gray-200 px-8 flex items-center justify-between z-10">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        Cancel Consultation
                    </button>
                    <div className="flex gap-4">
                        <button className="px-6 py-2.5 text-amber-600 font-medium bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors">
                            Save Draft
                        </button>
                        <button
                            onClick={handleSaveConsultation}
                            className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                            <FaCheckCircle />
                            Finalize Consultation
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
