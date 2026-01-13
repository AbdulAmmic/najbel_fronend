"use client";

import { Pill, Check, Clock, Search } from "lucide-react";
import { prescriptions } from "@/services/api";
import { useState, useEffect } from "react";

export default function PharmacyDashboard() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrescriptions = async () => {
            // Ideally fetch pending prescriptions. 
            // Currently backend /prescriptions/ might return all.
            // We will assume backend filter or client filter later.
            try {
                const data = await prescriptions.getAll();
                setOrders(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchPrescriptions();
    }, []);

    return (
        <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <Pill className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pharmacy</h1>
                    <p className="text-gray-500">Prescription Fulfillment</p>
                </div>
            </div>

            <div className="grid gap-6">
                {loading ? <div>Loading...</div> : orders.length === 0 ? <p className="text-gray-500">No prescriptions found.</p> : orders.map((order) => (
                    <div key={order.id} className="bg-white p-6 rounded-2xl border flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="font-bold text-gray-900">Prescription #{order.id}</h3>
                            <p className="text-sm text-gray-500">
                                Medications: {order.medications}
                            </p>
                            <div className="flex gap-2 mt-2">
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Pending
                                </span>
                            </div>
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                            Mark Dispensed
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
