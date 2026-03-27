"use client";

import { useState, useEffect } from "react";
import { Activity, Thermometer, Heart, Weight, Droplets } from "lucide-react";
import { vitals as vitalsApi, auth } from "@/services/api";

export default function VitalsPage() {
    const [vitalsList, setVitalsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vData] = await Promise.all([
                    vitalsApi.getAll().catch(() => []),
                ]);
                setVitalsList(vData);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const latest = vitalsList[0] || {};

    return (
        <div className="max-w-lg mx-auto pb-8 -mx-1">
            <div className="px-1 pt-1 mb-4">
                <h1 className="text-xl font-bold text-gray-900">Vitals</h1>
                <p className="text-[11px] text-gray-400 mt-0.5">Track your health indicators</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Latest Vitals */}
                    <div className="grid grid-cols-2 gap-2 mx-1 mb-4">
                        <VitalCard icon={<Weight className="w-4 h-4" />} label="Weight" value={latest.weight ? `${latest.weight} kg` : "—"} color="blue" />
                        <VitalCard icon={<Droplets className="w-4 h-4" />} label="Blood Pressure" value={latest.blood_pressure || "—"} color="red" />
                        <VitalCard icon={<Heart className="w-4 h-4" />} label="Heart Rate" value={latest.heart_rate ? `${latest.heart_rate} bpm` : "—"} color="pink" />
                        <VitalCard icon={<Thermometer className="w-4 h-4" />} label="Temperature" value={latest.temperature ? `${latest.temperature}°C` : "—"} color="amber" />
                    </div>

                    {/* History */}
                    <div className="mx-1 bg-white rounded-xl border border-gray-100/80 overflow-hidden">
                        <div className="px-3 py-2.5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-500" />
                            <h3 className="text-[13px] font-bold text-gray-900">History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-50">
                                        <th className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase">Date</th>
                                        <th className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase">BP</th>
                                        <th className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase">HR</th>
                                        <th className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase">Wt</th>
                                        <th className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase">SpO2</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vitalsList.map((v) => (
                                        <tr key={v.id} className="border-b border-gray-50 last:border-0">
                                            <td className="px-3 py-2 text-[12px] font-medium text-gray-900">{new Date(v.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                                            <td className="px-3 py-2 text-[12px] text-gray-600">{v.blood_pressure || '—'}</td>
                                            <td className="px-3 py-2 text-[12px] text-gray-600">{v.heart_rate ? `${v.heart_rate}` : '—'}</td>
                                            <td className="px-3 py-2 text-[12px] text-gray-600">{v.weight ? `${v.weight}` : '—'}</td>
                                            <td className="px-3 py-2 text-[12px] text-gray-600">{v.oxygen_saturation ? `${v.oxygen_saturation}%` : '—'}</td>
                                        </tr>
                                    ))}
                                    {vitalsList.length === 0 && (
                                        <tr><td colSpan={5} className="px-3 py-8 text-center text-[12px] text-gray-400">No vitals history</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function VitalCard({ icon, label, value, color }: any) {
    const c: Record<string, string> = {
        blue: "text-blue-500 bg-blue-50",
        red: "text-red-500 bg-red-50",
        pink: "text-pink-500 bg-pink-50",
        amber: "text-amber-500 bg-amber-50",
    };
    return (
        <div className="bg-white rounded-xl p-3 border border-gray-100/80">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${c[color]}`}>{icon}</div>
            <p className="text-[10px] text-gray-400 font-medium">{label}</p>
            <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
    );
}
