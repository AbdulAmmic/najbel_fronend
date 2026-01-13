"use client";

import { 
  X, 
  Bed, 
  User, 
  Calendar, 
  Clock, 
  Wifi, 
  Tv, 
  Bath, 
  Wind, 
  Thermometer,
  MapPin,
  Building,
  Phone,
  Mail,
  FileText,
  Edit
} from "lucide-react";

interface RoomDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: any;
  onEdit: () => void;
}

export function RoomDetailsModal({ isOpen, onClose, room, onEdit }: RoomDetailsModalProps) {
  if (!isOpen || !room) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-emerald-100 text-emerald-700";
      case "occupied": return "bg-red-100 text-red-700";
      case "maintenance": return "bg-amber-100 text-amber-700";
      case "reserved": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "general": return "bg-blue-100 text-blue-700";
      case "private": return "bg-emerald-100 text-emerald-700";
      case "icu": return "bg-red-100 text-red-700";
      case "emergency": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case "wifi": return <Wifi className="w-4 h-4" />;
      case "tv": return <Tv className="w-4 h-4" />;
      case "private_bathroom": return <Bath className="w-4 h-4" />;
      case "ac": return <Wind className="w-4 h-4" />;
      case "heating": return <Thermometer className="w-4 h-4" />;
      default: return <Bed className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${getTypeColor(room.type)}`}>
                <Bed className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Room {room.number}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(room.status)}`}>
                    {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(room.type)}`}>
                    {room.type.charAt(0).toUpperCase() + room.type.slice(1)} Room
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Location Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Floor</p>
                      <p className="font-semibold text-gray-900">Floor {room.floor}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ward</p>
                      <p className="font-semibold text-gray-900">{room.ward}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Bed className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Room Type</p>
                      <p className="font-semibold text-gray-900 capitalize">{room.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Daily Rate</p>
                      <p className="font-semibold text-gray-900">₦{room.rate.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {room.amenities.map((amenity: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="p-2 bg-white text-blue-600 rounded-lg">
                        {getAmenityIcon(amenity)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {amenity.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-500">Available</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              {room.equipment && room.equipment.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Equipment</h3>
                  <div className="flex flex-wrap gap-2">
                    {room.equipment.map((item: string, index: number) => (
                      <span key={index} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {room.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-gray-700">{room.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Patient Info / Actions */}
            <div className="space-y-6">
              {/* Current Patient (if occupied) */}
              {room.status === "occupied" && room.patient && (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Current Patient</h3>
                      <p className="text-sm text-gray-500">Currently occupying this room</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Patient Name</p>
                      <p className="font-semibold text-gray-900">{room.patient.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Age & Gender</p>
                        <p className="font-semibold text-gray-900">{room.patient.age} years, {room.patient.gender}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Admission Date</p>
                        <p className="font-semibold text-gray-900">{room.patient.admissionDate}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Admitting Doctor</p>
                      <p className="font-semibold text-gray-900">{room.patient.doctor || "Dr. Sarah Johnson"}</p>
                    </div>
                  </div>

                  <button className="w-full mt-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition">
                    View Patient Details
                  </button>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full py-3 bg-white hover:bg-blue-100 text-blue-700 font-medium rounded-lg border border-blue-200 transition">
                    Assign Patient
                  </button>
                  {room.status === "occupied" && (
                    <button className="w-full py-3 bg-white hover:bg-red-100 text-red-700 font-medium rounded-lg border border-red-200 transition">
                      Discharge Patient
                    </button>
                  )}
                  {room.status === "maintenance" && (
                    <button className="w-full py-3 bg-white hover:bg-emerald-100 text-emerald-700 font-medium rounded-lg border border-emerald-200 transition">
                      Mark as Available
                    </button>
                  )}
                  <button className="w-full py-3 bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-lg border border-gray-300 transition">
                    Print Room Details
                  </button>
                </div>
              </div>

              {/* Room History */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Room History</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Last cleaned</p>
                      <p className="text-sm text-gray-500">Today, 8:30 AM</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">Completed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Maintenance check</p>
                      <p className="text-sm text-gray-500">Mar 15, 2024</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">Passed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Equipment audit</p>
                      <p className="text-sm text-gray-500">Mar 1, 2024</p>
                    </div>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Room ID: {room.id} • Last updated: Today
            </div>
            <div className="flex items-center gap-3">
              <button className="px-6 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
                Export Details
              </button>
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}