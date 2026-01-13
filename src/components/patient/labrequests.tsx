"use client";

import { Plus, Trash2, FileText, AlertCircle } from "lucide-react";
import { useState } from "react";

interface LabTest {
  id: string;
  name: string;
  category: string;
  priority: "routine" | "urgent" | "stat";
  notes: string;
}

const commonTests = [
  { name: "Complete Blood Count", category: "Hematology" },
  { name: "Lipid Profile", category: "Chemistry" },
  { name: "Liver Function Tests", category: "Chemistry" },
  { name: "Renal Function Tests", category: "Chemistry" },
  { name: "Thyroid Function Tests", category: "Endocrinology" },
  { name: "HbA1c", category: "Diabetes" },
  { name: "Urinalysis", category: "Urine" },
  { name: "Chest X-Ray", category: "Radiology" },
  { name: "ECG", category: "Cardiology" },
  { name: "Blood Culture", category: "Microbiology" }
];

export function LabRequestComponent() {
  const [tests, setTests] = useState<LabTest[]>([
    {
      id: "1",
      name: "Complete Blood Count",
      category: "Hematology",
      priority: "routine",
      notes: "Check for anemia"
    }
  ]);

  const [newTest, setNewTest] = useState<LabTest>({
    id: "",
    name: "",
    category: "",
    priority: "routine",
    notes: ""
  });

  const [selectedCategory, setSelectedCategory] = useState("all");

  const addTest = () => {
    if (newTest.name) {
      const test: LabTest = {
        ...newTest,
        id: Date.now().toString()
      };
      setTests([...tests, test]);
      setNewTest({
        id: "",
        name: "",
        category: "",
        priority: "routine",
        notes: ""
      });
    }
  };

  const removeTest = (id: string) => {
    setTests(tests.filter(test => test.id !== id));
  };

  const categories = Array.from(new Set(commonTests.map(test => test.category)));

  const filteredTests = selectedCategory === "all" 
    ? commonTests 
    : commonTests.filter(test => test.category === selectedCategory);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Lab Test Requests</h2>
        <button
          onClick={addTest}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add Test
        </button>
      </div>

      {/* Categories Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedCategory === "all"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Tests
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === category
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-3">Common Tests:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredTests.map((test, index) => (
              <button
                key={index}
                onClick={() => setNewTest({
                  ...newTest,
                  name: test.name,
                  category: test.category
                })}
                className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
              >
                <p className="font-medium text-gray-900">{test.name}</p>
                <p className="text-sm text-gray-500 mt-1">{test.category}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* New Test Form */}
      <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h3 className="font-medium text-gray-900 mb-4">New Lab Test</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Test Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={newTest.name}
              onChange={(e) => setNewTest({...newTest, name: e.target.value})}
              placeholder="e.g., Complete Blood Count"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Category</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={newTest.category}
              onChange={(e) => setNewTest({...newTest, category: e.target.value})}
              placeholder="e.g., Hematology"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Priority</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={newTest.priority}
              onChange={(e) => setNewTest({...newTest, priority: e.target.value as any})}
            >
              <option value="routine">Routine (3-5 days)</option>
              <option value="urgent">Urgent (24-48 hours)</option>
              <option value="stat">STAT (Immediate)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Clinical Notes</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={newTest.notes}
              onChange={(e) => setNewTest({...newTest, notes: e.target.value})}
              placeholder="e.g., Rule out infection"
            />
          </div>
        </div>
      </div>

      {/* Current Lab Requests */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Requested Tests</h3>
        {tests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No lab tests requested yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map((test) => (
              <div key={test.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      test.priority === "stat" ? "bg-red-100 text-red-600" :
                      test.priority === "urgent" ? "bg-orange-100 text-orange-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{test.name}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>{test.category}</span>
                            <span>•</span>
                            <span className={`font-medium ${
                              test.priority === "stat" ? "text-red-600" :
                              test.priority === "urgent" ? "text-orange-600" :
                              "text-blue-600"
                            }`}>
                              {test.priority.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {test.priority === "stat" && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                              <AlertCircle className="w-3 h-3" />
                              Immediate
                            </div>
                          )}
                        </div>
                      </div>
                      {test.notes && (
                        <p className="text-sm text-gray-600 mt-2">{test.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeTest(test.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {tests.length} test{tests.length !== 1 ? 's' : ''} requested
          </div>
          <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition">
            Send to Lab
          </button>
        </div>
      </div>
    </div>
  );
}