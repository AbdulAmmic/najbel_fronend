"use client";

import { UserPlus, User, Building, FileText, Send } from "lucide-react";
import { useState } from "react";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  department: string;
  hospital: string;
  availability: "available" | "busy" | "away";
}

export function ReferralComponent() {
  const [isReferring, setIsReferring] = useState(false);
  const [referralReason, setReferralReason] = useState("");
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>("");
  const [urgency, setUrgency] = useState<"routine" | "urgent" | "emergency">("routine");

  const specialists: Specialist[] = [
    { id: "1", name: "Dr. Michael Chen", specialty: "Cardiology", department: "Cardiac Care", hospital: "Main Hospital", availability: "available" },
    { id: "2", name: "Dr. Aisha Musa", specialty: "Neurology", department: "Neurology", hospital: "Main Hospital", availability: "available" },
    { id: "3", name: "Dr. James Wilson", specialty: "Orthopedics", department: "Orthopedics", hospital: "North Wing", availability: "busy" },
    { id: "4", name: "Dr. Fatima Ahmed", specialty: "Endocrinology", department: "Endocrinology", hospital: "Main Hospital", availability: "available" },
    { id: "5", name: "Dr. David Brown", specialty: "Gastroenterology", department: "GI Clinic", hospital: "South Wing", availability: "away" },
    { id: "6", name: "Dr. Sarah Johnson", specialty: "Internal Medicine", department: "General Medicine", hospital: "Main Hospital", availability: "available" },
  ];

  const handleReferral = () => {
    if (referralReason && selectedSpecialist) {
      // Handle referral logic
      console.log("Referring patient:", { referralReason, selectedSpecialist, urgency });
      setIsReferring(false);
      setReferralReason("");
      setSelectedSpecialist("");
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "available": return "bg-emerald-100 text-emerald-700";
      case "busy": return "bg-amber-100 text-amber-700";
      case "away": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "routine": return "bg-blue-100 text-blue-700";
      case "urgent": return "bg-orange-100 text-orange-700";
      case "emergency": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Referral</h2>
          <p className="text-sm text-gray-500 mt-1">Refer patient to other specialists</p>
        </div>
        <button
          onClick={() => setIsReferring(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition"
        >
          <UserPlus className="w-5 h-5" />
          New Referral
        </button>
      </div>

      {isReferring && (
        <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Create New Referral</h3>
          </div>

          <div className="space-y-6">
            {/* Urgency Level */}
            <div>
              <label className="text-sm font-medium text-gray-900 mb-3 block">Referral Urgency</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setUrgency("routine")}
                  className={`p-4 rounded-xl border transition ${
                    urgency === "routine"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${urgency === "routine" ? "bg-blue-500" : "bg-gray-300"}`}></div>
                    <span className={`font-medium ${urgency === "routine" ? "text-blue-700" : "text-gray-600"}`}>
                      Routine
                    </span>
                    <span className="text-xs text-gray-500">1-2 weeks</span>
                  </div>
                </button>
                <button
                  onClick={() => setUrgency("urgent")}
                  className={`p-4 rounded-xl border transition ${
                    urgency === "urgent"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${urgency === "urgent" ? "bg-orange-500" : "bg-gray-300"}`}></div>
                    <span className={`font-medium ${urgency === "urgent" ? "text-orange-700" : "text-gray-600"}`}>
                      Urgent
                    </span>
                    <span className="text-xs text-gray-500">24-48 hours</span>
                  </div>
                </button>
                <button
                  onClick={() => setUrgency("emergency")}
                  className={`p-4 rounded-xl border transition ${
                    urgency === "emergency"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${urgency === "emergency" ? "bg-red-500" : "bg-gray-300"}`}></div>
                    <span className={`font-medium ${urgency === "emergency" ? "text-red-700" : "text-gray-600"}`}>
                      Emergency
                    </span>
                    <span className="text-xs text-gray-500">Immediate</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Specialist Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-900">Select Specialist</label>
                <span className="text-sm text-gray-500">
                  {specialists.filter(s => s.availability === "available").length} available
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {specialists.map((specialist) => (
                  <button
                    key={specialist.id}
                    onClick={() => setSelectedSpecialist(specialist.id)}
                    disabled={specialist.availability !== "available"}
                    className={`p-4 rounded-xl border transition text-left ${
                      selectedSpecialist === specialist.id
                        ? "border-blue-500 bg-blue-50"
                        : specialist.availability === "available"
                        ? "border-gray-300 hover:border-gray-400"
                        : "border-gray-200 bg-gray-50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">{specialist.name}</p>
                          <span className={`text-xs px-2 py-1 rounded ${getAvailabilityColor(specialist.availability)}`}>
                            {specialist.availability}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-medium text-gray-700">{specialist.specialty}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">{specialist.department}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                          <Building className="w-3 h-3" />
                          <span>{specialist.hospital}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Referral Reason */}
            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">Reason for Referral</label>
              <textarea
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="Explain why you're referring this patient..."
                value={referralReason}
                onChange={(e) => setReferralReason(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => setIsReferring(false)}
                className="px-6 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReferral}
                disabled={!referralReason || !selectedSpecialist}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Send Referral
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Previous Referrals */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">Previous Referrals</h3>
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Dr. Michael Chen</p>
                  <p className="text-sm text-gray-500">Cardiology • Feb 15, 2024</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                Completed
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Referred for cardiac evaluation due to elevated blood pressure readings.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <FileText className="w-4 h-4 inline mr-1" />
            Referral notes are automatically added to patient chart
          </div>
          <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
            View All Referrals
          </button>
        </div>
      </div>
    </div>
  );
}