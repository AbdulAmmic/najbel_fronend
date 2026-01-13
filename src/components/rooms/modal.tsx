"use client";

import { X, Plus, Bed, Building, Wifi, Tv, Bath, Thermometer, Wind } from "lucide-react";
import { useState } from "react";

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRoom: (room: any) => void;
  editingRoom?: any;
}

export function AddRoomModal({ isOpen, onClose, onAddRoom, editingRoom }: AddRoomModalProps) {
  const [roomData, setRoomData] = useState({
    number: editingRoom?.number || "",
    type: editingRoom?.type || "general",
    floor: editingRoom?.floor || "1",
    ward: editingRoom?.ward || "A",
    status: editingRoom?.status || "available",
    rate: editingRoom?.rate || 5000,
    amenities: editingRoom?.amenities || [],
    equipment: editingRoom?.equipment || [],
    notes: editingRoom?.notes || ""
  });

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(roomData.amenities);
  const [equipmentInput, setEquipmentInput] = useState("");
  const [step, setStep] = useState(1);

  const amenitiesList = [
    { id: "wifi", label: "WiFi", icon: <Wifi className="w-4 h-4" /> },
    { id: "tv", label: "TV", icon: <Tv className="w-4 h-4" /> },
    { id: "private_bathroom", label: "Private Bathroom", icon: <Bath className="w-4 h-4" /> },
    { id: "ac", label: "Air Conditioning", icon: <Wind className="w-4 h-4" /> },
    { id: "heating", label: "Heating", icon: <Thermometer className="w-4 h-4" /> },
    { id: "minibar", label: "Minibar", icon: <Bed className="w-4 h-4" /> }
  ];

  const handleAmenityToggle = (amenityId: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityId)
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const addEquipment = () => {
    if (equipmentInput.trim()) {
      setRoomData(prev => ({
        ...prev,
        equipment: [...prev.equipment, equipmentInput.trim()]
      }));
      setEquipmentInput("");
    }
  };

  const removeEquipment = (index: number) => {
    setRoomData(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_:any, i:any) => i !== index)
    }));
  };

  const handleSubmit = () => {
    const room = {
      ...roomData,
      amenities: selectedAmenities,
      id: editingRoom?.id || `room-${Date.now()}`
    };
    onAddRoom(room);
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
                <Bed className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingRoom ? 'Edit Room' : 'Add New Room'}
                </h2>
                <p className="text-gray-600">
                  {editingRoom ? `Room ${editingRoom.number}` : 'Configure new room details'}
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
                    {stepNum === 1 ? 'Basic Info' : stepNum === 2 ? 'Amenities' : 'Review'}
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
                  <label className="text-sm font-medium text-gray-900 mb-2 block">Room Number</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g., 101"
                    value={roomData.number}
                    onChange={(e) => setRoomData({...roomData, number: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-2 block">Room Type</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={roomData.type}
                    onChange={(e) => setRoomData({...roomData, type: e.target.value})}
                  >
                    <option value="general">General Ward</option>
                    <option value="private">Private Room</option>
                    <option value="icu">ICU</option>
                    <option value="emergency">Emergency</option>
                    <option value="pediatric">Pediatric</option>
                    <option value="maternity">Maternity</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-2 block">Floor</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={roomData.floor}
                    onChange={(e) => setRoomData({...roomData, floor: e.target.value})}
                  >
                    {[1, 2, 3, 4, 5].map(floor => (
                      <option key={floor} value={floor.toString()}>Floor {floor}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-2 block">Ward</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={roomData.ward}
                    onChange={(e) => setRoomData({...roomData, ward: e.target.value})}
                  >
                    <option value="A">Ward A</option>
                    <option value="B">Ward B</option>
                    <option value="C">Ward C</option>
                    <option value="ICU">ICU</option>
                    <option value="ER">Emergency Room</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Maternity">Maternity</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-2 block">Status</label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={roomData.status}
                    onChange={(e) => setRoomData({...roomData, status: e.target.value})}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 mb-2 block">Daily Rate (₦)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="5000"
                    value={roomData.rate}
                    onChange={(e) => setRoomData({...roomData, rate: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">Additional Notes</label>
                <textarea
                  className="w-full h-24 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder="Any special notes about this room..."
                  value={roomData.notes}
                  onChange={(e) => setRoomData({...roomData, notes: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Amenities & Equipment</h3>
              
              <div>
                <label className="text-sm font-medium text-gray-900 mb-4 block">Select Amenities</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenitiesList.map((amenity) => (
                    <button
                      key={amenity.id}
                      onClick={() => handleAmenityToggle(amenity.id)}
                      className={`p-4 rounded-xl border transition ${
                        selectedAmenities.includes(amenity.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`p-2 rounded-lg ${
                          selectedAmenities.includes(amenity.id)
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {amenity.icon}
                        </div>
                        <span className={`font-medium ${
                          selectedAmenities.includes(amenity.id)
                            ? 'text-blue-700'
                            : 'text-gray-600'
                        }`}>
                          {amenity.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">Medical Equipment</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g., Oxygen Tank, IV Stand"
                    value={equipmentInput}
                    onChange={(e) => setEquipmentInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addEquipment()}
                  />
                  <button
                    onClick={addEquipment}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {roomData.equipment.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {roomData.equipment.map((item:any, index:any) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg">
                        <span>{item}</span>
                        <button
                          onClick={() => removeEquipment(index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Review & Confirm</h3>
              
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Room Number</p>
                    <p className="font-semibold text-gray-900">{roomData.number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Type</p>
                    <p className="font-semibold text-gray-900 capitalize">{roomData.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Floor & Ward</p>
                    <p className="font-semibold text-gray-900">Floor {roomData.floor}, Ward {roomData.ward}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <p className="font-semibold text-gray-900 capitalize">{roomData.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Daily Rate</p>
                    <p className="font-semibold text-gray-900">₦{roomData.rate.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Amenities</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedAmenities.map(amenity => (
                        <span key={amenity} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {roomData.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Notes</p>
                    <p className="text-gray-700">{roomData.notes}</p>
                  </div>
                )}
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
                  {editingRoom ? 'Update Room' : 'Add Room'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}