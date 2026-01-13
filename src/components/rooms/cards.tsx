"use client";

import { Bed, User, Building, Clock, Wifi, Tv, Bath, MoreVertical, Edit, Trash2, Eye } from "lucide-react";

interface RoomCardProps {
  room: {
    id: string;
    number: string;
    type: "general" | "private" | "icu" | "emergency" | "pediatric" | "maternity";
    floor: string;
    ward: string;
    status: "available" | "occupied" | "maintenance" | "reserved";
    patient?: {
      name: string;
      age: number;
      gender: string;
      admissionDate: string;
    };
    equipment: string[];
    rate: number;
    amenities: string[];
  };
  onViewDetails: (roomId: string) => void;
  onEdit: (roomId: string) => void;
  onDelete: (roomId: string) => void;
}

export function RoomCard({ room, onViewDetails, onEdit, onDelete }: RoomCardProps) {
  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case "general": return "bg-blue-100 text-blue-700";
      case "private": return "bg-emerald-100 text-emerald-700";
      case "icu": return "bg-red-100 text-red-700";
      case "emergency": return "bg-orange-100 text-orange-700";
      case "pediatric": return "bg-pink-100 text-pink-700";
      case "maternity": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-emerald-100 text-emerald-700";
      case "occupied": return "bg-red-100 text-red-700";
      case "maintenance": return "bg-amber-100 text-amber-700";
      case "reserved": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "general": return "General Ward";
      case "private": return "Private Room";
      case "icu": return "ICU";
      case "emergency": return "Emergency";
      case "pediatric": return "Pediatric";
      case "maternity": return "Maternity";
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available": return "Available";
      case "occupied": return "Occupied";
      case "maintenance": return "Maintenance";
      case "reserved": return "Reserved";
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${getRoomTypeColor(room.type)}`}>
            <Bed className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900">Room {room.number}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(room.status)}`}>
                {getStatusLabel(room.status)}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getRoomTypeColor(room.type)}`}>
                {getTypeLabel(room.type)}
              </span>
              <span className="text-sm text-gray-500">Floor {room.floor} • {room.ward}</span>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <MoreVertical className="w-5 h-5" />
          </button>
          <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-10 hidden hover:block">
            <button
              onClick={() => onViewDetails(room.id)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
            <button
              onClick={() => onEdit(room.id)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit className="w-4 h-4" />
              Edit Room
            </button>
            <button
              onClick={() => onDelete(room.id)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Patient Info (if occupied) */}
      {room.status === "occupied" && room.patient && (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{room.patient.name}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                <span>{room.patient.age} years • {room.patient.gender}</span>
                <span>•</span>
                <span>Admitted: {room.patient.admissionDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Amenities */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Amenities:</p>
        <div className="flex flex-wrap gap-2">
          {room.amenities.map((amenity, index) => (
            <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
              {amenity === "wifi" && <Wifi className="w-3 h-3" />}
              {amenity === "tv" && <Tv className="w-3 h-3" />}
              {amenity === "private_bathroom" && <Bath className="w-3 h-3" />}
              <span>{amenity.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment */}
      {room.equipment.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Equipment:</p>
          <div className="flex flex-wrap gap-2">
            {room.equipment.map((item, index) => (
              <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <Building className="w-4 h-4 inline mr-1" />
          Rate: ₦{room.rate.toLocaleString()}/day
        </div>
        <button
          onClick={() => onViewDetails(room.id)}
          className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
        >
          View Details
        </button>
      </div>
    </div>
  );
}