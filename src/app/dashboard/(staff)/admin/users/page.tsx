"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Search, Shield, UserPlus } from "lucide-react";
import { auth } from "@/services/api"; // You might need to add getUsers to api.ts

// Mock or Real API call needed for listing users
// For now, let's assume we fetch from /users/ or similar, or just mock for UI structure first

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [newUser, setNewUser] = useState({
        email: "",
        full_name: "",
        password: "",
        role: "doctor"
    });

    useEffect(() => {
        // Fetch users (Requires backend endpoint GET /users/ - might need to add this)
        // For now, we will mock or implement the hook
        setLoading(false);
        setUsers([
            { id: 1, full_name: "Super Admin", email: "admin@najbel.com", role: "admin", status: "Active" },
            { id: 2, full_name: "Dr. House", email: "doctor@najbel.com", role: "doctor", status: "Active" },
            { id: 3, full_name: "Nurse Ratched", email: "nurse@najbel.com", role: "nurse", status: "Active" },
            { id: 4, full_name: "Pharmacist Phil", email: "pharmacy@najbel.com", role: "pharmacist", status: "Active" },
            { id: 5, full_name: "Accountant Alex", email: "accountant@najbel.com", role: "accountant", status: "Active" },
        ]);
    }, []);

    const handleCreateUser = async () => {
        try {
            await auth.register(newUser);
            alert("User created successfully!");
            setShowAddModal(false);
            // Refresh list
        } catch (e) {
            console.error(e);
            alert("Failed to create user");
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-600" />
                        User Management
                    </h1>
                    <p className="text-gray-500">Manage system access and roles</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                    <UserPlus className="w-4 h-4" />
                    Add User
                </button>
            </div>

            <div className="bg-white rounded-xl border shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-medium text-gray-500">Name</th>
                            <th className="p-4 font-medium text-gray-500">Email</th>
                            <th className="p-4 font-medium text-gray-500">Role</th>
                            <th className="p-4 font-medium text-gray-500">Status</th>
                            <th className="p-4 font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-900">{user.full_name}</td>
                                <td className="p-4 text-gray-600">{user.email}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold uppercase">
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className="text-green-600 text-sm flex items-center gap-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div> {user.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button className="text-blue-600 hover:underline text-sm">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add New User</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name</label>
                                <input
                                    className="w-full border p-2 rounded"
                                    value={newUser.full_name}
                                    onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    className="w-full border p-2 rounded"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Role</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="doctor">Doctor</option>
                                    <option value="nurse">Nurse</option>
                                    <option value="pharmacist">Pharmacist</option>
                                    <option value="receptionist">Receptionist</option>
                                    <option value="accountant">Accountant</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Password</label>
                                <input
                                    type="password"
                                    className="w-full border p-2 rounded"
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                                <button onClick={handleCreateUser} className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
