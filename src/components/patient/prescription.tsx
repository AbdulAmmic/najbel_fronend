"use client";

import { Plus, Trash2, Search, Pill } from "lucide-react";
import { useState } from "react";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const commonMedications = [
  "Paracetamol 500mg",
  "Amoxicillin 500mg",
  "Ibuprofen 400mg",
  "Lisinopril 10mg",
  "Metformin 500mg",
  "Atorvastatin 20mg",
  "Omeprazole 20mg",
  "Amlodipine 5mg",
  "Salbutamol Inhaler",
  "Cetirizine 10mg"
];

export function PrescriptionComponent() {
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: "1",
      name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily",
      duration: "30 days",
      instructions: "Take with meals"
    }
  ]);

  const [newMedication, setNewMedication] = useState<Medication>({
    id: "",
    name: "",
    dosage: "",
    frequency: "Once daily",
    duration: "7 days",
    instructions: ""
  });

  const [searchTerm, setSearchTerm] = useState("");

  const addMedication = () => {
    if (newMedication.name && newMedication.dosage) {
      const medication: Medication = {
        ...newMedication,
        id: Date.now().toString()
      };
      setMedications([...medications, medication]);
      setNewMedication({
        id: "",
        name: "",
        dosage: "",
        frequency: "Once daily",
        duration: "7 days",
        instructions: ""
      });
    }
  };

  const removeMedication = (id: string) => {
    setMedications(medications.filter(med => med.id !== id));
  };

  const filteredMedications = commonMedications.filter(med =>
    med.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectCommonMedication = (med: string) => {
    const [name, dosage] = med.split(' ');
    setNewMedication({
      ...newMedication,
      name,
      dosage: dosage || ""
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Prescription</h2>
        <button
          onClick={addMedication}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add Medication
        </button>
      </div>

      {/* Search Common Medications */}
      <div className="mb-6">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search common medications..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {searchTerm && (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-2">
            <p className="text-xs text-gray-500 mb-2">Common Medications:</p>
            <div className="flex flex-wrap gap-2">
              {filteredMedications.map((med, index) => (
                <button
                  key={index}
                  onClick={() => selectCommonMedication(med)}
                  className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-blue-50 hover:border-blue-300 transition"
                >
                  {med}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Medication Form */}
      <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h3 className="font-medium text-gray-900 mb-4">New Medication</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Medication Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={newMedication.name}
              onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
              placeholder="e.g., Metformin"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Dosage</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={newMedication.dosage}
              onChange={(e) => setNewMedication({...newMedication, dosage: e.target.value})}
              placeholder="e.g., 500mg"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Frequency</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={newMedication.frequency}
              onChange={(e) => setNewMedication({...newMedication, frequency: e.target.value})}
            >
              <option value="Once daily">Once daily</option>
              <option value="Twice daily">Twice daily</option>
              <option value="Three times daily">Three times daily</option>
              <option value="Four times daily">Four times daily</option>
              <option value="As needed">As needed</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Duration</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={newMedication.duration}
              onChange={(e) => setNewMedication({...newMedication, duration: e.target.value})}
            >
              <option value="7 days">7 days</option>
              <option value="14 days">14 days</option>
              <option value="30 days">30 days</option>
              <option value="60 days">60 days</option>
              <option value="90 days">90 days</option>
              <option value="Continuous">Continuous</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-sm text-gray-600 mb-1 block">Instructions (Optional)</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={newMedication.instructions}
            onChange={(e) => setNewMedication({...newMedication, instructions: e.target.value})}
            placeholder="e.g., Take with meals"
          />
        </div>
      </div>

      {/* Current Medications List */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Current Prescription</h3>
        {medications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Pill className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No medications prescribed yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {medications.map((med) => (
              <div key={med.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{med.name} {med.dosage}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>{med.frequency}</span>
                        <span>•</span>
                        <span>{med.duration}</span>
                        {med.instructions && (
                          <>
                            <span>•</span>
                            <span>{med.instructions}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeMedication(med.id)}
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
            {medications.length} medication{medications.length !== 1 ? 's' : ''} prescribed
          </div>
          <button className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition">
            Print Prescription
          </button>
        </div>
      </div>
    </div>
  );
}