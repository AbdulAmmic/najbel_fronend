"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Mic,
    MicOff,
    Stethoscope,
    Pill,
    TestTube,
    User,
    Calendar,
    Clock,
    Heart,
    Activity,
    Thermometer,
    FileText,
    MessageSquare,
    Bed,
    Send,
    Brain,
    History,
    AlertCircle,
    X,
    Save,
    Check,
    Plus,
    ChevronDown,
    ChevronRight
} from "lucide-react";
import { appointments, patients, labs, departments, beds, prescriptions as prescriptionsApi, consultations } from "@/services/api";
import { formatDate, calculateAge } from "@/utils/date";

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

// Interfaces
interface LabTest {
    id: number;
    name: string;
    code: string;
    duration: string;
}

interface Prescription {
    id: number;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
}

export default function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [activeTab, setActiveTab] = useState("notes");
    const [isRecording, setIsRecording] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);
    const [activeTextarea, setActiveTextarea] = useState<string | null>(null);
    const activeTextareaRef = useRef<string | null>(null);

    // Data State
    const [loading, setLoading] = useState(true);
    const [appointment, setAppointment] = useState<any>(null);
    const [patient, setPatient] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    // Available Resources State
    const [availableLabs, setAvailableLabs] = useState<any[]>([]);
    const [availableDepts, setAvailableDepts] = useState<any[]>([]);
    const [availableBeds, setAvailableBeds] = useState<any[]>([]);

    // Form states
    const [symptoms, setSymptoms] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [notes, setNotes] = useState("");
    const [aiSummary, setAiSummary] = useState("");
    const [showAiModal, setShowAiModal] = useState(false);

    // Lab requests
    const [selectedLabs, setSelectedLabs] = useState<LabTest[]>([]);
    const [labNote, setLabNote] = useState("");

    // Referral
    const [referralDept, setReferralDept] = useState("");
    const [referralReason, setReferralReason] = useState("");

    // Admission
    const [admissionType, setAdmissionType] = useState("observation");
    const [selectedRoom, setSelectedRoom] = useState("");
    const [admissionReason, setAdmissionReason] = useState("");

    // Prescriptions
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [currentMed, setCurrentMed] = useState({ name: "", dosage: "", frequency: "1-0-1", duration: "7 days" });

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const rec = new SpeechRecognition();
                rec.continuous = false;
                rec.interimResults = false;
                rec.lang = 'en-US';

                rec.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    switch (activeTextareaRef.current) {
                        case 'symptoms':
                            setSymptoms(prev => prev + " " + transcript);
                            break;
                        case 'diagnosis':
                            setDiagnosis(prev => prev + " " + transcript);
                            break;
                        case 'notes':
                            setNotes(prev => prev + " " + transcript);
                            break;
                    }
                };

                rec.onend = () => setIsRecording(false);
                setRecognition(rec);
            }
        }
    }, []);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Appointment to get Patient ID
                const apptData = await appointments.getById(Number(id));
                setAppointment(apptData);

                if (apptData?.patient_id) {
                    // 2. Fetch Patient Details
                    // First check if patient is nested in appointment, otherwise fetch
                    let patientData = apptData.patient;
                    if (!patientData) {
                        patientData = await patients.getById(apptData.patient_id);
                    }
                    setPatient(patientData);

                    // 3. Get Patient History from patient detail record
                    try {
                        const fullPatient = await patients.getById(apptData.patient_id);
                        const historyData = fullPatient?.consultations || fullPatient?.history || [];
                        setHistory(Array.isArray(historyData) ? historyData : []);
                    } catch (e) {
                        console.warn("Failed to load history", e);
                        setHistory([]);
                    }
                }

                // 4. Fetch Resources (Labs, Beds, Depts)
                const [labsData, bedsData, deptsData] = await Promise.all([
                    labs.getAll().catch(() => []),
                    beds.getAll().catch(() => []),
                    departments.getAll().catch(() => [])
                ]);

                setAvailableLabs(Array.isArray(labsData) ? labsData : []);
                setAvailableBeds(Array.isArray(bedsData) ? bedsData : []);
                setAvailableDepts(Array.isArray(deptsData) ? deptsData : []);

            } catch (error) {
                console.error("Failed to load consultation data", error);
                // Optionally redirect or show error
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    const startRecording = (textarea: string) => {
        setActiveTextarea(textarea);
        activeTextareaRef.current = textarea;
        if (recognition) {
            try {
                recognition.start();
                setIsRecording(true);
            } catch (e) {
                console.error("Error starting recognition", e);
            }
        }
    };

    const stopRecording = () => {
        if (recognition) {
            recognition.stop();
            setIsRecording(false);
        }
    };

    const toggleRecording = (textarea: string) => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording(textarea);
        }
    };

    const handleAddMedication = () => {
        if (currentMed.name) {
            setPrescriptions([...prescriptions, { ...currentMed, id: Date.now() }]);
            setCurrentMed({ name: "", dosage: "", frequency: "1-0-1", duration: "7 days" });
        }
    };

    const handleAddLab = (lab: any) => {
        const newLab: LabTest = {
            id: lab.id,
            name: lab.test_name || lab.name || "Unknown Test",
            code: lab.code || "LAB",
            duration: lab.turnaround_time || "24h"
        };
        if (!selectedLabs.find((l) => l.id === newLab.id)) {
            setSelectedLabs([...selectedLabs, newLab]);
        }
    };

    const handleCompleteConsultation = async () => {
        try {
            // Create Consultation Record
            const consultationData = {
                appointment_id: Number(id),
                patient_id: appointment?.patient_id,
                doctor_id: appointment?.doctor_id, // Or current user id
                visit_date: new Date().toISOString(),
                symptoms: symptoms,
                diagnosis: diagnosis,
                notes: notes,
                prescriptions: prescriptions, // API might need specific format
                lab_requests: selectedLabs.map(l => l.id),
                referral: referralDept ? { department: referralDept, reason: referralReason } : null,
                admission: admissionType !== 'observation' ? { type: admissionType, room_id: selectedRoom, reason: admissionReason } : null
            };

            // Call API
            await consultations.create(consultationData);

            // Mark appointment as completed
            await appointments.updateStatus(Number(id), 'completed');

            alert("Consultation completed and saved!");
            router.push("/dashboard/Doctor");
        } catch (error) {
            console.error("Failed to complete consultation", error);
            alert("Failed to save consultation details. Please try again.");
        }
    };

    const generateAiSummary = () => {
        const pName = patient?.user?.full_name || patient?.full_name || "Patient";
        const pAge = calculateAge(patient?.dob) + "yrs";
        const pGender = patient?.gender || "N/A";

        const summary = `
Patient: ${pName}
Age: ${pAge} | Gender: ${pGender}
Date: ${new Date().toLocaleDateString()}

Primary Diagnosis: ${diagnosis || "Pending"}
Key Symptoms: ${symptoms || "Not recorded"}
Prescribed Medications: ${prescriptions.length} medication(s)
Lab Tests Ordered: ${selectedLabs.length} test(s)
Follow-up Required: Yes
Status: ${admissionType === 'observation' ? 'Observation' : admissionType === 'admit' ? 'Admission Recommended' : 'Outpatient'}

Recommendations: Continue monitoring vitals. Follow-up in 2 weeks.
    `;
        setAiSummary(summary);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Stethoscope className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Consultation Room</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>Patient ID: #{patient?.id || id}</span>
                                <span>•</span>
                                <span>{formatDate(new Date())}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowAiModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Brain className="h-4 w-4" />
                            AI Summary
                        </button>
                        <button
                            onClick={handleCompleteConsultation}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <Check className="h-4 w-4" />
                            Complete
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row p-4 gap-4">
                {/* Left Sidebar - Patient Info */}
                <div className="lg:w-80 space-y-4">
                    {/* Patient Card */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{patient?.user?.full_name || patient?.full_name || "Unknown Patient"}</h3>
                                <p className="text-sm text-gray-500">
                                    {calculateAge(patient?.dob)}yrs • {patient?.gender || "N/A"} • {patient?.blood_group || "N/A"}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-medium text-gray-400 mb-1">Conditions</p>
                                <div className="flex flex-wrap gap-1">
                                    {/* Real data might not have 'conditions' array directly, using placeholer or safe access */}
                                    {(patient?.conditions || ["None recorded"]).map((cond: string, i: number) => (
                                        <span key={i} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                            {cond}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-gray-400 mb-1">Allergies</p>
                                <div className="flex flex-wrap gap-1">
                                    {(patient?.allergies || ["None known"]).map((allergy: string, i: number) => (
                                        <span key={i} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded">
                                            {allergy}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-100">
                                <p className="text-xs font-medium text-gray-400 mb-2">Vital Signs (Latest)</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-center p-2 border border-gray-100 rounded">
                                        <Activity className="h-4 w-4 text-red-500 mx-auto mb-1" />
                                        <p className="text-sm font-bold">{patient?.latest_vitals?.bp || "N/A"}</p>
                                        <p className="text-[10px] text-gray-500">BP</p>
                                    </div>
                                    <div className="text-center p-2 border border-gray-100 rounded">
                                        <Heart className="h-4 w-4 text-pink-500 mx-auto mb-1" />
                                        <p className="text-sm font-bold">{patient?.latest_vitals?.heart_rate || "N/A"}</p>
                                        <p className="text-[10px] text-gray-500">HR</p>
                                    </div>
                                    <div className="text-center p-2 border border-gray-100 rounded">
                                        <Thermometer className="h-4 w-4 text-orange-500 mx-auto mb-1" />
                                        <p className="text-sm font-bold">{patient?.latest_vitals?.temperature || "N/A"}</p>
                                        <p className="text-[10px] text-gray-500">Temp</p>
                                    </div>
                                    <div className="text-center p-2 border border-gray-100 rounded">
                                        <Activity className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                                        <p className="text-sm font-bold">{patient?.latest_vitals?.spo2 || "N/A"}</p>
                                        <p className="text-[10px] text-gray-500">SpO₂</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History Button */}
                    <button
                        onClick={() => setActiveTab("history")}
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <History className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-gray-900">History</p>
                                <p className="text-sm text-gray-500">{history.length} past records</p>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {/* Tabs */}
                    <div className="bg-white rounded-xl border border-gray-200 mb-4">
                        <div className="flex border-b border-gray-200">
                            {[
                                { id: "notes", label: "Clinical Notes", icon: FileText },
                                { id: "prescribe", label: "Prescribe", icon: Pill },
                                { id: "labs", label: "Lab Tests", icon: TestTube },
                                { id: "refer", label: "Refer", icon: Send },
                                { id: "admit", label: "Admit", icon: Bed },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium ${activeTab === tab.id
                                        ? "text-blue-600 border-b-2 border-blue-600"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {/* Clinical Notes */}
                            {activeTab === "notes" && (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                                                Symptoms & Observations
                                                <button
                                                    onClick={() => toggleRecording('symptoms')}
                                                    className={`p-2 rounded-full ${isRecording && activeTextarea === 'symptoms' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
                                                >
                                                    {isRecording && activeTextarea === 'symptoms' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                                </button>
                                            </label>
                                            <textarea
                                                value={symptoms}
                                                onChange={(e) => setSymptoms(e.target.value)}
                                                className="w-full h-32 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Describe patient symptoms..."
                                            />
                                            {isRecording && activeTextarea === 'symptoms' && (
                                                <div className="text-sm text-red-600 mt-2 flex items-center gap-2">
                                                    <div className="animate-pulse w-2 h-2 bg-red-600 rounded-full"></div>
                                                    Recording...
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                                                Diagnosis
                                                <button
                                                    onClick={() => toggleRecording('diagnosis')}
                                                    className={`p-2 rounded-full ${isRecording && activeTextarea === 'diagnosis' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
                                                >
                                                    {isRecording && activeTextarea === 'diagnosis' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                                </button>
                                            </label>
                                            <textarea
                                                value={diagnosis}
                                                onChange={(e) => setDiagnosis(e.target.value)}
                                                className="w-full h-24 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Enter diagnosis..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                                                Notes
                                                <button
                                                    onClick={() => toggleRecording('notes')}
                                                    className={`p-2 rounded-full ${isRecording && activeTextarea === 'notes' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
                                                >
                                                    {isRecording && activeTextarea === 'notes' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                                </button>
                                            </label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                className="w-full h-32 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Additional notes..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Prescriptions */}
                            {activeTab === "prescribe" && (
                                <div className="space-y-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                            <input
                                                value={currentMed.name}
                                                onChange={(e) => setCurrentMed({ ...currentMed, name: e.target.value })}
                                                className="p-2 border border-gray-300 rounded"
                                                placeholder="Medication name"
                                            />
                                            <input
                                                value={currentMed.dosage}
                                                onChange={(e) => setCurrentMed({ ...currentMed, dosage: e.target.value })}
                                                className="p-2 border border-gray-300 rounded"
                                                placeholder="Dosage"
                                            />
                                            <select
                                                value={currentMed.frequency}
                                                onChange={(e) => setCurrentMed({ ...currentMed, frequency: e.target.value })}
                                                className="p-2 border border-gray-300 rounded"
                                            >
                                                <option value="1-0-1">1-0-1</option>
                                                <option value="0-0-1">0-0-1</option>
                                                <option value="1-1-1">1-1-1</option>
                                                <option value="SOS">SOS</option>
                                            </select>
                                            <div className="flex gap-2">
                                                <input
                                                    value={currentMed.duration}
                                                    onChange={(e) => setCurrentMed({ ...currentMed, duration: e.target.value })}
                                                    className="flex-1 p-2 border border-gray-300 rounded"
                                                    placeholder="Duration"
                                                />
                                                <button
                                                    onClick={handleAddMedication}
                                                    className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                >
                                                    <Plus className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {prescriptions.length > 0 && (
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="p-3 text-left">Medication</th>
                                                        <th className="p-3 text-left">Dosage</th>
                                                        <th className="p-3 text-left">Frequency</th>
                                                        <th className="p-3 text-left">Duration</th>
                                                        <th className="p-3 text-left"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {prescriptions.map((med) => (
                                                        <tr key={med.id}>
                                                            <td className="p-3">{med.name}</td>
                                                            <td className="p-3">{med.dosage}</td>
                                                            <td className="p-3">
                                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                                                    {med.frequency}
                                                                </span>
                                                            </td>
                                                            <td className="p-3">{med.duration}</td>
                                                            <td className="p-3">
                                                                <button
                                                                    onClick={() => setPrescriptions(prescriptions.filter(m => m.id !== med.id))}
                                                                    className="text-red-500 hover:text-red-700"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Lab Tests */}
                            {activeTab === "labs" && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Request Lab Tests</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {availableLabs.length > 0 ? availableLabs.map((lab) => (
                                                <div
                                                    key={lab.id}
                                                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                                                    onClick={() => handleAddLab(lab)}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-gray-900">{lab.test_name || lab.name}</span>
                                                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                                            {lab.code || "LAB"}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Results in {lab.turnaround_time || "24h"}
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="text-sm text-gray-500 col-span-3">No lab tests available in system.</p>
                                            )}
                                        </div>
                                    </div>

                                    {selectedLabs.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Selected Tests ({selectedLabs.length})</label>
                                            <div className="space-y-2">
                                                {selectedLabs.map((lab) => (
                                                    <div key={lab.id} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                                                        <div>
                                                            <span className="font-medium">{lab.name}</span>
                                                            <span className="text-sm text-gray-500 ml-3">{lab.code}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => setSelectedLabs(selectedLabs.filter(l => l.id !== lab.id))}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes for Lab</label>
                                        <textarea
                                            value={labNote}
                                            onChange={(e) => setLabNote(e.target.value)}
                                            className="w-full h-24 border border-gray-300 rounded-lg p-3"
                                            placeholder="Add specific instructions for lab..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Refer to Another Doctor */}
                            {activeTab === "refer" && (
                                <div className="max-w-2xl space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Department</label>
                                        <select
                                            value={referralDept}
                                            onChange={(e) => setReferralDept(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg"
                                        >
                                            <option value="">Choose a department</option>
                                            {availableDepts.map((dept) => (
                                                <option key={dept.id || dept} value={dept.id || dept}>{dept.name || dept}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Referral</label>
                                        <textarea
                                            value={referralReason}
                                            onChange={(e) => setReferralReason(e.target.value)}
                                            className="w-full h-32 border border-gray-300 rounded-lg p-3"
                                            placeholder="Explain why you're referring this patient..."
                                        />
                                    </div>

                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-yellow-800">Note</p>
                                                <p className="text-sm text-yellow-700 mt-1">
                                                    This will transfer the patient's case to the selected department.
                                                    You will no longer have primary responsibility for this patient.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Admit Patient */}
                            {activeTab === "admit" && (
                                <div className="max-w-2xl space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Admission Type</label>
                                        <div className="flex gap-4">
                                            {[
                                                { id: "observation", label: "Observation" },
                                                { id: "admit", label: "Full Admission" },
                                                { id: "emergency", label: "Emergency" },
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    onClick={() => setAdmissionType(type.id)}
                                                    className={`px-4 py-2 rounded-lg ${admissionType === type.id
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                        }`}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Room</label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {availableBeds.length > 0 ? availableBeds.map((room) => (
                                                <div
                                                    key={room.id}
                                                    onClick={() => setSelectedRoom(room.id)}
                                                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedRoom === room.id
                                                        ? "border-blue-500 bg-blue-50"
                                                        : "border-gray-200 hover:border-gray-300"
                                                        } ${room.status === 'occupied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium">{room.room_number || `Bed #${room.id}`}</span>
                                                        <span className={`text-xs px-2 py-1 rounded ${room.status === 'available'
                                                            ? 'bg-green-100 text-green-700'
                                                            : room.status === 'occupied'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {room.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500">{room.ward_type || "General"} Ward</p>
                                                </div>
                                            )) : (
                                                <p className="text-sm text-gray-500 col-span-3">No beds configured in system.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Admission Reason</label>
                                        <textarea
                                            value={admissionReason}
                                            onChange={(e) => setAdmissionReason(e.target.value)}
                                            className="w-full h-32 border border-gray-300 rounded-lg p-3"
                                            placeholder="Why is this patient being admitted?..."
                                        />
                                    </div>
                                </div>
                            )}

                            {/* History */}
                            {activeTab === "history" && (
                                <div className="space-y-4">
                                    {history.length === 0 ? (
                                        <p className="text-gray-500 p-4 border rounded">No previous history available.</p>
                                    ) : (
                                        history.map((record) => (
                                            <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        <span className="font-medium">{formatDate(record.created_at || record.date)}</span>
                                                    </div>
                                                    <span className="text-sm text-gray-500">By {record.doctor_name || "Doctor"}</span>
                                                </div>
                                                <p className="font-medium text-gray-900 mb-1">{record.diagnosis || "No Diagnosis"}</p>
                                                <p className="text-sm text-gray-600">{record.notes || record.description || "No notes available."}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Patient Status */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Patient Status</h3>
                        <div className="flex gap-3">
                            {[
                                { id: "active", label: "Under Treatment", color: "bg-blue-100 text-blue-700" },
                                { id: "observation", label: "Observation", color: "bg-yellow-100 text-yellow-700" },
                                { id: "admitted", label: "Admitted", color: "bg-red-100 text-red-700" },
                                { id: "discharged", label: "Ready for Discharge", color: "bg-green-100 text-green-700" },
                            ].map((status) => (
                                <button
                                    key={status.id}
                                    className={`px-4 py-2 rounded-lg ${status.color}`}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Summary Modal */}
            {showAiModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Brain className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">AI Consultation Summary</h3>
                                    <p className="text-sm text-gray-500">Auto-generated based on consultation data</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAiModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <div className="flex justify-between mb-4">
                                <button
                                    onClick={generateAiSummary}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Generate Summary
                                </button>
                                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                    Copy to Clipboard
                                </button>
                            </div>

                            {aiSummary ? (
                                <div className="whitespace-pre-wrap bg-white p-4 rounded border border-gray-200 text-sm">
                                    {aiSummary}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p>Click Generate to create a summary of this visit</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}