"use client";

import { Building, Users, Stethoscope, Phone, Mail, MapPin, MoreVertical, Edit, Trash2, Eye, TrendingUp } from "lucide-react";

interface DepartmentCardProps {
  department: {
    id: string;
    name: string;
    code: string;
    head: string;
    totalStaff: number;
    totalBeds: number;
    occupiedBeds: number;
    location: string;
    contact: string;
    email: string;
    status: "active" | "inactive" | "maintenance";
    specialties: string[];
    consultationFee: number;
  };
  onViewDetails: (deptId: string) => void;
  onEdit: (deptId: string) => void;
  onDelete: (deptId: string) => void;
}

export function DepartmentCard({ department, onViewDetails, onEdit, onDelete }: DepartmentCardProps) {
  const occupancyRate = Math.round((department.occupiedBeds / department.totalBeds) * 100);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-100 text-emerald-700";
      case "inactive": return "bg-gray-100 text-gray-700";
      case "maintenance": return "bg-amber-100 text-amber-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getSpecialtyColor = (specialty: string) => {
    const colors = [
      "bg-blue-50 text-blue-700",
      "bg-emerald-50 text-emerald-700",
      "bg-purple-50 text-purple-700",
      "bg-amber-50 text-amber-700",
      "bg-pink-50 text-pink-700",
      "bg-indigo-50 text-indigo-700"
    ];
    const index = specialty.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900">{department.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(department.status)}`}>
                {department.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">Code: {department.code}</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm text-gray-500">Head: {department.head}</span>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <MoreVertical className="w-5 h-5" />
          </button>
          <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-10 hidden hover:block">
            <button
              onClick={() => onViewDetails(department.id)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
            <button
              onClick={() => onEdit(department.id)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit className="w-4 h-4" />
              Edit Department
            </button>
            <button
              onClick={() => onDelete(department.id)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-500">Staff</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{department.totalStaff}</p>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-500">Beds</span>
            </div>
            {occupancyRate > 80 && (
              <TrendingUp className="w-4 h-4 text-red-500" />
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {department.occupiedBeds}/{department.totalBeds}
          </p>
          <div className="mt-1">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full ${occupancyRate > 80 ? 'bg-red-500' : occupancyRate > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(occupancyRate, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{occupancyRate}% occupied</p>
          </div>
        </div>
      </div>

      {/* Specialties */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Specialties:</p>
        <div className="flex flex-wrap gap-2">
          {department.specialties.slice(0, 3).map((specialty, index) => (
            <span key={index} className={`px-3 py-1 rounded-lg text-xs font-medium ${getSpecialtyColor(specialty)}`}>
              {specialty}
            </span>
          ))}
          {department.specialties.length > 3 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
              +{department.specialties.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{department.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="w-4 h-4" />
          <span>{department.contact}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          <span className="truncate">{department.email}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-900 font-medium">
          Consultation: ₦{department.consultationFee.toLocaleString()}
        </div>
        <button
          onClick={() => onViewDetails(department.id)}
          className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
        >
          View Department
        </button>
      </div>
    </div>
  );
}