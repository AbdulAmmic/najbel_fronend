"use client";

import { ArrowLeft, User, Calendar, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ConsultationHeaderProps {
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientId: string;
  appointmentTime: string;
}

export function ConsultationHeader({
  patientName,
  patientAge,
  patientGender,
  patientId,
  appointmentTime
}: ConsultationHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-8">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Patients
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
              {patientName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{patientName}</h1>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                  Consultation
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{patientAge} years • {patientGender}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{appointmentTime}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Patient ID</p>
              <p className="font-semibold text-gray-900">{patientId}</p>
            </div>
            <div className="h-10 w-px bg-gray-200"></div>
            <div>
              <p className="text-sm text-gray-500">Consulting Doctor</p>
              <p className="font-semibold text-gray-900">Dr. Sarah Johnson</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-600">Allergies: Penicillin, Sulfa drugs</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-gray-600">Conditions: Hypertension, Type 2 Diabetes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}