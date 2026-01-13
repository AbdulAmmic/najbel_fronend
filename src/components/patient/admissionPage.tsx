"use client";

import { Bed, Building, User, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";

interface Room {
  id: string;
  number: string;
  type: "general" | "private" | "icu" | "emergency";
  floor: string;
  ward: string;
  status: "available" | "occupied" | "maintenance";
}

export function AdmissionComponent() {
  const [isAdmitting, setIsAdmitting] = useState(false);
  const [admissionReason, setAdmissionReason] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [admissionType, setAdmissionType] = useState<"emergency" | "elective" | "transfer">("elective");

  const rooms: Room[] = [
    { id: "1", number: "101", type: "general", floor: "1", ward: "A", status: "available" },
    { id: "2", number: "102", type: "general", floor: "1", ward: "A", status: "available" },
    { id: "3", number: "201", type: "private", floor: "2", ward: "B", status: "available" },
    { id: "4", number: "202", type: "private", floor: "2", ward: "B", status: "occupied" },
    { id: "5", number: "ICU-1", type: "icu", floor: "3", ward: "ICU", status: "available" },
    { id: "6", number: "ICU-2", type: "icu", floor: "3", ward: "ICU", status: "maintenance" },
    { id: "7", number: "ER-1", type: "emergency", floor: "1", ward: "ER", status: "available" },
    { id: "8", number: "ER-2", type: "emergency", floor: "1", ward: "ER", status: "available" },
  ];

  const handleAdmission = () => {
    if (admissionReason && selectedRoom) {
      // Handle admission logic
      console.log("Admitting patient:", { admissionReason, selectedRoom, admissionType });
      setIsAdmitting(false);
      setAdmissionReason("");
      setSelectedRoom("");
    }
  };

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case "general": return "bg-blue-100 text-blue-700";
      case "private": return "bg-emerald-100 text-emerald-700";
      case "icu": return "bg-red-100 text-red-700";
      case "emergency": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-emerald-100 text-emerald-700";
      case "occupied": return "bg-red-100 text-red-700";
      case "maintenance": return "bg-amber-100 text-amber-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const availableRooms = rooms.filter(room => room.status === "available");

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Admission</h2>
          <p className="text-sm text-gray-500 mt-1">Patient is currently in outpatient care</p>
        </div>
        <button
          onClick={() => setIsAdmitting(true)}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition"
        >
          <Bed className="w-5 h-5" />
          Admit Patient
        </button>
      </div>

      {isAdmitting && (
        <div className="mb-8 p-6 bg-red-50 rounded-xl border border-red-200">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Admit to Hospital</h3>
          </div>

          <div className="space-y-6">
            {/* Admission Type */}
            <div>
              <label className="text-sm font-medium text-gray-900 mb-3 block">Admission Type</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setAdmissionType("elective")}
                  className={`p-4 rounded-xl border transition ${
                    admissionType === "elective"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Clock className={`w-5 h-5 ${admissionType === "elective" ? "text-blue-600" : "text-gray-400"}`} />
                    <span className={`font-medium ${admissionType === "elective" ? "text-blue-700" : "text-gray-600"}`}>
                      Elective
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setAdmissionType("emergency")}
                  className={`p-4 rounded-xl border transition ${
                    admissionType === "emergency"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className={`w-5 h-5 ${admissionType === "emergency" ? "text-red-600" : "text-gray-400"}`} />
                    <span className={`font-medium ${admissionType === "emergency" ? "text-red-700" : "text-gray-600"}`}>
                      Emergency
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setAdmissionType("transfer")}
                  className={`p-4 rounded-xl border transition ${
                    admissionType === "transfer"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Building className={`w-5 h-5 ${admissionType === "transfer" ? "text-purple-600" : "text-gray-400"}`} />
                    <span className={`font-medium ${admissionType === "transfer" ? "text-purple-700" : "text-gray-600"}`}>
                      Transfer
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Reason for Admission */}
            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">Reason for Admission</label>
              <textarea
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
                placeholder="Describe the medical necessity for admission..."
                value={admissionReason}
                onChange={(e) => setAdmissionReason(e.target.value)}
              />
            </div>

            {/* Room Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-900">Select Room</label>
                <span className="text-sm text-gray-500">
                  {availableRooms.length} room{availableRooms.length !== 1 ? 's' : ''} available
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    className={`p-4 rounded-xl border transition ${
                      selectedRoom === room.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Bed className={`w-5 h-5 ${
                        selectedRoom === room.id ? "text-blue-600" : "text-gray-400"
                      }`} />
                      <div className="text-center">
                        <p className={`font-bold ${selectedRoom === room.id ? "text-blue-700" : "text-gray-900"}`}>
                          {room.number}
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${getRoomTypeColor(room.type)}`}>
                            {room.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {room.floor}/{room.ward}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => setIsAdmitting(false)}
                className="px-6 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAdmission}
                disabled={!admissionReason || !selectedRoom}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Admission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Admission Status */}
      <div className="p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Building className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Outpatient Status</p>
              <p className="text-sm text-gray-500">Not currently admitted</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Last admission: Jan 15, 2024
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          Emergency admission requires additional authorization
        </div>
      </div>
    </div>
  );
}