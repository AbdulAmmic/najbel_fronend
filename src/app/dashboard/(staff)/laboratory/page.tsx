"use client";

import { useState, useEffect } from "react";
import {
    Activity,
    Search,
    Filter,
    CheckCircle,
    Clock,
    TestTube,
    Microscope,
    FileText,
    AlertCircle,
    Plus,
    X
} from "lucide-react";
import { labs } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useWebSocket } from "@/contexts/WebSocketContext";

export default function LaboratoryPage() {
    const [activeTab, setActiveTab] = useState<'pending' | 'processing' | 'validation' | 'completed'>('pending');
    const [labResults, setLabResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const { lastMessage } = useWebSocket();

    // Action Modal State
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionData, setActionData] = useState<any>({});

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        patient_id: "",
        test_name: "",
        priority: "normal", // normal, urgent
        notes: ""
    });

    const fetchLabs = async () => {
        try {
            const data = await labs.getAll();
            setLabResults(data);
        } catch (error) {
            console.error("Failed to load lab results", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabs();

        // Check params
        const patientId = searchParams.get('patient_id');
        if (patientId) {
            setCreateForm(prev => ({ ...prev, patient_id: patientId }));
            setIsCreateModalOpen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        if (lastMessage && lastMessage.includes('lab')) { // Assuming 'lab' in message
            fetchLabs();
        }
    }, [lastMessage]);

    const handleUpdateStatus = async (status: string, additionalData: any = {}) => {
        if (!selectedItem) return;

        try {
            await labs.update(selectedItem.id, {
                status,
                ...additionalData
            });
            fetchLabs();
            setIsActionModalOpen(false);
            setSelectedItem(null);
            setActionData({});
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleCreateRequest = async () => {
        if (!createForm.patient_id || !createForm.test_name) {
            alert("Please fill in Patient ID and Test Name");
            return;
        }
        try {
            await labs.create({
                patient_id: parseInt(createForm.patient_id),
                test_name: createForm.test_name,
                priority: createForm.priority,
                status: 'requested',
                notes: createForm.notes
            });
            setIsCreateModalOpen(false);
            setCreateForm({ patient_id: "", test_name: "", priority: "normal", notes: "" });
            router.replace('/dashboard/laboratory');
            fetchLabs();
        } catch (e) {
            console.error("Failed to create lab request", e);
            alert("Failed to create lab request");
        }
    };

    const openActionModal = (item: any) => {
        setSelectedItem(item);
        setActionData({}); // Reset
        setIsActionModalOpen(true);
    };

    // Filter Logic
    const filteredResults = labResults.filter(r => {
        if (activeTab === 'pending') return r.status === 'requested';
        if (activeTab === 'processing') return r.status === 'sample_collected' || r.status === 'processing';
        if (activeTab === 'validation') return r.status === 'completed';
        if (activeTab === 'completed') return r.status === 'validated';
        return false;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'requested': return 'bg-gray-100 text-gray-600';
            case 'sample_collected': return 'bg-blue-100 text-blue-600';
            case 'processing': return 'bg-purple-100 text-purple-600';
            case 'completed': return 'bg-amber-100 text-amber-600';
            case 'validated': return 'bg-emerald-100 text-emerald-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading Laboratory System...</div>;

    return (
        <div className="p-6 max-w-[1800px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Laboratory Information System</h1>
                    <p className="text-gray-500 mt-2">Manage test requests, sample tracking, and result validation</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
                >
                    <Plus className="w-5 h-5" />
                    New Request
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                        <p className="text-2xl font-bold text-gray-900">{labResults.filter(r => r.status === 'requested').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                        <TestTube className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">In Processing</p>
                        <p className="text-2xl font-bold text-gray-900">{labResults.filter(r => ['sample_collected', 'processing'].includes(r.status)).length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                        <Microscope className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">To Validate</p>
                        <p className="text-2xl font-bold text-gray-900">{labResults.filter(r => r.status === 'completed').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Completed (Today)</p>
                        <p className="text-2xl font-bold text-gray-900">{labResults.filter(r => r.status === 'validated').length}</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-gray-100">
                    <div className="flex gap-8 px-8">
                        {['pending', 'processing', 'validation', 'completed'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    } capitalize`}
                            >
                                {tab.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Test Info</th>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Patient</th>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Priority</th>
                                <th className="px-8 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredResults.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-8 py-4">
                                        <div className="font-medium text-gray-900">{item.test_name}</div>
                                        <div className="text-xs text-gray-500">ID: {item.id}</div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="text-sm text-gray-900 font-medium">Patient #{item.patient_id}</div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(item.status)}`}>
                                            {item.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4">
                                        {item.priority === 'urgent' ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 uppercase">Urgent</span>
                                        ) : (
                                            <span className="text-xs text-gray-500 uppercase">Normal</span>
                                        )}

                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        {activeTab === 'pending' && (
                                            <button
                                                onClick={() => openActionModal(item)}
                                                className="text-sm font-medium text-blue-600 hover:underline"
                                            >
                                                Collect Sample
                                            </button>
                                        )}
                                        {activeTab === 'processing' && (
                                            <button
                                                onClick={() => openActionModal(item)}
                                                className="text-sm font-medium text-purple-600 hover:underline"
                                            >
                                                Enter Result
                                            </button>
                                        )}
                                        {activeTab === 'validation' && (
                                            <button
                                                onClick={() => openActionModal(item)}
                                                className="text-sm font-medium text-emerald-600 hover:underline"
                                            >
                                                Validate
                                            </button>
                                        )}
                                        {activeTab === 'completed' && (
                                            <button className="text-sm font-medium text-gray-400 hover:text-gray-600">
                                                Print Report
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredResults.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-gray-500">
                                        No items in this queue.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dynamic Action Modal (Process/Result/Validate) */}
            <AnimatePresence>
                {isActionModalOpen && selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6"
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                {activeTab === 'pending' ? 'Sample Collection' :
                                    activeTab === 'processing' ? 'Enter Test Results' :
                                        'Validate Result'}
                            </h3>

                            {/* Collection Form */}
                            {activeTab === 'pending' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sample ID / Barcode</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="SCAN-001"
                                            onChange={(e) => setActionData({ ...actionData, sample_id: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleUpdateStatus('sample_collected', { sample_id: actionData.sample_id, status: 'processing' })} // Auto move to processing for now or keep sample_collected? Let's move to sample_collected then processing. Actually let's assume sample collection moves it to processing queue visual but status is sample_collected.
                                        className="w-full py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
                                    >
                                        Confirm Collection
                                    </button>
                                </div>
                            )}

                            {/* Result Entry Form */}
                            {activeTab === 'processing' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Result Value</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                                            placeholder="e.g. 12.5 g/dL"
                                            onChange={(e) => setActionData({ ...actionData, result: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Result Notes</label>
                                        <textarea
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none h-24 resize-none"
                                            placeholder="Optional notes..."
                                            onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleUpdateStatus('completed', actionData)}
                                        className="w-full py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
                                    >
                                        Submit Results
                                    </button>
                                </div>
                            )}

                            {/* Validation Confirmation */}
                            {activeTab === 'validation' && (
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-xl text-sm">
                                        <p><strong>Test:</strong> {selectedItem.test_name}</p>
                                        <p><strong>Result:</strong> {selectedItem.result}</p>
                                        <p><strong>Notes:</strong> {selectedItem.notes || 'N/A'}</p>
                                    </div>
                                    <button
                                        onClick={() => handleUpdateStatus('validated')}
                                        className="w-full py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
                                    >
                                        Approve & Validate
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => setIsActionModalOpen(false)}
                                className="w-full mt-2 py-2 text-gray-500 hover:bg-gray-50 rounded-xl font-medium"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Request Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="text-xl font-bold text-gray-900">New Lab Request</h3>
                                <button onClick={() => setIsCreateModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        placeholder="Enter Patient ID"
                                        value={createForm.patient_id}
                                        onChange={e => setCreateForm({ ...createForm, patient_id: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Name / Code</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        placeholder="e.g. CBC, Lipid Profile"
                                        value={createForm.test_name}
                                        onChange={e => setCreateForm({ ...createForm, test_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        value={createForm.priority}
                                        onChange={e => setCreateForm({ ...createForm, priority: e.target.value })}
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
                                    <textarea
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none h-24 resize-none"
                                        placeholder="Reason for test..."
                                        value={createForm.notes}
                                        onChange={e => setCreateForm({ ...createForm, notes: e.target.value })}
                                    />
                                </div>
                                <button
                                    onClick={handleCreateRequest}
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
