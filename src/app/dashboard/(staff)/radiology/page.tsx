"use client";

import { useState, useEffect } from "react";
import {
    ImageIcon,
    Upload,
    Search,
    FileText,
    X,
    Maximize2,
    Calendar,
    User
} from "lucide-react";
import { radiology, patients } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { useWebSocket } from "@/contexts/WebSocketContext";

export default function RadiologyPage() {
    const [scans, setScans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedscan, setSelectedScan] = useState<any>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const { lastMessage } = useWebSocket();

    // Request State
    const [patientsList, setPatientsList] = useState<any[]>([]);
    const [newRequestData, setNewRequestData] = useState({
        patient_id: "",
        scan_type: "X-Ray",
        body_part: "",
        reason: ""
    });

    const fetchScans = async () => {
        try {
            const data = await radiology.getAll();
            setScans(data);
        } catch (error) {
            console.error("Failed to load scans", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScans();
        patients.getAll().then(setPatientsList).catch(console.error);
    }, []);

    useEffect(() => {
        if (lastMessage && lastMessage.includes('radiology')) {
            console.log("Realtime update received:", lastMessage);
            fetchScans();
        }
    }, [lastMessage]);

    const handleCreateRequest = async () => {
        try {
            await radiology.create({
                patient_id: parseInt(newRequestData.patient_id),
                scan_type: newRequestData.scan_type,
                body_part: newRequestData.body_part,
                reason: newRequestData.reason
            });
            fetchScans();
            setIsUploadModalOpen(false);
            setNewRequestData({ patient_id: "", scan_type: "X-Ray", body_part: "", reason: "" });
        } catch (error) {
            console.error("Failed to create request", error);
        }
    };

    const handleMockUpload = async (id: number) => {
        // Mocking file selection by just calling API
        try {
            // In real app, would get file input
            const mockFile = new File(["foo"], "foo.png", { type: "image/png" });
            await radiology.uploadImage(id, mockFile);
            fetchScans();
            // Update selected scan if viewing
            if (selectedscan && selectedscan.id === id) {
                const updated = await radiology.getAll(); // slightly inefficient but safe
                const fresh = updated.find((s: any) => s.id === id);
                setSelectedScan(fresh);
            }
        } catch (error) {
            console.error("Upload failed", error);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading PACS System...</div>;

    const ScanCard = ({ scan }: { scan: any }) => (
        <div
            onClick={() => setSelectedScan(scan)}
            className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
        >
            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                {scan.image_url ? (
                    <img src={scan.image_url} alt={scan.scan_type} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                        <span className="text-sm font-medium">Pending Image</span>
                    </div>
                )}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-lg text-xs font-medium">
                    {scan.scan_type}
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-bold text-gray-900">{scan.body_part}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <User className="w-3 h-3" />
                    <span>Patient #{scan.patient_id}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(scan.requested_at).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-[1800px] mx-auto space-y-8 h-screen flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Radiology & Imaging</h1>
                    <p className="text-gray-500 mt-2">Digital PACS and Imaging Reports</p>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors"
                >
                    <Upload className="w-5 h-5" />
                    New Request
                </button>
            </div>

            {/* Gallery Grid */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-1">
                    {scans.map(scan => <ScanCard key={scan.id} scan={scan} />)}
                </div>
                {scans.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                        <p>No scans found. Create a new request.</p>
                    </div>
                )}
            </div>

            {/* Viewer Modal */}
            <AnimatePresence>
                {selectedscan && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-6xl h-full max-h-[90vh] flex overflow-hidden shadow-2xl relative"
                        >
                            <button
                                onClick={() => setSelectedScan(null)}
                                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Image Section */}
                            <div className="flex-1 bg-black flex items-center justify-center relative group">
                                {selectedscan.image_url ? (
                                    <img src={selectedscan.image_url} className="max-w-full max-h-full object-contain" />
                                ) : (
                                    <div className="text-center">
                                        <p className="text-gray-500 mb-4">No Image Uploaded Yet</p>
                                        <button
                                            onClick={() => handleMockUpload(selectedscan.id)}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700"
                                        >
                                            Upload Scan Image (Simulated)
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar Info */}
                            <div className="w-96 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
                                <div className="p-6 border-b border-gray-100">
                                    <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold uppercase mb-2">
                                        {selectedscan.scan_type}
                                    </span>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedscan.body_part}</h2>
                                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Requested:</span>
                                            <span className="font-medium text-gray-900">{new Date(selectedscan.requested_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Patient ID:</span>
                                            <span className="font-medium text-gray-900">{selectedscan.patient_id}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 flex-1">
                                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Radiologist Findings
                                    </h3>
                                    <textarea
                                        className="w-full h-48 p-4 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed"
                                        placeholder="Enter radiologist report findings here..."
                                        defaultValue={selectedscan.findings}
                                    />
                                    <button className="w-full mt-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800">
                                        Save Report
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* New Request Modal */}
            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6"
                        >
                            <h3 className="text-xl font-bold text-gray-900 mb-4">New Imaging Request</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none"
                                        value={newRequestData.patient_id}
                                        onChange={(e) => setNewRequestData({ ...newRequestData, patient_id: e.target.value })}
                                    >
                                        <option value="">-- Patient --</option>
                                        {patientsList.map(p => (
                                            <option key={p.id} value={p.id}>{p.user?.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Scan Type</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none"
                                        value={newRequestData.scan_type}
                                        onChange={(e) => setNewRequestData({ ...newRequestData, scan_type: e.target.value })}
                                    >
                                        <option>X-Ray</option>
                                        <option>MRI</option>
                                        <option>CT</option>
                                        <option>Ultrasound</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Body Part</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Chest, Left Knee"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none"
                                        value={newRequestData.body_part}
                                        onChange={(e) => setNewRequestData({ ...newRequestData, body_part: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Reason</label>
                                    <textarea
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none resize-none h-24"
                                        value={newRequestData.reason}
                                        onChange={(e) => setNewRequestData({ ...newRequestData, reason: e.target.value })}
                                    />
                                </div>
                                <button
                                    onClick={handleCreateRequest}
                                    className="w-full py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
                                >
                                    Create Request
                                </button>
                                <button
                                    onClick={() => setIsUploadModalOpen(false)}
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
