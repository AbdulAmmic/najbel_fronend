"use client";

import { useState, useEffect } from "react";
import { Activity, Thermometer, Heart, Weight, Droplets } from "lucide-react";
import { vitals as vitalsApi, auth } from "@/services/api";

export default function VitalsPage() {
    const [vitalsList, setVitalsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("Patient");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vData, uData] = await Promise.all([
                    vitalsApi.getAll(),
                    auth.getMe()
                ]);
                setVitalsList(vData);
                setUserName(uData.full_name);
            } catch (err) {
                console.error("Failed to fetch vitals", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const latestVitals = vitalsList[0] || {};

    return (
        <div className="max-w-6xl mx-auto">
            <main className="p-4 lg:p-8 space-y-8">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Vitals & Health</h1>
                    <p className="text-gray-600">Track and monitor your key health indicators over time.</p>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-gray-400">Loading health data...</div>
                ) : (
                    <div className="space-y-8">
                        {/* Latest Vitals Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <VitalCard
                                icon={<Weight className="w-5 h-5" />}
                                label="Weight"
                                value={latestVitals.weight ? `${latestVitals.weight} kg` : "N/A"}
                                color="blue"
                            />
                            <VitalCard
                                icon={<Droplets className="w-5 h-5" />}
                                label="Blood Pressure"
                                value={latestVitals.blood_pressure || "N/A"}
                                color="red"
                            />
                            <VitalCard
                                icon={<Heart className="w-5 h-5" />}
                                label="Heart Rate"
                                value={latestVitals.heart_rate ? `${latestVitals.heart_rate} bpm` : "N/A"}
                                color="pink"
                            />
                            <VitalCard
                                icon={<Thermometer className="w-5 h-5" />}
                                label="Temperature"
                                value={latestVitals.temperature ? `${latestVitals.temperature}°C` : "N/A"}
                                color="amber"
                            />
                        </div>

                        {/* History Table */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                    Historical Trends
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/30">
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date Recorded</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">BP</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Heart Rate</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Weight</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">SpO2</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {vitalsList.map((v) => (
                                            <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {new Date(v.recorded_at).toLocaleDateString(undefined, {
                                                        year: 'numeric', month: 'short', day: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.blood_pressure || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.heart_rate ? `${v.heart_rate} bpm` : '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.weight ? `${v.weight} kg` : '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{v.oxygen_saturation ? `${v.oxygen_saturation}%` : '-'}</td>
                                            </tr>
                                        ))}
                                        {vitalsList.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No vitals history found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function VitalCard({ icon, label, value, color }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        red: "bg-red-50 text-red-600",
        pink: "bg-pink-50 text-pink-600",
        amber: "bg-amber-50 text-amber-600",
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
                {icon}
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    );
}
