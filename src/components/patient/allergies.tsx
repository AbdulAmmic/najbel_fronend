"use client";

import { AlertCircle, Plus, Trash2, XCircle } from "lucide-react";
import { useState } from "react";

interface Allergy {
  id: string;
  name: string;
  severity: "mild" | "moderate" | "severe";
  reaction: string;
  notes: string;
}

const commonAllergies = [
  "Penicillin",
  "Sulfa drugs",
  "Aspirin",
  "Ibuprofen",
  "Codeine",
  "Morphine",
  "Latex",
  "Eggs",
  "Peanuts",
  "Shellfish",
  "Dust mites",
  "Pollen",
  "Animal dander"
];

export function AllergiesComponent() {
  const [allergies, setAllergies] = useState<Allergy[]>([
    {
      id: "1",
      name: "Penicillin",
      severity: "severe",
      reaction: "Anaphylaxis",
      notes: "Patient experienced anaphylactic shock in 2018"
    },
    {
      id: "2",
      name: "Sulfa drugs",
      severity: "moderate",
      reaction: "Rash and itching",
      notes: "Developed rash after taking Bactrim"
    }
  ]);

  const [newAllergy, setNewAllergy] = useState<Allergy>({
    id: "",
    name: "",
    severity: "moderate",
    reaction: "",
    notes: ""
  });

  const [searchTerm, setSearchTerm] = useState("");

  const addAllergy = () => {
    if (newAllergy.name) {
      const allergy: Allergy = {
        ...newAllergy,
        id: Date.now().toString()
      };
      setAllergies([...allergies, allergy]);
      setNewAllergy({
        id: "",
        name: "",
        severity: "moderate",
        reaction: "",
        notes: ""
      });
    }
  };

  const removeAllergy = (id: string) => {
    setAllergies(allergies.filter(allergy => allergy.id !== id));
  };

  const filteredAllergies = commonAllergies.filter(allergy =>
    allergy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "mild": return "bg-blue-100 text-blue-700";
      case "moderate": return "bg-amber-100 text-amber-700";
      case "severe": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "severe": return <AlertCircle className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Allergies & Sensitivities</h2>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Critical Information
          </div>
        </div>
      </div>

      {/* Search Common Allergies */}
      <div className="mb-6">
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search common allergies..."
            className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        {searchTerm && (
          <div className="bg-red-50 rounded-lg border border-red-200 p-3">
            <p className="text-xs text-red-600 mb-2">Common Allergies:</p>
            <div className="flex flex-wrap gap-2">
              {filteredAllergies.map((allergy, index) => (
                <button
                  key={index}
                  onClick={() => setNewAllergy({...newAllergy, name: allergy})}
                  className="px-3 py-1 bg-white border border-red-200 rounded text-sm text-red-600 hover:bg-red-100 transition"
                >
                  {allergy}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Allergy Form */}
      <div className="mb-8 p-4 bg-red-50 rounded-xl border border-red-200">
        <h3 className="font-medium text-gray-900 mb-4">Add New Allergy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Allergen Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              value={newAllergy.name}
              onChange={(e) => setNewAllergy({...newAllergy, name: e.target.value})}
              placeholder="e.g., Penicillin"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Severity</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              value={newAllergy.severity}
              onChange={(e) => setNewAllergy({...newAllergy, severity: e.target.value as any})}
            >
              <option value="mild">Mild (Rash, itching)</option>
              <option value="moderate">Moderate (Swelling, breathing issues)</option>
              <option value="severe">Severe (Anaphylaxis)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Reaction</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              value={newAllergy.reaction}
              onChange={(e) => setNewAllergy({...newAllergy, reaction: e.target.value})}
              placeholder="e.g., Anaphylaxis, Rash"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Additional Notes</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              value={newAllergy.notes}
              onChange={(e) => setNewAllergy({...newAllergy, notes: e.target.value})}
              placeholder="e.g., First occurred in 2018"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={addAllergy}
            disabled={!newAllergy.name}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Allergy
          </button>
        </div>
      </div>

      {/* Current Allergies */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Current Allergies</h3>
        {allergies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No allergies recorded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allergies.map((allergy) => (
              <div key={allergy.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getSeverityColor(allergy.severity)}`}>
                      {getSeverityIcon(allergy.severity)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-900">{allergy.name}</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(allergy.severity)}`}>
                          {allergy.severity.toUpperCase()}
                        </span>
                      </div>
                      {allergy.reaction && (
                        <p className="text-sm text-gray-600 mt-1">Reaction: {allergy.reaction}</p>
                      )}
                      {allergy.notes && (
                        <p className="text-sm text-gray-500 mt-1">{allergy.notes}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeAllergy(allergy.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warning Banner */}
      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-700">Important Safety Information</p>
            <p className="text-sm text-red-600 mt-1">
              Allergies marked as "Severe" will trigger automatic alerts on all medication orders.
              Ensure this information is verified and up-to-date.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Last verified: Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition">
            Flag for Verification
          </button>
        </div>
      </div>
    </div>
  );
}