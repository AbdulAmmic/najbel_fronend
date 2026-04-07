"use client";

import { useState, useEffect } from "react";
import { FlaskConical, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface CatalogTest {
  id: number;
  name: string;
  category: string;
  price: number;
  test_type: "PAID" | "FREE";
  sample_type?: string;
}

interface RequestedTest {
  catalog_id: number;
  test_name: string;
  test_type: "PAID" | "FREE";
  price: number;
  priority: "normal" | "urgent";
  status?: "pending" | "done" | "error";
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://najbelbackend-ammicsystems4174-umj4fvky.leapcell.dev/api/v1";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

function authH() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

export default function LabTestRequestPanel({ consultationId }: { consultationId: number }) {
  const [catalog, setCatalog] = useState<CatalogTest[]>([]);
  const [search, setSearch] = useState("");
  const [requested, setRequested] = useState<RequestedTest[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Record<number, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/lab-catalog/`, { headers: authH() });
        if (res.ok) {
          const data = await res.json();
          setCatalog(data);
        }
      } catch {
        console.error("Failed to load lab catalog");
      }
    };
    load();
  }, []);

  const filtered = catalog.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const addTest = (test: CatalogTest) => {
    if (requested.find(r => r.catalog_id === test.id)) return;
    setRequested(prev => [...prev, {
      catalog_id: test.id,
      test_name: test.name,
      test_type: (test.test_type || "PAID") as "PAID" | "FREE",
      price: test.price,
      priority: "normal",
    }]);
  };

  const removeTest = (id: number) => setRequested(prev => prev.filter(r => r.catalog_id !== id));
  const togglePriority = (id: number) => setRequested(prev =>
    prev.map(r => r.catalog_id === id ? { ...r, priority: r.priority === "urgent" ? "normal" : "urgent" } : r)
  );

  const submitAll = async () => {
    if (requested.length === 0) return;
    setSubmitting(true);
    const newResults: Record<number, string> = {};

    for (const test of requested) {
      try {
        const res = await fetch(`${API_BASE}/labs/request`, {
          method: "POST",
          headers: authH(),
          body: JSON.stringify({
            consultation_id: consultationId,
            catalog_id: test.catalog_id,
            priority: test.priority,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          newResults[test.catalog_id] = test.test_type === "FREE"
            ? "Patient notified to upload result"
            : `Invoice created: ₦${test.price.toLocaleString()}`;
          setRequested(prev => prev.map(r => r.catalog_id === test.catalog_id ? { ...r, status: "done" } : r));
        } else {
          newResults[test.catalog_id] = data.detail || "Failed";
          setRequested(prev => prev.map(r => r.catalog_id === test.catalog_id ? { ...r, status: "error" } : r));
        }
      } catch {
        newResults[test.catalog_id] = "Network error";
      }
    }

    setResults(newResults);
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* Search catalog */}
      <div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search lab tests..."
          className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
        />
      </div>

      {/* Catalog list */}
      <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No tests found</p>
        )}
        {filtered.map(test => (
          <button
            key={test.id}
            onClick={() => addTest(test)}
            disabled={!!requested.find(r => r.catalog_id === test.id)}
            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors text-left disabled:opacity-40"
          >
            <div>
              <span className="text-sm font-medium text-gray-800">{test.name}</span>
              <span className="text-xs text-gray-400 ml-2">{test.category}</span>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              (test.test_type || "PAID") === "FREE"
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}>
              {(test.test_type || "PAID") === "FREE" ? "FREE" : `₦${test.price.toLocaleString()}`}
            </span>
          </button>
        ))}
      </div>

      {/* Selected tests */}
      {requested.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Selected Tests</h4>
          {requested.map(test => (
            <div key={test.catalog_id} className={`flex items-center justify-between p-3 rounded-xl border ${
              test.status === "done" ? "bg-green-50 border-green-200" :
              test.status === "error" ? "bg-red-50 border-red-200" :
              "bg-white border-gray-200"
            }`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{test.test_name}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    test.test_type === "FREE" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {test.test_type}
                  </span>
                  {test.priority === "urgent" && (
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">URGENT</span>
                  )}
                </div>
                {results[test.catalog_id] && (
                  <p className="text-xs text-gray-500 mt-0.5">{results[test.catalog_id]}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {test.status === "done" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : test.status === "error" ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <>
                    <button
                      onClick={() => togglePriority(test.catalog_id)}
                      className={`text-xs px-2 py-1 rounded-lg font-medium transition-all ${
                        test.priority === "urgent"
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {test.priority === "urgent" ? "Urgent" : "Normal"}
                    </button>
                    <button
                      onClick={() => removeTest(test.catalog_id)}
                      className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 hover:bg-red-50 rounded-lg transition-all"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={submitAll}
            disabled={submitting || requested.every(r => r.status === "done")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold shadow-md hover:bg-violet-700 transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
            {submitting ? "Submitting..." : `Request ${requested.filter(r => !r.status).length} Test(s)`}
          </button>
        </div>
      )}
    </div>
  );
}
