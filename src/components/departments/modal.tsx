"use client";

import { X, Plus, Building, User, Users, Bed, MapPin, Phone, Mail, DollarSign, AlertCircle } from "lucide-react";
import { useState } from "react";

interface AddDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDepartment: (department: any) => void;
  editingDepartment?: any;
}

export function AddDepartmentModal({ isOpen, onClose, onAddDepartment, editingDepartment }: AddDepartmentModalProps) {
  const [departmentData, setDepartmentData] = useState({
    name: editingDepartment?.name || "",
    code: editingDepartment?.code || "",
    head: editingDepartment?.head || "",
    totalStaff: editingDepartment?.totalStaff || 0,
    totalBeds: editingDepartment?.totalBeds || 0,
    occupiedBeds: editingDepartment?.occupiedBeds || 0,
    location: editingDepartment?.location || "Main Building",
    contact: editingDepartment?.contact || "",
    email: editingDepartment?.email || "",
    status: editingDepartment?.status || "active",
    specialties: editingDepartment?.specialties || [],
    consultationFee: editingDepartment?.consultationFee || 5000,
    description: editingDepartment?.description || ""
  });

  const [specialtyInput, setSpecialtyInput] = useState("");
  const [step, setStep] = useState(1);

  const commonSpecialties = [
    "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Gynecology",
    "Dermatology", "Psychiatry", "Radiology", "Pathology", "Emergency Medicine",
    "Internal Medicine", "Surgery", "Ophthalmology", "ENT", "Dental"
  ];

  const addSpecialty = () => {
    if (specialtyInput.trim() && !departmentData.specialties.includes(specialtyInput.trim())) {
      setDepartmentData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialtyInput.trim()]
      }));
      setSpecialtyInput("");
    }
  };

  const removeSpecialty = (index: number) => {
    setDepartmentData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_:any, i:any) => i !== index)
    }));
  };

  const handleSubmit = () => {
    const department = {
      ...departmentData,
      id: editingDepartment?.id || `dept-${Date.now()}`
    };
    onAddDepartment(department);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingDepartment ? 'Edit Department' : 'Add New Department'}
                </h2>
                <p className="text-gray-600">
                  {editingDepartment ? editingDepartment.name : 'Configure new department details'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNum}
                  </div>
                  <span className={`text-sm font-medium ${
                    step >= stepNum ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {stepNum === 1 ? 'Basic Info' : stepNum === 2 ? 'Specialties' : 'Review'}
                  </span>
                  {stepNum < 3 && (
                    <div className={`w-12 h-0.5 ${step > stepNum ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-2 block">Department Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g., Cardiology"
                    value={departmentData.name}
                    onChange={(e) => setDepartmentData({...departmentData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-2 block">Department Code</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g., CARD"
                    value={departmentData.code}
                    onChange={(e) => setDepartmentData({...departmentData, code: e.target.value.toUpperCase()})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-2 block">Department Head</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g., Dr. Sarah Johnson"
                    value={departmentData.head}
                    onChange={(e) => setDepartmentData({...departmentData, head: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-2 block">Location</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={departmentData.location}
                    onChange={(e) => setDepartmentData({...departmentData, location: e.target.value})}
                  >
                    <option value="Main Building">Main Building</option>
                    <option value="North Wing">North Wing</option>
                    <option value="South Wing">South Wing</option>
                    <option value="East Wing">East Wing</option>
                    <option value="West Wing">West Wing</option>
                    <option value="Annex">Annex</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-2 block">Total Staff</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., 25"
                      value={departmentData.totalStaff}
                      onChange={(e) => setDepartmentData({...departmentData, totalStaff: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-2 block">Total Beds</label>
                  <div className="relative">
                    <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., 50"
                      value={departmentData.totalBeds}
                      onChange={(e) => setDepartmentData({...departmentData, totalBeds: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-2 block">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., +234 801 234 5678"
                      value={departmentData.contact}
                      onChange={(e) => setDepartmentData({...departmentData, contact: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-2 block">Consultation Fee</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="number"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="e.g., 5000"
                      value={departmentData.consultationFee}
                      onChange={(e) => setDepartmentData({...departmentData, consultationFee: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g., cardiology@hospital.com"
                    value={departmentData.email}
                    onChange={(e) => setDepartmentData({...departmentData, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">Description</label>
                <textarea
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Brief description of the department..."
                  value={departmentData.description}
                  onChange={(e) => setDepartmentData({...departmentData, description: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Specialties & Services</h3>
              
              <div>
                <label className="text-sm font-medium text-gray-900 mb-4 block">Add Specialties</label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Type a specialty and press Enter"
                    value={specialtyInput}
                    onChange={(e) => setSpecialtyInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
                  />
                  <button
                    onClick={addSpecialty}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Common Specialties */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-3">Common Specialties:</p>
                  <div className="flex flex-wrap gap-2">
                    {commonSpecialties.map((specialty) => (
                      <button
                        key={specialty}
                        onClick={() => {
                          if (!departmentData.specialties.includes(specialty)) {
                            setDepartmentData(prev => ({
                              ...prev,
                              specialties: [...prev.specialties, specialty]
                            }));
                          }
                        }}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
                      >
                        {specialty}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Specialties */}
                {departmentData.specialties.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-3">Selected Specialties ({departmentData.specialties.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {departmentData.specialties.map((specialty:any, index:any) => (
                        <div key={index} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg">
                          <span>{specialty}</span>
                          <button
                            onClick={() => removeSpecialty(index)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">Status</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={departmentData.status}
                  onChange={(e) => setDepartmentData({...departmentData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Review & Confirm</h3>
              
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Department Name</p>
                    <p className="font-semibold text-gray-900">{departmentData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Department Code</p>
                    <p className="font-semibold text-gray-900">{departmentData.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Department Head</p>
                    <p className="font-semibold text-gray-900">{departmentData.head}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <p className="font-semibold text-gray-900">{departmentData.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Staff & Beds</p>
                    <p className="font-semibold text-gray-900">
                      {departmentData.totalStaff} staff • {departmentData.totalBeds} beds
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Consultation Fee</p>
                    <p className="font-semibold text-gray-900">₦{departmentData.consultationFee.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Specialties</p>
                    <div className="flex flex-wrap gap-2">
                      {departmentData.specialties.map((specialty:any, index:any) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                  {departmentData.description && (
                    <div className="col-span-2 mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500 mb-1">Description</p>
                      <p className="text-gray-700">{departmentData.description}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-700">Important Note</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Department information will be visible to all staff members. 
                      Please verify all details before submission.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              className="px-6 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              {step > 1 ? 'Back' : 'Cancel'}
            </button>
            
            <div className="flex items-center gap-4">
              {step < 3 && (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  Continue
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition"
                >
                  {editingDepartment ? 'Update Department' : 'Create Department'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}