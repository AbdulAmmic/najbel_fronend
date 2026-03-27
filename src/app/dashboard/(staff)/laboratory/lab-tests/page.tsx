"use client";

import { useState, useEffect } from "react";
import {
    FlaskConical, Plus, Pencil, Trash2, X, Search,
    CheckCircle2, AlertCircle, DollarSign, Clock, Save,
    RefreshCw, ChevronDown, ChevronRight, Layers,
    Droplets, Activity, Tag, ToggleLeft, ToggleRight, Table
} from "lucide-react";
import { labCatalog } from "@/services/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ColumnDef {
    name: string;       // e.g. "Hemoglobin"
    unit: string;       // e.g. "g/dL"
    ref_range: string;  // e.g. "12–16"
    data_type: "number" | "text" | "boolean";
}

interface LabTest {
    id: number;
    name: string;
    category: string;
    description?: string;
    price: number;
    turnaround_hours?: number;
    sample_type?: string;
    columns?: string; // JSON
    is_active: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
    "General", "Hematology", "Biochemistry", "Microbiology",
    "Immunology", "Serology", "Parasitology", "Urinalysis",
    "Hormones", "Radiology", "Pathology", "Other"
];
const SAMPLE_TYPES = ["Blood", "Urine", "Stool", "Swab", "Sputum", "CSF", "Tissue", "Other"];
const DATA_TYPES: ("number" | "text" | "boolean")[] = ["number", "text", "boolean"];

const CAT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    Hematology:   { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500" },
    Biochemistry: { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500" },
    Microbiology: { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500" },
    Immunology:   { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
    Serology:     { bg: "bg-pink-50",   text: "text-pink-700",   dot: "bg-pink-500" },
    Parasitology: { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500" },
    Urinalysis:   { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
    Hormones:     { bg: "bg-rose-50",   text: "text-rose-700",   dot: "bg-rose-500" },
    Radiology:    { bg: "bg-cyan-50",   text: "text-cyan-700",   dot: "bg-cyan-500" },
    Pathology:    { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
    General:      { bg: "bg-gray-100",  text: "text-gray-700",   dot: "bg-gray-400" },
    Other:        { bg: "bg-gray-100",  text: "text-gray-500",   dot: "bg-gray-400" },
};
const c = (cat: string) => CAT_COLORS[cat] || CAT_COLORS.Other;

const BLANK_COL: ColumnDef = { name: "", unit: "", ref_range: "", data_type: "number" };
const BLANK_FORM = {
    name: "", category: "General", description: "",
    price: "", turnaround_hours: "24", sample_type: "Blood", is_active: true,
};

const parseCols = (json?: string): ColumnDef[] => {
    try { return JSON.parse(json || "[]") || []; } catch { return []; }
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminLabTestsPage() {
    const [tests, setTests]       = useState<LabTest[]>([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState("");
    const [catFilter, setCatFilter] = useState("All");
    const [modal, setModal]       = useState<"add" | "edit" | null>(null);
    const [editId, setEditId]     = useState<number | null>(null);
    const [form, setForm]         = useState<any>(BLANK_FORM);
    const [cols, setCols]         = useState<ColumnDef[]>([]);
    const [saving, setSaving]     = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [expanded, setExpanded] = useState<number | null>(null);
    const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3500);
    };

    const load = async () => {
        setLoading(true);
        try {
            const data = await labCatalog.getAll();
            setTests(Array.isArray(data) ? data : []);
        } catch { setTests([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const openAdd = () => {
        setForm(BLANK_FORM); setCols([{ ...BLANK_COL }]);
        setEditId(null); setModal("add");
    };

    const openEdit = (t: LabTest) => {
        setEditId(t.id);
        setForm({
            name: t.name, category: t.category, description: t.description || "",
            price: String(t.price), turnaround_hours: String(t.turnaround_hours || 24),
            sample_type: t.sample_type || "Blood", is_active: t.is_active,
        });
        setCols(parseCols(t.columns));
        setModal("edit");
    };

    const sf = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
    const addCol  = () => setCols(p => [...p, { ...BLANK_COL }]);
    const delCol  = (i: number) => setCols(p => p.filter((_, j) => j !== i));
    const setCol  = <K extends keyof ColumnDef>(i: number, k: K, v: ColumnDef[K]) =>
        setCols(p => p.map((c, j) => j === i ? { ...c, [k]: v } : c));

    const handleSave = async () => {
        if (!form.name.trim()) return showToast("Test name is required.", false);
        if (!form.price || isNaN(parseFloat(form.price))) return showToast("A valid price is required.", false);
        setSaving(true);
        try {
            const payload = {
                ...form,
                price: parseFloat(form.price),
                turnaround_hours: parseInt(form.turnaround_hours) || 24,
                columns: JSON.stringify(cols.filter(c => c.name.trim())),
            };
            if (modal === "add") { await labCatalog.create(payload); showToast("Lab test created!"); }
            else if (editId)     { await labCatalog.update(editId, payload); showToast("Lab test updated!"); }
            setModal(null);
            load();
        } catch (e: any) {
            showToast(e?.response?.data?.detail || "Save failed.", false);
        } finally { setSaving(false); }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try { await labCatalog.delete(deleteId); showToast("Test deactivated."); load(); }
        catch { showToast("Failed to delete.", false); }
        setDeleteId(null);
    };

    const cats = ["All", ...CATEGORIES];
    const filtered = tests.filter(t => {
        const s = search.toLowerCase();
        return (!s || t.name.toLowerCase().includes(s) || t.category.toLowerCase().includes(s))
            && (catFilter === "All" || t.category === catFilter);
    });

    const totalTests  = tests.length;
    const activeCount = tests.filter(t => t.is_active).length;
    const avgPrice    = totalTests ? Math.round(tests.reduce((s, t) => s + t.price, 0) / totalTests) : 0;

    return (
        <div className="min-h-screen bg-[#F4F6FA]">

            {/* ── Toast ─────────────────────────────────── */}
            {toast && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[400] px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2 ${toast.ok ? "bg-emerald-600 text-white" : "bg-red-500 text-white"}`}>
                    {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* ── Header ────────────────────────────────── */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-5 pt-6 pb-0">

                    {/* Title row */}
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">Lab Test Catalog</h1>
                            <p className="text-xs text-gray-400 mt-0.5">Define tests, configure result columns, and set charge fees</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={load} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition active:scale-95">
                                <RefreshCw className="w-4 h-4 text-gray-500" />
                            </button>
                            <button onClick={openAdd}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition active:scale-95">
                                <Plus className="w-4 h-4" /> Add Lab Test
                            </button>
                        </div>
                    </div>

                    {/* KPI chips */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                        {[
                            { label: "Total Tests",  value: totalTests,  icon: FlaskConical, from: "from-blue-500",    to: "to-blue-600" },
                            { label: "Active",       value: activeCount, icon: CheckCircle2, from: "from-emerald-500", to: "to-teal-600" },
                            { label: "Avg Price (₦)",value: `₦${avgPrice.toLocaleString()}`, icon: DollarSign, from: "from-violet-500", to: "to-purple-600" },
                        ].map((k, i) => (
                            <div key={i} className={`bg-gradient-to-br ${k.from} ${k.to} text-white rounded-2xl p-4 shadow-md flex items-center gap-3`}>
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <k.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xl font-black leading-none">{k.value}</div>
                                    <div className="text-[10px] font-bold opacity-80 mt-0.5">{k.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search + category filter */}
                    <div className="flex gap-2 pb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search by name or category…"
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white transition" />
                        </div>
                        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none appearance-none focus:border-blue-400">
                            {cats.map(ca => <option key={ca}>{ca}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── List ──────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-5 py-5 pb-20 space-y-3">
                {loading ? (
                    <div className="flex justify-center py-24">
                        <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-24 gap-3 text-gray-300">
                        <FlaskConical className="w-12 h-12" />
                        <p className="text-sm text-gray-400">No lab tests found</p>
                        <button onClick={openAdd} className="mt-1 text-sm text-blue-600 hover:underline font-semibold">+ Add the first one</button>
                    </div>
                ) : filtered.map(t => {
                    const testCols = parseCols(t.columns);
                    const isOpen   = expanded === t.id;
                    const cc       = c(t.category);

                    return (
                        <div key={t.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isOpen ? "border-blue-200 shadow-blue-50" : "border-gray-100"}`}>
                            {/* Row */}
                            <div className="flex items-center gap-3 px-5 py-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : t.id)}>
                                {/* Category dot + icon */}
                                <div className={`w-11 h-11 ${cc.bg} rounded-xl flex items-center justify-center shrink-0`}>
                                    <FlaskConical className={`w-5 h-5 ${cc.text}`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-black text-gray-900 text-sm">{t.name}</p>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${cc.bg} ${cc.text}`}>{t.category}</span>
                                        {!t.is_active && <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">INACTIVE</span>}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        <span className="text-xs text-gray-500 flex items-center gap-1"><Droplets className="w-3 h-3" />{t.sample_type}</span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{t.turnaround_hours}h</span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1"><Layers className="w-3 h-3" />{testCols.length} columns</span>
                                    </div>
                                </div>

                                {/* Price + actions */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right">
                                        <p className="text-lg font-black text-gray-900">₦{t.price.toLocaleString()}</p>
                                        <p className="text-[9px] text-gray-400 font-medium">charge fee</p>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <button onClick={e => { e.stopPropagation(); openEdit(t); }}
                                            className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-600 transition active:scale-90">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); setDeleteId(t.id); }}
                                            className="p-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-500 transition active:scale-90">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-300" />}
                                </div>
                            </div>

                            {/* Expanded: columns table */}
                            {isOpen && (
                                <div className="border-t border-gray-50 bg-gray-50/40 px-5 py-4">
                                    {t.description && (
                                        <p className="text-xs text-gray-500 mb-4 leading-relaxed bg-white border border-gray-100 rounded-xl px-4 py-3">{t.description}</p>
                                    )}

                                    {testCols.length === 0 ? (
                                        <div className="flex items-center gap-2 py-4 justify-center text-gray-400">
                                            <Table className="w-4 h-4" />
                                            <p className="text-sm">No columns defined for this test</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Test Result Columns</p>
                                            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                            <th className="text-left px-4 py-3">#</th>
                                                            <th className="text-left px-4 py-3">Parameter Name</th>
                                                            <th className="text-left px-4 py-3">Unit</th>
                                                            <th className="text-left px-4 py-3">Reference Range</th>
                                                            <th className="text-left px-4 py-3">Type</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {testCols.map((col, i) => (
                                                            <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                                                                <td className="px-4 py-3 text-gray-400 font-bold text-xs w-8">{i + 1}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className="font-bold text-gray-900">{col.name}</span>
                                                                </td>
                                                                <td className="px-4 py-3 text-gray-500">{col.unit || "—"}</td>
                                                                <td className="px-4 py-3">
                                                                    {col.ref_range
                                                                        ? <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">{col.ref_range}</span>
                                                                        : <span className="text-gray-300">—</span>
                                                                    }
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${col.data_type === "number" ? "bg-blue-50 text-blue-600" : col.data_type === "boolean" ? "bg-violet-50 text-violet-600" : "bg-gray-100 text-gray-500"}`}>
                                                                        {col.data_type}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}

                                    <button onClick={() => openEdit(t)}
                                        className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-bold">
                                        <Pencil className="w-3.5 h-3.5" /> Edit test &amp; columns
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ══ Add / Edit Modal ═════════════════════════════════════════ */}
            {modal && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)} />
                    <div className="relative bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 flex flex-col max-h-[96vh]">

                        {/* Handle */}
                        <div className="flex justify-center pt-3 sm:hidden"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>

                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-50 shrink-0">
                            <div>
                                <h2 className="font-black text-gray-900 text-base">{modal === "add" ? "Create Lab Test" : "Edit Lab Test"}</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Configure test details, result columns, and charge fee</p>
                            </div>
                            <button onClick={() => setModal(null)} className="p-2 rounded-xl hover:bg-gray-100 transition">
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

                            {/* ─ Section 1: Basic Info ─ */}
                            <Section title="Basic Information" icon={Tag}>
                                <div className="space-y-3">
                                    <FRow l="Test Name *">
                                        <FInput placeholder="e.g. Full Blood Count" v={form.name} s={v => sf("name", v)} />
                                    </FRow>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FRow l="Category">
                                            <FSelect opts={CATEGORIES} v={form.category} s={v => sf("category", v)} />
                                        </FRow>
                                        <FRow l="Sample Type">
                                            <FSelect opts={SAMPLE_TYPES} v={form.sample_type} s={v => sf("sample_type", v)} />
                                        </FRow>
                                    </div>
                                    <FRow l="Description (optional)">
                                        <textarea rows={2} value={form.description} onChange={e => sf("description", e.target.value)}
                                            placeholder="What does this test detect or measure?"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition resize-none" />
                                    </FRow>
                                </div>
                            </Section>

                            {/* ─ Section 2: Pricing & Turnaround ─ */}
                            <Section title="Pricing & Turnaround" icon={DollarSign}>
                                <div className="grid grid-cols-2 gap-3">
                                    <FRow l="Charge Fee (₦) *">
                                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 focus-within:bg-white transition overflow-hidden">
                                            <span className="pl-4 text-gray-400 font-bold select-none">₦</span>
                                            <input type="number" min="0" value={form.price} onChange={e => sf("price", e.target.value)} placeholder="0.00"
                                                className="flex-1 pr-4 py-3 text-sm font-bold text-gray-900 outline-none bg-transparent" />
                                        </div>
                                    </FRow>
                                    <FRow l="Turnaround (hours)">
                                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 focus-within:bg-white transition overflow-hidden">
                                            <Clock className="w-3.5 h-3.5 text-gray-400 ml-3 shrink-0" />
                                            <input type="number" min="1" value={form.turnaround_hours} onChange={e => sf("turnaround_hours", e.target.value)} placeholder="24"
                                                className="flex-1 pr-4 py-3 text-sm font-bold text-gray-900 outline-none bg-transparent" />
                                        </div>
                                    </FRow>
                                </div>
                            </Section>

                            {/* ─ Section 3: Result Columns ─ */}
                            <Section title="Result Columns" icon={Table} badge={cols.length}>
                                <div className="space-y-2 mb-3">
                                    {cols.length === 0 ? (
                                        <div className="text-center py-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                                            <Table className="w-6 h-6 mx-auto mb-2 opacity-40" />
                                            <p className="text-xs">No columns yet — add a parameter below</p>
                                        </div>
                                    ) : cols.map((col, i) => (
                                        <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50/30">
                                            {/* Column header */}
                                            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Column {i + 1}</span>
                                                <button onClick={() => delCol(i)} className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Column fields */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3">
                                                <div className="sm:col-span-2">
                                                    <label className="text-[10px] font-bold text-gray-400 mb-1 block">Parameter Name *</label>
                                                    <input value={col.name} onChange={e => setCol(i, "name", e.target.value)}
                                                        placeholder="e.g. Hemoglobin, WBC, pH…"
                                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-400 transition" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 mb-1 block">Unit</label>
                                                    <input value={col.unit} onChange={e => setCol(i, "unit", e.target.value)}
                                                        placeholder="g/dL, mmol/L…"
                                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-400 transition" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 mb-1 block">Type</label>
                                                    <select value={col.data_type} onChange={e => setCol(i, "data_type", e.target.value as any)}
                                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-blue-400 transition appearance-none capitalize">
                                                        {DATA_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                                                    </select>
                                                </div>
                                                <div className="sm:col-span-4">
                                                    <label className="text-[10px] font-bold text-gray-400 mb-1 block">Reference Range</label>
                                                    <input value={col.ref_range} onChange={e => setCol(i, "ref_range", e.target.value)}
                                                        placeholder="e.g. 12–16, 4.5–11.0, &lt;200…"
                                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none focus:border-blue-400 transition" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={addCol}
                                    className="w-full py-2.5 border-2 border-dashed border-blue-300 text-blue-600 text-sm font-bold rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition flex items-center justify-center gap-2">
                                    <Plus className="w-4 h-4" /> Add Column
                                </button>
                            </Section>

                            {/* ─ Section 4: Status ─ */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                                <div>
                                    <p className="text-sm font-bold text-gray-800">Active Test</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Visible to doctors when requesting lab tests</p>
                                </div>
                                <button onClick={() => sf("is_active", !form.is_active)} className="transition active:scale-90">
                                    {form.is_active
                                        ? <ToggleRight className="w-9 h-9 text-blue-600" />
                                        : <ToggleLeft className="w-9 h-9 text-gray-400" />
                                    }
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 px-6 py-4 border-t border-gray-50 bg-gray-50/50 rounded-b-3xl shrink-0">
                            <button onClick={() => setModal(null)} className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-2xl transition">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-200 transition disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                                <Save className="w-4 h-4" />
                                {saving ? "Saving…" : modal === "add" ? "Create Lab Test" : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete confirm ─────────────────────────── */}
            {deleteId && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
                    <div className="relative bg-white rounded-3xl p-7 shadow-2xl z-10 w-[320px] text-center">
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="font-black text-gray-900 text-lg mb-1">Deactivate Test?</h3>
                        <p className="text-xs text-gray-400 mb-6 leading-relaxed">This test will be hidden from doctors. Existing data is preserved and can be reactivated anytime.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition">Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl shadow-md shadow-red-200 transition">Deactivate</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Reusable sub-components ─────────────────────────────────────────────────

function Section({ title, icon: Icon, badge, children }: { title: string; icon: any; badge?: number; children: React.ReactNode }) {
    return (
        <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-50 bg-gray-50/50">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-black text-gray-700">{title}</span>
                {badge !== undefined && badge > 0 && (
                    <span className="ml-auto text-[10px] bg-blue-100 text-blue-700 font-black px-2 py-0.5 rounded-full">{badge}</span>
                )}
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

function FRow({ l, children }: { l: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">{l}</label>
            {children}
        </div>
    );
}

function FInput({ v, s, placeholder }: { v: string; s: (v: string) => void; placeholder?: string }) {
    return (
        <input value={v} onChange={e => s(e.target.value)} placeholder={placeholder}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder:text-gray-400 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
    );
}

function FSelect({ opts, v, s, labels }: { opts: string[]; v: string; s: (v: string) => void; labels?: string[] }) {
    return (
        <select value={v} onChange={e => s(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition appearance-none">
            {opts.map((o, i) => <option key={o} value={o}>{labels ? labels[i] : o}</option>)}
        </select>
    );
}
