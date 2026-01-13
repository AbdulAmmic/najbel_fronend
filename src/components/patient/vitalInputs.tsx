"use client";

import { Plus, Minus, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

interface VitalSign {
  id: string;
  name: string;
  value: string;
  unit: string;
  status: "normal" | "elevated" | "low" | "critical";
  trend: "up" | "down" | "stable";
}

interface VitalSignsInputProps {
  onVitalsUpdate: (vitals: VitalSign[]) => void;
  initialVitals?: VitalSign[];
}

export function VitalSignsInput({ onVitalsUpdate, initialVitals }: VitalSignsInputProps) {
  const [vitals, setVitals] = useState<VitalSign[]>(initialVitals || [
    {
      id: "blood-pressure",
      name: "Blood Pressure",
      value: "128/82",
      unit: "mmHg",
      status: "normal",
      trend: "down"
    },
    {
      id: "heart-rate",
      name: "Heart Rate",
      value: "72",
      unit: "bpm",
      status: "normal",
      trend: "stable"
    },
    {
      id: "temperature",
      name: "Temperature",
      value: "36.8",
      unit: "°C",
      status: "normal",
      trend: "stable"
    },
    {
      id: "glucose",
      name: "Blood Glucose",
      value: "120",
      unit: "mg/dL",
      status: "elevated",
      trend: "down"
    },
    {
      id: "spo2",
      name: "SpO2",
      value: "98",
      unit: "%",
      status: "normal",
      trend: "stable"
    },
    {
      id: "respiratory-rate",
      name: "Respiratory Rate",
      value: "16",
      unit: "/min",
      status: "normal",
      trend: "stable"
    }
  ]);

  const [customVital, setCustomVital] = useState({
    name: "",
    value: "",
    unit: ""
  });
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  const handleVitalChange = (id: string, field: keyof VitalSign, value: string) => {
    const updatedVitals = vitals.map(vital => 
      vital.id === id ? { ...vital, [field]: value } : vital
    );
    setVitals(updatedVitals);
    onVitalsUpdate(updatedVitals);
  };

  const addCustomVital = () => {
    if (customVital.name && customVital.value && customVital.unit) {
      const newVital: VitalSign = {
        id: `custom-${Date.now()}`,
        name: customVital.name,
        value: customVital.value,
        unit: customVital.unit,
        status: "normal",
        trend: "stable"
      };
      
      const updatedVitals = [...vitals, newVital];
      setVitals(updatedVitals);
      onVitalsUpdate(updatedVitals);
      
      setCustomVital({ name: "", value: "", unit: "" });
      setIsAddingCustom(false);
    }
  };

  const removeVital = (id: string) => {
    const updatedVitals = vitals.filter(vital => vital.id !== id);
    setVitals(updatedVitals);
    onVitalsUpdate(updatedVitals);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "bg-emerald-100 text-emerald-700";
      case "elevated": return "bg-orange-100 text-orange-700";
      case "low": return "bg-blue-100 text-blue-700";
      case "critical": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "down": return <TrendingDown className="w-4 h-4 text-emerald-500" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Vital Signs</h2>
          <p className="text-sm text-gray-500 mt-1">Last updated: Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <button
          onClick={() => setIsAddingCustom(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add Vital
        </button>
      </div>

      {isAddingCustom && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Add Custom Vital Sign</h3>
            <button
              onClick={() => setIsAddingCustom(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Vital name (e.g., Blood Pressure)"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={customVital.name}
              onChange={(e) => setCustomVital({...customVital, name: e.target.value})}
            />
            <input
              type="text"
              placeholder="Value (e.g., 120/80)"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={customVital.value}
              onChange={(e) => setCustomVital({...customVital, value: e.target.value})}
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Unit (e.g., mmHg)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={customVital.unit}
                onChange={(e) => setCustomVital({...customVital, unit: e.target.value})}
              />
              <button
                onClick={addCustomVital}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {vitals.map((vital) => (
          <div key={vital.id} className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(vital.status)}`}>
                  {vital.status.charAt(0).toUpperCase() + vital.status.slice(1)}
                </span>
                {getTrendIcon(vital.trend)}
              </div>
              {vital.id.startsWith('custom-') && (
                <button
                  onClick={() => removeVital(vital.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Minus className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <input
              type="text"
              value={vital.value}
              onChange={(e) => handleVitalChange(vital.id, 'value', e.target.value)}
              className="w-full text-2xl font-bold text-gray-900 bg-transparent border-none outline-none mb-1"
            />
            
            <input
              type="text"
              value={vital.name}
              onChange={(e) => handleVitalChange(vital.id, 'name', e.target.value)}
              className="w-full text-xs text-gray-500 bg-transparent border-none outline-none"
            />
            
            <input
              type="text"
              value={vital.unit}
              onChange={(e) => handleVitalChange(vital.id, 'unit', e.target.value)}
              className="w-full text-xs text-gray-400 bg-transparent border-none outline-none mt-1"
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span>Elevated</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>Critical</span>
          </div>
        </div>
        <button
          onClick={() => {
            const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            onVitalsUpdate(vitals);
          }}
          className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
        >
          Update All
        </button>
      </div>
    </div>
  );
}