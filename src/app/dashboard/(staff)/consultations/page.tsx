"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    FileText,
    Calendar,
    User,
    Eye,
    Activity,
    Clock,
    Stethoscope,
    Pill,
    Thermometer,
    Heart,
    AlertCircle,
    ChevronRight,
    Filter,
    Download,
    Share2,
    Printer,
    TrendingUp,
    CheckCircle,
    XCircle
} from "lucide-react";

// Mock consultation data
interface VitalSigns {
    bp: string;
    hr: number;
    temp: number;
    spo2: number;
}

interface Consultation {
    id: number;
    patient_id: number;
    patient_name: string;
    patient_age: number;
    patient_gender: string;
    diagnosis: string;
    notes: string;
    created_at: string;
    duration: string;
    is_admitted: boolean;
    referral_needed: boolean;
    referral_to?: string;
    vital_signs: VitalSigns;
    medications: string[];
    follow_up: string;
    status: string;
}

const mockConsultations: Consultation[] = [
    {
        id: 1,
        patient_id: 1001,
        patient_name: "Sarah Johnson",
        patient_age: 32,
        patient_gender: "Female",
        diagnosis: "Hypertension Stage 1",
        notes: "Patient reports occasional headaches. BP monitoring needed. Lifestyle modifications advised.",
        created_at: "2024-01-15T10:30:00Z",
        duration: "45 mins",
        is_admitted: false,
        referral_needed: true,
        referral_to: "Cardiology",
        vital_signs: {
            bp: "140/90",
            hr: 78,
            temp: 98.6,
            spo2: 98
        },
        medications: ["Lisinopril 10mg", "Hydrochlorothiazide 12.5mg"],
        follow_up: "2 weeks",
        status: "completed"
    },
    {
        id: 2,
        patient_id: 1002,
        patient_name: "Michael Chen",
        patient_age: 45,
        patient_gender: "Male",
        diagnosis: "Type 2 Diabetes",
        notes: "A1C at 7.2%, showing improvement. Continue Metformin. Dietary consultation scheduled.",
        created_at: "2024-01-14T14:15:00Z",
        duration: "30 mins",
        is_admitted: false,
        referral_needed: false,
        vital_signs: {
            bp: "130/85",
            hr: 72,
            temp: 98.4,
            spo2: 99
        },
        medications: ["Metformin 500mg", "Glipizide 5mg"],
        follow_up: "1 month",
        status: "completed"
    },
    {
        id: 3,
        patient_id: 1003,
        patient_name: "Robert Wilson",
        patient_age: 67,
        patient_gender: "Male",
        diagnosis: "Pneumonia",
        notes: "Admitted for IV antibiotics. Chest X-ray shows improvement. Continue monitoring.",
        created_at: "2024-01-13T09:00:00Z",
        duration: "60 mins",
        is_admitted: true,
        referral_needed: true,
        referral_to: "Pulmonology",
        vital_signs: {
            bp: "150/95",
            hr: 92,
            temp: 100.2,
            spo2: 94
        },
        medications: ["Azithromycin", "Albuterol inhaler"],
        follow_up: "Daily rounds",
        status: "admitted"
    },
    {
        id: 4,
        patient_id: 1004,
        patient_name: "Emma Rodriguez",
        patient_age: 28,
        patient_gender: "Female",
        diagnosis: "Migraine with aura",
        notes: "Patient reports 3 episodes this month. Neurological exam normal. Prescribed preventive medication.",
        created_at: "2024-01-12T11:45:00Z",
        duration: "25 mins",
        is_admitted: false,
        referral_needed: true,
        referral_to: "Neurology",
        vital_signs: {
            bp: "120/80",
            hr: 68,
            temp: 98.6,
            spo2: 99
        },
        medications: ["Sumatriptan 50mg", "Propranolol 20mg"],
        follow_up: "1 month",
        status: "completed"
    },
    {
        id: 5,
        patient_id: 1005,
        patient_name: "Lisa Park",
        patient_age: 52,
        patient_gender: "Female",
        diagnosis: "Osteoarthritis",
        notes: "Knee pain persists. X-ray shows moderate degeneration. Physical therapy recommended.",
        created_at: "2024-01-11T16:20:00Z",
        duration: "35 mins",
        is_admitted: false,
        referral_needed: false,
        vital_signs: {
            bp: "135/88",
            hr: 76,
            temp: 98.2,
            spo2: 97
        },
        medications: ["Naproxen 500mg", "Acetaminophen"],
        follow_up: "3 weeks",
        status: "completed"
    },
    {
        id: 6,
        patient_id: 1006,
        patient_name: "David Miller",
        patient_age: 39,
        patient_gender: "Male",
        diagnosis: "Anxiety Disorder",
        notes: "Patient reports improved sleep with medication. Continue therapy sessions.",
        created_at: "2024-01-10T13:10:00Z",
        duration: "50 mins",
        is_admitted: false,
        referral_needed: false,
        vital_signs: {
            bp: "125/82",
            hr: 85,
            temp: 98.4,
            spo2: 98
        },
        medications: ["Sertraline 50mg", "Clonazepam PRN"],
        follow_up: "2 weeks",
        status: "completed"
    },
];

const statsData = [
    { label: "Total Consultations", value: "142", change: "+12%", icon: Stethoscope, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Avg. Duration", value: "28m", change: "-2m", icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Active Patients", value: "24", change: "+3", icon: User, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Admissions", value: "8", change: "-1", icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
];

export default function ConsultationsPage() {
    const router = useRouter();
    const [history, setHistory] = useState(mockConsultations);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
    const [viewMode, setViewMode] = useState("grid"); // grid or list

    useEffect(() => {
        // Simulate loading
        setTimeout(() => setLoading(false), 500);
    }, []);

    const filtered = history.filter((c) => {
        const matchesSearch =
            c.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.patient_id.toString().includes(searchTerm);

        const matchesFilter =
            filterStatus === "all" ||
            (filterStatus === "admitted" && c.is_admitted) ||
            (filterStatus === "completed" && !c.is_admitted && c.status === "completed") ||
            (filterStatus === "referred" && c.referral_needed);

        return matchesSearch && matchesFilter;
    });

    const handleViewDetails = (consultation: any) => {
        setSelectedConsultation(consultation);
    };

    const closeDetails = () => {
        setSelectedConsultation(null);
    };

    const getStatusBadge = (consultation: any) => {
        if (consultation.is_admitted) {
            return { text: "Admitted", bg: "bg-red-100", textColor: "text-red-700", border: "border-red-200" };
        }
        if (consultation.referral_needed) {
            return { text: "Referred", bg: "bg-purple-100", textColor: "text-purple-700", border: "border-purple-200" };
        }
        return { text: "Completed", bg: "bg-emerald-100", textColor: "text-emerald-700", border: "border-emerald-200" };
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Consultation History</h1>
                        <p className="text-gray-600 mt-1">Review and manage patient consultation records</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                            <Printer className="h-4 w-4" />
                            Print Summary
                        </button>
                        <button className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                    {statsData.map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl p-4 md:p-5 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs md:text-sm text-gray-500">{stat.label}</p>
                                    <p className="text-xl md:text-2xl font-bold mt-1 md:mt-2">{stat.value}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <TrendingUp className={`h-3 w-3 ${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`} />
                                        <span className={`text-xs ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {stat.change}
                                        </span>
                                    </div>
                                </div>
                                <div className={`p-2 md:p-3 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by patient name, diagnosis, or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-gray-400" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">All Consultations</option>
                                    <option value="completed">Completed</option>
                                    <option value="admitted">Admitted</option>
                                    <option value="referred">Referred</option>
                                </select>
                            </div>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`px-3 py-1.5 rounded text-sm ${viewMode === "grid" ? "bg-white text-gray-900" : "text-gray-600"}`}
                                >
                                    Grid
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`px-3 py-1.5 rounded text-sm ${viewMode === "list" ? "bg-white text-gray-900" : "text-gray-600"}`}
                                >
                                    List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Consultations Found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filtered.map((c) => {
                        const status = getStatusBadge(c);
                        return (
                            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-300 hover:border-blue-200 group">
                                {/* Patient Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                                            <User className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{c.patient_name}</h3>
                                            <p className="text-sm text-gray-500">ID: {c.patient_id} • {c.patient_age}yrs • {c.patient_gender}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full border ${status.bg} ${status.textColor} ${status.border}`}>
                                        {status.text}
                                    </span>
                                </div>

                                {/* Diagnosis */}
                                <div className="mb-4">
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Diagnosis</p>
                                    <p className="font-medium text-gray-900">{c.diagnosis}</p>
                                </div>

                                {/* Vital Signs */}
                                <div className="mb-4">
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Vital Signs</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-3 w-3 text-red-500" />
                                            <span className="text-xs text-gray-600">BP: {c.vital_signs.bp}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Heart className="h-3 w-3 text-pink-500" />
                                            <span className="text-xs text-gray-600">HR: {c.vital_signs.hr}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Thermometer className="h-3 w-3 text-orange-500" />
                                            <span className="text-xs text-gray-600">Temp: {c.vital_signs.temp}°F</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-3 w-3 text-blue-500" />
                                            <span className="text-xs text-gray-600">SpO₂: {c.vital_signs.spo2}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Info */}
                                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(c.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {c.duration}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        {c.referral_needed && (
                                            <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded">
                                                Referred to {c.referral_to}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleViewDetails(c)}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
                                    >
                                        View Details
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // List View
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Patient</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Diagnosis</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Vitals</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Date</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Status</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((c) => {
                                    const status = getStatusBadge(c);
                                    return (
                                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{c.patient_name}</p>
                                                        <p className="text-sm text-gray-500">ID: {c.patient_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="font-medium text-gray-900">{c.diagnosis}</p>
                                                <p className="text-sm text-gray-500 line-clamp-1">{c.notes}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500">BP:</span>
                                                        <span className="text-sm font-medium">{c.vital_signs.bp}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500">HR:</span>
                                                        <span className="text-sm font-medium">{c.vital_signs.hr}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-sm text-gray-900">{new Date(c.created_at).toLocaleDateString()}</div>
                                                <div className="text-xs text-gray-500">{c.duration}</div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`text-xs px-3 py-1 rounded-full ${status.bg} ${status.textColor}`}>
                                                    {status.text}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <button
                                                    onClick={() => handleViewDetails(c)}
                                                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Consultation Detail Modal */}
            {selectedConsultation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Consultation Details</h2>
                                <p className="text-gray-500">Patient ID: {selectedConsultation.patient_id}</p>
                            </div>
                            <button
                                onClick={closeDetails}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <XCircle className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Patient Info */}
                            <div className="bg-blue-50 rounded-xl p-5 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                                        <User className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{selectedConsultation.patient_name}</h3>
                                        <div className="flex flex-wrap gap-4 mt-2">
                                            <div>
                                                <p className="text-sm text-gray-500">Age</p>
                                                <p className="font-medium">{selectedConsultation.patient_age} years</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Gender</p>
                                                <p className="font-medium">{selectedConsultation.patient_gender}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Date</p>
                                                <p className="font-medium">{new Date(selectedConsultation.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Diagnosis & Notes */}
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-white border border-gray-200 rounded-xl p-5">
                                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        Diagnosis
                                    </h4>
                                    <p className="text-gray-900 font-medium">{selectedConsultation.diagnosis}</p>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-xl p-5">
                                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Stethoscope className="h-5 w-5 text-blue-600" />
                                        Consultation Notes
                                    </h4>
                                    <p className="text-gray-600">{selectedConsultation.notes}</p>
                                </div>
                            </div>

                            {/* Vital Signs */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
                                <h4 className="font-bold text-gray-900 mb-4">Vital Signs</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: "Blood Pressure", value: selectedConsultation.vital_signs.bp, icon: Activity, color: "text-red-500" },
                                        { label: "Heart Rate", value: selectedConsultation.vital_signs.hr, icon: Heart, color: "text-pink-500" },
                                        { label: "Temperature", value: selectedConsultation.vital_signs.temp + "°F", icon: Thermometer, color: "text-orange-500" },
                                        { label: "SpO₂", value: selectedConsultation.vital_signs.spo2 + "%", icon: AlertCircle, color: "text-blue-500" },
                                    ].map((item, index) => (
                                        <div key={index} className="text-center p-3 border border-gray-100 rounded-lg">
                                            <item.icon className={`h-8 w-8 mx-auto mb-2 ${item.color}`} />
                                            <p className="text-sm text-gray-500">{item.label}</p>
                                            <p className="text-lg font-bold text-gray-900 mt-1">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Medications & Follow-up */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white border border-gray-200 rounded-xl p-5">
                                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Pill className="h-5 w-5 text-purple-600" />
                                        Medications
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedConsultation.medications.map((med, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                <span className="text-gray-700">{med}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white border border-gray-200 rounded-xl p-5">
                                    <h4 className="font-bold text-gray-900 mb-3">Follow-up</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Next Appointment</span>
                                            <span className="font-medium">{selectedConsultation.follow_up}</span>
                                        </div>
                                        {selectedConsultation.referral_needed && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Referred to</span>
                                                <span className="font-medium text-purple-600">{selectedConsultation.referral_to}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Status</span>
                                            <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadge(selectedConsultation).bg} ${getStatusBadge(selectedConsultation).textColor}`}>
                                                {getStatusBadge(selectedConsultation).text}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
                            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                Print
                            </button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}