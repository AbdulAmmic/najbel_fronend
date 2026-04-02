"use client";

import { useState, useEffect, Suspense } from "react";
import {
    Building2,
    Bed as BedIcon,
    DoorOpen,
    Plus,
    Trash2,
    Pencil,
    Search,
    MapPin,
    LayoutGrid,
    X,
    CheckCircle,
    AlertCircle,
    Clock,
    Layers,
    ChevronRight,
    Users,
    Star,
    Stethoscope,
    Baby,
    Brain,
    Heart,
    ShieldAlert,
    Zap,
    ArrowUpRight
} from "lucide-react";
import { departments, rooms, beds, wards } from "@/services/api";
import { useSearchParams, useRouter } from "next/navigation";

type TabType = "departments" | "wards" | "rooms" | "beds";

const WARD_TYPE_META: Record<string, { label: string; color: string; Icon: any }> = {
    general: { label: "General", color: "blue", Icon: Stethoscope },
    surgical: { label: "Surgical", color: "violet", Icon: Zap },
    maternity: { label: "Maternity", color: "pink", Icon: Baby },
    pediatric: { label: "Pediatric", color: "yellow", Icon: Star },
    icu: { label: "ICU", color: "red", Icon: Heart },
    emergency: { label: "Emergency", color: "orange", Icon: ShieldAlert },
    psychiatric: { label: "Psychiatric", color: "purple", Icon: Brain },
    oncology: { label: "Oncology", color: "teal", Icon: Layers },
    orthopedic: { label: "Orthopedic", color: "green", Icon: Users },
    isolation: { label: "Isolation", color: "gray", Icon: ShieldAlert },
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
    active:       { label: "Active",       dot: "bg-emerald-500",  text: "text-emerald-700",  bg: "bg-emerald-50" },
    available:    { label: "Available",    dot: "bg-emerald-500",  text: "text-emerald-700",  bg: "bg-emerald-50" },
    occupied:     { label: "Occupied",     dot: "bg-amber-500",    text: "text-amber-700",    bg: "bg-amber-50"   },
    full:         { label: "Full",         dot: "bg-amber-500",    text: "text-amber-700",    bg: "bg-amber-50"   },
    maintenance:  { label: "Maintenance",  dot: "bg-gray-400",     text: "text-gray-600",     bg: "bg-gray-100"   },
    inactive:     { label: "Inactive",     dot: "bg-red-400",      text: "text-red-600",       bg: "bg-red-50"    },
    out_OF_service:  { label: "Out of Svc",  dot: "bg-red-400",   text: "text-red-600",       bg: "bg-red-50"    },
};

function FacilityManagementInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>(
        (searchParams.get("tab") as TabType) || "departments"
    );
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Record<string, any[]>>({
        departments: [], wards: [], rooms: [], beds: []
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [depts, wds, rms, bds] = await Promise.all([
                departments.getAll(), wards.getAll(), rooms.getAll(), beds.getAll()
            ]);
            setData({ departments: depts, wards: wds, rooms: rms, beds: bds });
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => {
        const tab = searchParams.get("tab") as TabType;
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setSearch("");
        router.push(`?tab=${tab}`);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this item? This action cannot be undone.")) return;
        try {
            if (activeTab === "departments") await departments.delete(id);
            else if (activeTab === "wards") await wards.delete(id);
            else if (activeTab === "rooms") await rooms.delete(id);
            else if (activeTab === "beds") await beds.delete(id);
            fetchData();
        } catch {
            setError("Failed to delete. The item may still be in use.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            if (activeTab === "departments") {
                if (editingItem) await departments.update(editingItem.id, formData);
                else await departments.create(formData);
            } else if (activeTab === "wards") {
                if (editingItem) await wards.update(editingItem.id, formData);
                else await wards.create(formData);
            } else if (activeTab === "rooms") {
                if (editingItem) await rooms.update(editingItem.id, formData);
                else await rooms.create(formData);
            } else if (activeTab === "beds") {
                await beds.create(formData);
            }
            setIsModalOpen(false);
            setEditingItem(null);
            setFormData({});
            fetchData();
        } catch (err: any) {
            setError(err?.response?.data?.detail || "Failed to save. Please check inputs.");
        } finally {
            setSaving(false);
        }
    };

    const openModal = (item: any = null) => {
        setEditingItem(item);
        setFormData(item ? { ...item } : {});
        setError(null);
        setIsModalOpen(true);
    };

    const setField = (key: string, val: any) =>
        setFormData((prev: any) => ({ ...prev, [key]: val }));

    const currentList = (data[activeTab] || []).filter((item: any) => {
        const s = search.toLowerCase();
        return !s ||
            JSON.stringify(Object.values(item)).toLowerCase().includes(s);
    });

    const TABS: { id: TabType; label: string; icon: any; color: string }[] = [
        { id: "departments", label: "Departments", icon: Building2, color: "blue" },
        { id: "wards", label: "Wards", icon: Layers, color: "violet" },
        { id: "rooms", label: "Rooms", icon: DoorOpen, color: "teal" },
        { id: "beds", label: "Beds", icon: BedIcon, color: "emerald" },
    ];

    const activeTabMeta = TABS.find(t => t.id === activeTab)!;

    return (
        <div className="min-h-screen bg-[#f5f5f7] font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',sans-serif]">
            {/* Top Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Facility Management</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Manage your clinic infrastructure — {Object.values(data).reduce((a, c) => a + c.length, 0)} total records</p>
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-200"
                        >
                            <Plus className="w-4 h-4" />
                            Add {activeTab.slice(0, -1)}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
                {/* Summary Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                            className={`group bg-white rounded-2xl p-4 border transition-all text-left ${
                                activeTab === tab.id
                                ? "border-blue-200 ring-2 ring-blue-100 shadow-sm"
                                : "border-gray-100 hover:border-gray-200 hover:shadow-sm"
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${
                                activeTab === tab.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                            }`}>
                                <tab.icon className="w-5 h-5" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{data[tab.id]?.length ?? 0}</div>
                            <div className="text-xs text-gray-400 font-medium mt-0.5">{tab.label}</div>
                        </button>
                    ))}
                </div>

                {/* Search + List */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder={`Search ${activeTab}...`}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none border border-transparent focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all font-medium text-gray-700 placeholder:text-gray-400"
                            />
                        </div>
                        {/* Inline Tabs */}
                        <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                            {TABS.map(tab => (
                                <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                        activeTab === tab.id
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="flex flex-col items-center py-24 gap-3">
                            <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-gray-400">Loading...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            {currentList.length === 0 ? (
                                <div className="flex flex-col items-center py-24 gap-3 text-gray-400">
                                    <activeTabMeta.icon className="w-10 h-10 opacity-30" />
                                    <p className="text-sm font-medium">No {activeTab} found</p>
                                    <button onClick={() => openModal()} className="text-xs text-blue-600 hover:underline">
                                        Add your first {activeTab.slice(0, -1)} →
                                    </button>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left bg-gray-50/50">
                                            <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Name</th>
                                            <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Details</th>
                                            <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Status</th>
                                            <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {activeTab === "departments" && currentList.map((dept: any) => (
                                            <TableRow key={dept.id} onEdit={() => openModal(dept)} onDelete={() => handleDelete(dept.id)}>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                                                            {dept.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900 text-sm">{dept.name}</div>
                                                            <div className="text-xs text-gray-400 truncate max-w-xs">{dept.description || "—"}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                        {dept.location || "—"}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4"><StatusPill status={dept.status} /></td>
                                            </TableRow>
                                        ))}

                                        {activeTab === "wards" && currentList.map((ward: any) => {
                                            const meta = WARD_TYPE_META[ward.ward_type] || WARD_TYPE_META.general;
                                            return (
                                                <TableRow key={ward.id} onEdit={() => openModal(ward)} onDelete={() => handleDelete(ward.id)}>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0">
                                                                <meta.Icon className="w-4.5 h-4.5" />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900 text-sm">{ward.name}</div>
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-semibold uppercase tracking-wider mt-0.5">
                                                                    {meta.label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="text-sm text-gray-600">Floor {ward.floor || "—"}</div>
                                                        <div className="text-xs text-gray-400">{ward.total_beds} beds total</div>
                                                    </td>
                                                    <td className="px-5 py-4"><StatusPill status={ward.status} /></td>
                                                </TableRow>
                                            );
                                        })}

                                        {activeTab === "rooms" && currentList.map((room: any) => (
                                            <TableRow key={room.id} onEdit={() => openModal(room)} onDelete={() => handleDelete(room.id)}>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0">
                                                            <DoorOpen className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900 text-sm">Room {room.room_number}</div>
                                                            <div className="text-xs text-gray-400">{room.description || "Ward Room"}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <LayoutGrid className="w-3.5 h-3.5 text-gray-400" />
                                                        {room.ward_name}
                                                    </div>
                                                    <div className="text-xs text-gray-400">Capacity: {room.capacity}</div>
                                                </td>
                                                <td className="px-5 py-4"><StatusPill status={room.status} /></td>
                                            </TableRow>
                                        ))}

                                        {activeTab === "beds" && currentList.map((bed: any) => (
                                            <TableRow key={bed.id} onEdit={undefined} onDelete={() => handleDelete(bed.id)}>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                                            <BedIcon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900 text-sm">Bed {bed.bed_number}</div>
                                                            <div className="text-xs text-gray-400">Room {bed.room_number || "Open Ward"}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="text-sm text-gray-600">{bed.ward_name}</div>
                                                    <div className="text-xs text-gray-400">₦{(bed.daily_rate || 0).toLocaleString()}/day</div>
                                                </td>
                                                <td className="px-5 py-4"><StatusPill status={bed.status} /></td>
                                            </TableRow>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-0">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingItem ? "Edit" : "Add"} {activeTab === "departments" ? "Department" : activeTab === "wards" ? "Ward" : activeTab === "rooms" ? "Room" : "Bed"}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">Fill in all required fields</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {error && (
                                <div className="flex items-center gap-2.5 p-3.5 bg-red-50 rounded-xl text-red-700 text-sm font-medium border border-red-100">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {activeTab === "departments" && (
                                <>
                                    <Field label="Department Name *"><Input required value={formData.name || ""} onChange={v => setField("name", v)} placeholder="e.g., Internal Medicine" /></Field>
                                    <Field label="Location"><Input value={formData.location || ""} onChange={v => setField("location", v)} placeholder="e.g., Block A, 2nd Floor" /></Field>
                                    <Field label="Status"><Select value={formData.status || "Active"} options={["Active", "Inactive"]} onChange={v => setField("status", v)} /></Field>
                                    <Field label="Description"><Textarea value={formData.description || ""} onChange={v => setField("description", v)} placeholder="Brief description of this department..." /></Field>
                                </>
                            )}

                            {activeTab === "wards" && (
                                <>
                                    <Field label="Ward Name *"><Input required value={formData.name || ""} onChange={v => setField("name", v)} placeholder="e.g., Female Surgical Ward" /></Field>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Ward Type *">
                                            <Select value={formData.ward_type || "general"}
                                                options={Object.keys(WARD_TYPE_META)}
                                                labelMap={Object.fromEntries(Object.entries(WARD_TYPE_META).map(([k, v]) => [k, v.label]))}
                                                onChange={v => setField("ward_type", v)}
                                            />
                                        </Field>
                                        <Field label="Status">
                                            <Select value={formData.status || "active"} options={["active", "full", "maintenance", "inactive"]} onChange={v => setField("status", v)} />
                                        </Field>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Floor"><Input value={formData.floor || ""} onChange={v => setField("floor", v)} placeholder="e.g., Ground, 1st" /></Field>
                                        <Field label="Total Beds"><Input type="number" value={formData.total_beds || 0} onChange={v => setField("total_beds", parseInt(v))} /></Field>
                                    </div>
                                    <Field label="Nurse Station"><Input value={formData.nurse_station || ""} onChange={v => setField("nurse_station", v)} placeholder="e.g., Station A" /></Field>
                                    <Field label="Description"><Textarea value={formData.description || ""} onChange={v => setField("description", v)} placeholder="Notes about this ward..." /></Field>
                                </>
                            )}

                            {activeTab === "rooms" && (
                                <>
                                    <Field label="Room Number *"><Input required value={formData.room_number || ""} onChange={v => setField("room_number", v)} placeholder="e.g., 101A" /></Field>
                                    <Field label="Ward Name *"><Input required value={formData.ward_name || ""} onChange={v => setField("ward_name", v)} placeholder="e.g., Female Surgical Ward" /></Field>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Capacity (beds)"><Input type="number" value={formData.capacity || 1} onChange={v => setField("capacity", parseInt(v))} /></Field>
                                        <Field label="Status"><Select value={formData.status || "available"} options={["available", "occupied", "maintenance"]} onChange={v => setField("status", v)} /></Field>
                                    </div>
                                    <Field label="Description"><Textarea value={formData.description || ""} onChange={v => setField("description", v)} placeholder="e.g., Private room with ensuite..." /></Field>
                                </>
                            )}

                            {activeTab === "beds" && (
                                <>
                                    <Field label="Bed Number *"><Input required value={formData.bed_number || ""} onChange={v => setField("bed_number", v)} placeholder="e.g., B-101A" /></Field>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Room Number"><Input value={formData.room_number || ""} onChange={v => setField("room_number", v)} placeholder="e.g., 101A" /></Field>
                                        <Field label="Ward Name *"><Input required value={formData.ward_name || ""} onChange={v => setField("ward_name", v)} placeholder="e.g., General" /></Field>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Daily Rate (₦)"><Input type="number" value={formData.daily_rate || 0} onChange={v => setField("daily_rate", parseFloat(v))} /></Field>
                                        <Field label="Description"><Input value={formData.description || ""} onChange={v => setField("description", v)} placeholder="e.g., Window bed" /></Field>
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-2xl transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl transition-all shadow-md shadow-blue-200 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {saving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                                    {editingItem ? "Save Changes" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function FacilityManagement() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
            <FacilityManagementInner />
        </Suspense>
    );
}

function TableRow({ children, onEdit, onDelete }: {
    children: React.ReactNode;
    onEdit?: () => void;
    onDelete?: () => void;
}) {
    return (
        <tr className="hover:bg-gray-50/70 transition-colors group">
            {children}
            <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                        <button onClick={onEdit} className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {onDelete && (
                        <button onClick={onDelete} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

function StatusPill({ status }: { status: string }) {
    const key = status?.toLowerCase() || "active";
    const cfg = STATUS_CONFIG[key] || STATUS_CONFIG.active;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500">{label}</label>
            {children}
        </div>
    );
}

function Input({ onChange, value, type, required, placeholder, step, min, max }: {
    onChange?: (v: string) => void;
    value?: string | number;
    type?: string;
    required?: boolean;
    placeholder?: string;
    step?: string | number;
    min?: string | number;
    max?: string | number;
}) {
    return (
        <input
            type={type}
            value={value ?? ""}
            required={required}
            placeholder={placeholder}
            step={step}
            min={min}
            max={max}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
        />
    );
}

function Select({ onChange, options, labelMap, value }: {
    onChange?: (v: string) => void;
    options: string[];
    labelMap?: Record<string, string>;
    value?: string;
}) {
    return (
        <select
            value={value ?? ""}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-medium capitalize appearance-none"
        >
            {options.map((opt: string) => (
                <option key={opt} value={opt}>{labelMap?.[opt] || opt}</option>
            ))}
        </select>
    );
}

function Textarea({ onChange, value, placeholder }: {
    onChange?: (v: string) => void;
    value?: string;
    placeholder?: string;
}) {
    return (
        <textarea
            value={value ?? ""}
            placeholder={placeholder}
            rows={3}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-medium resize-none"
        />
    );
}
