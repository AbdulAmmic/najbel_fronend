import React, { useState, useEffect } from 'react';
import { departments } from '@/services/api';
import { Building, Plus, MapPin, User, Activity, Edit2, Trash2, X, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DepartmentType {
    id: number;
    name: string;
    description: string;
    location: string;
    head_of_department_id?: number;
    head_of_department?: any;
    status: string;
}

export default function DepartmentManagement() {
    const [deptList, setDeptList] = useState<DepartmentType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<DepartmentType | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        status: 'Active'
    });

    const fetchDepartments = async () => {
        try {
            const data = await departments.getAll();
            setDeptList(data);
        } catch (error) {
            console.error("Failed to fetch departments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleOpenModal = (dept?: DepartmentType) => {
        if (dept) {
            setEditingDept(dept);
            setFormData({
                name: dept.name,
                description: dept.description,
                location: dept.location,
                status: dept.status
            });
        } else {
            setEditingDept(null);
            setFormData({
                name: '',
                description: '',
                location: '',
                status: 'Active'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingDept) {
                await departments.update(editingDept.id, formData);
            } else {
                await departments.create(formData);
            }
            setIsModalOpen(false);
            fetchDepartments();
        } catch (error) {
            console.error("Failed to save department", error);
            alert("Failed to save department");
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this department?")) {
            try {
                await departments.delete(id);
                fetchDepartments();
            } catch (error) {
                console.error("Failed to delete department", error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Layers className="w-6 h-6 text-blue-600" />
                        Departments
                    </h2>
                    <p className="text-gray-500 text-sm">Manage hospital departments and units</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Department
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {deptList.map((dept) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={dept.id}
                            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                                        <Building className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{dept.name}</h3>
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <MapPin className="w-3 h-3" />
                                            {dept.location || "No Location"}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleOpenModal(dept)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(dept.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                                {dept.description || "No description provided."}
                            </p>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                                <span className={`px-2 py-1 rounded-full font-medium ${dept.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {dept.status}
                                </span>
                                {dept.head_of_department ? (
                                    <div className="flex items-center gap-1.5 text-gray-600">
                                        <User className="w-3.5 h-3.5" />
                                        <span>Head: Dr. {dept.head_of_department?.user?.full_name}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 italic">No Head Assigned</span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    {deptList.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500">
                            No departments found. Create one to get started.
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {editingDept ? 'Edit Department' : 'New Department'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        placeholder="e.g. Cardiology"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        placeholder="Brief description of services..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Location / Floor</label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                            placeholder="e.g. Block A, 2nd Floor"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    {editingDept ? 'Update Department' : 'Create Department'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
