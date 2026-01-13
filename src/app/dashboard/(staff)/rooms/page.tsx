"use client";

import { useState, useEffect } from "react";
import { FaBed, FaUser, FaCheck, FaTimes } from "react-icons/fa";

interface Bed {
  id: number;
  ward_name: string;
  bed_number: string;
  status: "available" | "occupied" | "maintenance";
  patient_id?: number;
  patient?: {
    full_name: string;
  };
}

export default function BedManagementPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBeds = () => {
    fetch("/api/v1/beds/", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        setBeds(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBeds();
  }, []);

  const handleDischarge = async (bedId: number) => {
    if (!confirm("Discharge patient from this bed?")) return;

    try {
      const res = await fetch(`/api/v1/beds/${bedId}/discharge`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        fetchBeds(); // Refresh
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8">Loading Beds...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bed Management</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">+ Add Bed</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {beds.map((bed) => (
          <div key={bed.id} className={`border rounded-xl p-4 shadow-sm relative overflow-hidden ${bed.status === 'occupied' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-full ${bed.status === 'occupied' ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}`}>
                  <FaBed size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{bed.ward_name}</h3>
                  <p className="text-sm font-semibold">{bed.bed_number}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold ${bed.status === 'occupied' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                {bed.status}
              </span>
            </div>

            {bed.status === 'occupied' && (
              <div className="mt-4 pt-4 border-t border-red-100">
                <p className="text-sm text-gray-500 mb-1">Patient</p>
                <div className="flex items-center space-x-2 font-medium text-gray-800">
                  <FaUser className="text-gray-400" />
                  <span>{bed.patient?.full_name || "Patient ID: " + bed.patient_id}</span>
                </div>
                <button
                  onClick={() => handleDischarge(bed.id)}
                  className="w-full mt-4 bg-white border border-red-300 text-red-600 py-2 rounded-lg text-sm hover:bg-red-50"
                >
                  Discharge
                </button>
              </div>
            )}

            {bed.status === 'available' && (
              <div className="mt-4 pt-4 border-t border-green-100 text-center">
                <p className="text-green-700 text-sm italic">Ready for admission</p>
              </div>
            )}
          </div>
        ))}

        {beds.length === 0 && <p className="text-gray-500 col-span-full text-center py-10">No beds configured.</p>}
      </div>
    </div>
  );
}