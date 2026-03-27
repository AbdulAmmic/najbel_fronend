import React, { useState, useEffect } from 'react';
import { beds } from '@/services/api';
import { Bed, User, Activity, AlertTriangle, Power, CheckCircle, PenTool, Wrench, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '@/contexts/WebSocketContext';

interface BedType {
    id: number;
    ward_name: string;
    bed_number: string;
    status: 'available' | 'occupied' | 'maintenance' | 'inactive'; // Added inactive
    patient_id?: number;
    patient?: any;
}

export default function BedManagement() {
    const [bedList, setBedList] = useState<BedType[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'available' | 'occupied' | 'maintenance'>('all');
    const { lastMessage } = useWebSocket();

    // Status Management State
    const [selectedBed, setSelectedBed] = useState<BedType | null>(null);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    const fetchBeds = async () => {
        try {
            const data = await beds.getAll();
            setBedList(data);
        } catch (error) {
            console.error("Failed to fetch beds", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBeds();
    }, []);

    useEffect(() => {
        if (lastMessage && lastMessage.includes('bed')) {
            fetchBeds();
        }
    }, [lastMessage]);

    const handleManageClick = (bed: BedType) => {
        setSelectedBed(bed);
        setIsManageModalOpen(true);
    };

    const handleUpdateStatus = async (status: string) => {
        if (!selectedBed) return;
        try {
            await beds.updateStatus(selectedBed.id, status);
            setIsManageModalOpen(false);
            fetchBeds();
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status");
        }
    };

    const filteredBeds = bedList.filter(bed => {
        if (filter === 'all') return true;
        return bed.status === filter;
    });

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'available':
                return {
                    card: 'border-cyan-100 bg-cyan-50/30 hover:border-cyan-300',
                    badge: 'bg-cyan-100 text-cyan-700 border-cyan-200',
                    icon: 'bg-cyan-100 text-cyan-600'
                };
            case 'occupied':
                return {
                    card: 'border-blue-100 bg-blue-50/30 hover:border-blue-300',
                    badge: 'bg-blue-100 text-blue-700 border-blue-200',
                    icon: 'bg-blue-100 text-blue-600'
                };
            case 'maintenance':
                return {
                    card: 'border-amber-100 bg-amber-50/30 hover:border-amber-300',
                    badge: 'bg-amber-100 text-amber-700 border-amber-200',
                    icon: 'bg-amber-100 text-amber-600'
                };
            default: // Inactive or unknown
                return {
                    card: 'border-gray-200 bg-gray-50 opacity-60 hover:opacity-100',
                    badge: 'bg-gray-200 text-gray-600 border-gray-300',
                    icon: 'bg-gray-200 text-gray-500'
                };
        }
    };

    const [isAddBedModalOpen, setIsAddBedModalOpen] = useState(false);
    const [newBedData, setNewBedData] = useState({
        ward_name: '',
        bed_number: '',
        room_number: '',
        daily_rate: 0,
        description: '',
        status: 'available'
    });

    const handleAddBedSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await beds.create(newBedData);
            setIsAddBedModalOpen(false);
            setNewBedData({
                ward_name: '',
                bed_number: '',
                room_number: '',
                daily_rate: 0,
                description: '',
                status: 'available'
            });
            fetchBeds();
        } catch (error) {
            console.error("Failed to create bed", error);
            alert("Failed to create bed");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-blue-600" />
                        Bed Status Overview
                    </h2>
                    <p className="text-gray-500 text-sm">Manage bed availability and maintenance status</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAddBedModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Bed
                    </button>
                    <div className="flex gap-2 bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-gray-200 shadow-sm">
                        {['all', 'available', 'occupied', 'maintenance'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${filter === f
                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredBeds.map((bed) => {
                        const styles = getStatusStyles(bed.status);
                        return (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={bed.id}
                                className={`group relative p-5 rounded-2xl border-2 transition-all duration-300 shadow-sm hover:shadow-lg bg-white ${styles.card}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-105 ${styles.icon}`}>
                                            <Bed className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 line-clamp-1">{bed.ward_name}</h3>
                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                                                <span>Bed {bed.bed_number}</span>
                                                {/* @ts-ignore */}
                                                {bed.room_number && <span className="text-gray-400">• Room {bed.room_number}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${styles.badge}`}>
                                        {bed.status}
                                    </span>
                                </div>

                                {/* Info Row */}
                                {/* @ts-ignore */}
                                {(bed.daily_rate > 0 || bed.description) && (
                                    <div className="text-xs text-gray-500 mb-3 px-1">
                                        {/* @ts-ignore */}
                                        {bed.daily_rate > 0 && <div>Rate: ${bed.daily_rate}/day</div>}
                                        {/* @ts-ignore */}
                                        {bed.description && <div className="italic truncate">{bed.description}</div>}
                                    </div>
                                )}

                                {/* Content Body */}
                                <div className="space-y-4">
                                    {bed.status === 'occupied' ? (
                                        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className="w-4 h-4 text-blue-400" />
                                                <span className="text-sm font-semibold text-gray-900 truncate">
                                                    {bed.patient?.user?.full_name || "Private Patient"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-slate-500 pl-6">
                                                <span>ID: #{bed.patient_id}</span>
                                            </div>
                                        </div>
                                    ) : bed.status === 'maintenance' ? (
                                        <div className="h-[74px] flex flex-col items-center justify-center text-amber-500/80 bg-amber-50/30 rounded-xl border border-dashed border-amber-200/50">
                                            <Wrench className="w-5 h-5 mb-1 opacity-50" />
                                            <span className="text-xs font-medium">Under Maintenance</span>
                                        </div>
                                    ) : (
                                        <div className="h-[74px] flex items-center justify-center text-cyan-400/60 text-sm bg-cyan-50/20 rounded-xl border border-dashed border-cyan-100">
                                            Available for use
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={() => handleManageClick(bed)}
                                            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-600 bg-white border border-gray-200 shadow-sm hover:border-blue-300 hover:text-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <PenTool className="w-3.5 h-3.5" />
                                            Manage Status
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Manage Status Modal */}
            <AnimatePresence>
                {isManageModalOpen && selectedBed && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
                        >
                            <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900">Manage Bed {selectedBed.bed_number}</h3>
                                <p className="text-sm text-gray-500">{selectedBed.ward_name} - Current: <span className="capitalize font-semibold">{selectedBed.status}</span></p>
                            </div>

                            <div className="p-6 space-y-3">
                                {selectedBed.status !== 'available' && selectedBed.status !== 'occupied' && (
                                    <button
                                        onClick={() => handleUpdateStatus('available')}
                                        className="w-full flex items-center gap-3 p-4 rounded-2xl border border-cyan-100 bg-cyan-50/50 hover:bg-cyan-100 hover:border-cyan-300 transition-all text-left group"
                                    >
                                        <div className="p-2 rounded-xl bg-white text-cyan-600 group-hover:scale-110 transition-transform shadow-sm">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">Mark Available</div>
                                            <div className="text-xs text-gray-500">Ready for patient admission</div>
                                        </div>
                                    </button>
                                )}

                                {selectedBed.status !== 'maintenance' && selectedBed.status !== 'occupied' && (
                                    <button
                                        onClick={() => handleUpdateStatus('maintenance')}
                                        className="w-full flex items-center gap-3 p-4 rounded-2xl border border-amber-100 bg-amber-50/50 hover:bg-amber-100 hover:border-amber-300 transition-all text-left group"
                                    >
                                        <div className="p-2 rounded-xl bg-white text-amber-600 group-hover:scale-110 transition-transform shadow-sm">
                                            <Wrench className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">Maintenance</div>
                                            <div className="text-xs text-gray-500">Cleaning, repairs, or service</div>
                                        </div>
                                    </button>
                                )}

                                {selectedBed.status !== 'inactive' && selectedBed.status !== 'occupied' && (
                                    <button
                                        onClick={() => handleUpdateStatus('inactive')}
                                        className="w-full flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-300 transition-all text-left group"
                                    >
                                        <div className="p-2 rounded-xl bg-white text-gray-500 group-hover:scale-110 transition-transform shadow-sm">
                                            <Power className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">Deactivate</div>
                                            <div className="text-xs text-gray-500">Temporarily remove from service</div>
                                        </div>
                                    </button>
                                )}

                                {selectedBed.status === 'occupied' && (
                                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-800 text-sm flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 shrink-0" />
                                        <div>
                                            <span className="font-bold block mb-1">Bed Occupied</span>
                                            Status cannot be changed while a patient is assigned. Please discharge the patient first.
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex justify-center">
                                <button onClick={() => setIsManageModalOpen(false)} className="text-sm font-semibold text-gray-500 hover:text-gray-800 px-6 py-2">
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Bed Modal */}
            <AnimatePresence>
                {isAddBedModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900">Add New Bed</h3>
                                <button onClick={() => setIsAddBedModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleAddBedSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ward Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={newBedData.ward_name}
                                            onChange={(e) => setNewBedData({ ...newBedData, ward_name: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="e.g. ICU"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bed Number</label>
                                        <input
                                            required
                                            type="text"
                                            value={newBedData.bed_number}
                                            onChange={(e) => setNewBedData({ ...newBedData, bed_number: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="e.g. A-101"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                                        <input
                                            type="text"
                                            value={newBedData.room_number}
                                            onChange={(e) => setNewBedData({ ...newBedData, room_number: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="e.g. 102"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Daily Fee ($)</label>
                                        <input
                                            type="number"
                                            value={newBedData.daily_rate}
                                            onChange={(e) => setNewBedData({ ...newBedData, daily_rate: parseFloat(e.target.value) })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description / Location</label>
                                    <textarea
                                        rows={2}
                                        value={newBedData.description}
                                        onChange={(e) => setNewBedData({ ...newBedData, description: e.target.value })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        placeholder="Additional details..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    Create Bed
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
