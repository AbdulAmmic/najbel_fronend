"use client";

import { FileText, Calendar, Stethoscope, ChevronDown, ChevronUp, Edit2, Eye, Clock } from "lucide-react";
import { consultations } from "@/services/api";
import { useState, useEffect } from "react";

export default function VisitHistoryPage() {
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<number | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await consultations.getMyHistory().catch(() => []);
                // Only show consultations explicitly marked visible by the doctor (strictly true)
                const visible = (Array.isArray(data) ? data : [])
                    .filter((v: any) => v.is_visible_to_patient === true)
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setVisits(visible);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const fmtDate = (d: string) => d
        ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—';

    return (
        <div className="max-w-lg mx-auto pb-8">
            <div className="px-1 pt-1 mb-5">
                <h1 className="text-xl font-bold text-gray-900">Visit History</h1>
                <p className="text-[11px] text-gray-400 mt-0.5">Consultations shared by your care team</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : visits.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3 bg-white rounded-3xl border border-gray-100 mx-1">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <Stethoscope className="w-7 h-7 text-blue-300" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-gray-700">No records shared yet</p>
                        <p className="text-[11px] text-gray-400 mt-1">Your doctor will share consultation notes here</p>
                    </div>
                </div>
            ) : (
                <div className="mx-1 space-y-3">
                    {visits.map((visit) => {
                        const isEdited = visit.updated_at && visit.created_at &&
                            (new Date(visit.updated_at).getTime() - new Date(visit.created_at).getTime()) > 60000;
                        const isOpen = expanded === visit.id;
                        const hasMeeting = !!visit.meet_link;

                        return (
                            <div key={visit.id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${isEdited ? 'border-amber-100' : 'border-gray-100/80'} ${hasMeeting ? 'border-l-2 border-l-teal-400' : ''}`}>
                                {/* Meeting banner */}
                                {hasMeeting && (
                                    <div className="flex items-center justify-between px-4 py-2 bg-teal-50 border-b border-teal-100">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                                            <p className="text-[10px] font-bold text-teal-700">Meeting active for this consultation</p>
                                        </div>
                                        <a
                                            href={visit.meet_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] font-black text-white bg-teal-600 px-3 py-1 rounded-lg hover:bg-teal-700 transition-all"
                                        >
                                            📹 Join
                                        </a>
                                    </div>
                                )}
                                <button
                                    className="w-full text-left p-4"
                                    onClick={() => setExpanded(isOpen ? null : visit.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                            <Stethoscope className="w-4.5 h-4.5 text-blue-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                <p className="font-semibold text-gray-900 text-[13px]">
                                                    {visit.chief_complaint || `Consultation #${visit.id}`}
                                                </p>
                                                {isEdited && (
                                                    <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Edit2 className="w-2.5 h-2.5" /> Amended
                                                    </span>
                                                )}
                                                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Eye className="w-2.5 h-2.5" /> Shared by Dr.
                                                </span>
                                            </div>
                                            {visit.diagnosis && (
                                                <p className="text-[11px] text-blue-600 font-semibold truncate">Dx: {visit.diagnosis}</p>
                                            )}
                                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {fmtDate(visit.created_at)}
                                            </p>
                                        </div>
                                        <div className="text-gray-400 ml-1 mt-1">
                                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-3 bg-gray-50/40">
                                        {visit.symptoms && (
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Symptoms</p>
                                                <p className="text-xs text-gray-700 leading-relaxed">{visit.symptoms}</p>
                                            </div>
                                        )}
                                        {visit.diagnosis && (
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Diagnosis</p>
                                                <p className="text-xs font-semibold text-blue-700 leading-relaxed">{visit.diagnosis}</p>
                                            </div>
                                        )}
                                        {visit.treatment_plan && (
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Treatment Plan</p>
                                                <p className="text-xs text-gray-700 leading-relaxed">{visit.treatment_plan}</p>
                                            </div>
                                        )}
                                        {visit.notes && (
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Notes</p>
                                                <p className="text-xs text-gray-600 leading-relaxed">{visit.notes}</p>
                                            </div>
                                        )}
                                        {hasMeeting && (
                                            <div className="flex items-center justify-between p-2.5 bg-teal-50 rounded-xl border border-teal-100">
                                                <p className="text-[10px] text-teal-700 font-semibold">Your doctor has set up a virtual meeting</p>
                                                <a href={visit.meet_link} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-teal-600 hover:text-teal-800">
                                                    Join →
                                                </a>
                                            </div>
                                        )}
                                        {isEdited && (
                                            <div className="flex items-center gap-2 mt-1 p-2 bg-amber-50 rounded-xl border border-amber-100">
                                                <Eye className="w-3 h-3 text-amber-500 shrink-0" />
                                                <p className="text-[10px] text-amber-600">Record amended by your care team on {fmtDate(visit.updated_at)}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
