"use client";

import { useState, useEffect } from "react";
import { X, Search, User, FlaskConical, AlertCircle, DollarSign, CheckCircle, ChevronRight, FileText } from "lucide-react";
import { labs, patients } from "@/services/api";

interface RequestLabModalProps {
    onClose: () => void;
    onSuccess: () => void;
    initialPatient?: any;
}

export default function RequestLabModal({ onClose, onSuccess, initialPatient }: RequestLabModalProps) {
    // Stepper State: 1 = Find Patient, 2 = Test Selection, 3 = Confirmation
    const [step, setStep] = useState(1);

    // Step 1: Search
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(initialPatient || null);
    const [searching, setSearching] = useState(false);

    // Step 2: Form Data
    const [formData, setFormData] = useState({
        test_name: "General Blood Test",
        notes: "",
        priority: "normal"
    });
    const [loading, setLoading] = useState(false);

    // Lab Fees (Mock - in real app would come from backend conf)
    const FEES: Record<string, number> = {
        "General Blood Test": 5000,
        "Malaria Test": 3500,
        "Typhoid Test": 4000,
        "Urinalysis": 2500,
        "X-Ray Chest": 12000,
        "Full Blood Count": 7000
    };

    const currentFee = FEES[formData.test_name] || 5000;

    useEffect(() => {
        if (initialPatient) {
            setStep(2);
        }
    }, [initialPatient]);

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

    const handlePatientSelect = (patient: any) => {
        setSelectedPatient(patient);
        setStep(2);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await labs.create({
                patient_id: selectedPatient.id,
                test_name: formData.test_name,
                notes: formData.notes,
                priority: formData.priority,
                status: "requested"
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Lab request failed", error);
            alert("Failed to request lab test. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <FlaskConical className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 text-lg">Request Lab Test</h2>
                            <p className="text-xs text-gray-500">Step {step} of 3</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Stepper Progress */}
                    <div className="flex items-center justify-center mb-8 gap-2">
                        <div className={`h-2.5 w-full rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        <div className={`h-2.5 w-full rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        <div className={`h-2.5 w-full rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                    </div>

                    {/* Step 1: Find Patient */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center space-y-2 mb-8">
                                <h3 className="text-xl font-bold text-gray-900">Let's find the patient</h3>
                                <p className="text-gray-500">Search by name or unique ID to proceed</p>
                            </div>

                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Start typing name or ID..."
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-lg"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                {searching ? (
                                    <div className="text-center py-8 text-gray-400">Searching database...</div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(patient => (
                                        <button
                                            key={patient.id}
                                            onClick={() => handlePatientSelect(patient)}
                                            className="w-full p-4 flex items-center gap-4 bg-white border border-gray-100 hover:border-blue-500 hover:shadow-md rounded-xl transition-all group text-left"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                {(patient.full_name || patient.user?.full_name)?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{patient.full_name || patient.user?.full_name}</p>
                                                <p className="text-sm text-gray-500">ID: {patient.unique_id} • {patient.gender}</p>
                                            </div>
                                            <ChevronRight className="ml-auto w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                                        </button>
                                    ))
                                ) : searchTerm.length > 2 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <p className="text-gray-500 font-medium">No patients found</p>
                                        <button className="mt-2 text-blue-600 hover:underline">Register new patient</button>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        Type at least 3 characters to search
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Test Selection & Details */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 mb-6">
                                <div className="w-12 h-12 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-xl shadow-sm border border-blue-100">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-0.5">Selected Patient</p>
                                    <p className="text-lg font-bold text-gray-900">{selectedPatient?.full_name || selectedPatient?.user?.full_name}</p>
                                </div>
                                <button onClick={() => setStep(1)} className="ml-auto text-xs font-medium bg-white px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors">
                                    Change
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Test Name</label>
                                        <select
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none shadow-sm"
                                            value={formData.test_name}
                                            onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                                        >
                                            {Object.keys(FEES).map(test => (
                                                <option key={test} value={test}>{test}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                                        <div className="flex gap-3">
                                            {['normal', 'urgent'].map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() => setFormData({ ...formData, priority: p })}
                                                    className={`flex-1 py-3 px-4 rounded-xl border font-medium capitalize transition-all ${formData.priority === p
                                                        ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Clinical Notes</label>
                                        <textarea
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none h-[124px] shadow-sm"
                                            placeholder="Add any specific instructions or clinical context..."
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>


                        </div>
                    )}

                    {/* Step 3: Confirmation */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">Review Request</h3>
                                <p className="text-gray-500">Confirm details before sending to lab</p>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-200">
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                    <span className="text-gray-500">Patient</span>
                                    <span className="font-bold text-gray-900">{selectedPatient?.full_name || selectedPatient?.user?.full_name}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                    <span className="text-gray-500">Test Required</span>
                                    <span className="font-bold text-gray-900">{formData.test_name}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-200">
                                    <span className="text-gray-500">Priority</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${formData.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {formData.priority}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 items-center">
                                    <span className="text-gray-500">Estimated Cost</span>
                                    <span className="text-2xl font-bold text-gray-900">₦{currentFee.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-sm text-blue-700">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>This will automatically generate a pending invoice for the patient. Please direct them to billing after this step.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    {step === 1 ? (
                        <button onClick={onClose} className="px-6 py-3 font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
                            Cancel
                        </button>
                    ) : (
                        <button onClick={() => setStep(step - 1)} className="px-6 py-3 font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
                            Back
                        </button>
                    )}

                    {step === 2 && (
                        <button
                            onClick={() => setStep(3)}
                            disabled={!formData.test_name}
                            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 group disabled:opacity-50"
                        >
                            Next Step
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}

                    {step === 3 && (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">Processing...</span>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Confirm Request
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
