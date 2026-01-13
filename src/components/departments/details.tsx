"use client";

import { 
  X, 
  Building, 
  User, 
  Users, 
  Bed, 
  MapPin, 
  Phone, 
  Mail, 
  DollarSign, 
  Clock,
  TrendingUp,
  Calendar,
  FileText,
  Edit,
  Stethoscope
} from "lucide-react";

interface DepartmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: any;
  onEdit: () => void;
}

export function DepartmentDetailsModal({ isOpen, onClose, department, onEdit }: DepartmentDetailsModalProps) {
  if (!isOpen || !department) return null;

  const occupancyRate = Math.round((department.occupiedBeds / department.totalBeds) * 100);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-100 text-emerald-700";
      case "inactive": return "bg-gray-100 text-gray-700";
      case "maintenance": return "bg-amber-100 text-amber-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                <Building className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{department.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-500">Code: {department.code}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(department.status)}`}>
                    {department.status.toUpperCase()}
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
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Key Stats */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-500">Total Staff</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{department.totalStaff}</p>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Bed className="w-5 h-5 text-gray-600" />
                        <span className="text-sm text-gray-500">Beds</span>
                      </div>
                      {occupancyRate > 80 && (
                        <TrendingUp className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {department.occupiedBeds}/{department.totalBeds}
                    </p>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${occupancyRate > 80 ? 'bg-red-500' : occupancyRate > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{occupancyRate}% occupancy</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-500">Consultation Fee</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₦{department.consultationFee.toLocaleString()}</p>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-500">Avg. Stay</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">4.2 days</p>
                  </div>
                </div>
              </div>

              {/* Contact & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Department Head</p>
                        <p className="font-semibold text-gray-900">{department.head}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Contact Number</p>
                        <p className="font-semibold text-gray-900">{department.contact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email Address</p>
                        <p className="font-semibold text-gray-900">{department.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Building & Floor</p>
                        <p className="font-semibold text-gray-900">{department.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ward Areas</p>
                        <p className="font-semibold text-gray-900">Ward A, B, and C</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Operating Hours</p>
                        <p className="font-semibold text-gray-900">24/7 Emergency, 8AM-8PM OPD</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Specialties & Services</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {department.specialties.map((specialty: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{specialty}</p>
                        <p className="text-sm text-gray-500">Available</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              {department.description && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Description</h3>
                  <p className="text-gray-700">{department.description}</p>
                </div>
              )}
            </div>

            {/* Right Column - Staff & Actions */}
            <div className="space-y-8">
              {/* Staff Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Summary</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Doctors</span>
                      <span className="font-semibold text-gray-900">{Math.floor(department.totalStaff * 0.4)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="w-2/5 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Nurses</span>
                      <span className="font-semibold text-gray-900">{Math.floor(department.totalStaff * 0.35)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="w-1/3 h-2 bg-emerald-500 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Technicians</span>
                      <span className="font-semibold text-gray-900">{Math.floor(department.totalStaff * 0.15)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="w-1/6 h-2 bg-amber-500 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Administrative</span>
                      <span className="font-semibold text-gray-900">{Math.floor(department.totalStaff * 0.1)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="w-1/10 h-2 bg-purple-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full py-3 bg-white hover:bg-blue-100 text-blue-700 font-medium rounded-lg border border-blue-200 transition">
                    View Staff List
                  </button>
                  <button className="w-full py-3 bg-white hover:bg-blue-100 text-blue-700 font-medium rounded-lg border border-blue-200 transition">
                    Manage Schedules
                  </button>
                  <button className="w-full py-3 bg-white hover:bg-emerald-100 text-emerald-700 font-medium rounded-lg border border-emerald-200 transition">
                    Add New Staff
                  </button>
                  <button className="w-full py-3 bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-lg border border-gray-300 transition">
                    Generate Report
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">New staff added</p>
                      <p className="text-sm text-gray-500">Dr. Michael Chen joined</p>
                    </div>
                    <span className="text-xs text-gray-500">2 days ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Equipment upgrade</p>
                      <p className="text-sm text-gray-500">New MRI installed</p>
                    </div>
                    <span className="text-xs text-gray-500">1 week ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Staff training</p>
                      <p className="text-sm text-gray-500">Completed emergency protocols</p>
                    </div>
                    <span className="text-xs text-gray-500">2 weeks ago</span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Patient Satisfaction</span>
                    <span className="font-semibold text-emerald-600">94%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Treatment Success Rate</span>
                    <span className="font-semibold text-emerald-600">89%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Emergency Response Time</span>
                    <span className="font-semibold text-blue-600">4.2 min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Monthly Growth</span>
                    <span className="font-semibold text-emerald-600">+12%</span>
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
              <FileText className="w-4 h-4 inline mr-1" />
              Department ID: {department.id} • Created: Jan 15, 2020
            </div>
            <div className="flex items-center gap-3">
              <button className="px-6 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
                Export Report
              </button>
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
                Manage Department
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}