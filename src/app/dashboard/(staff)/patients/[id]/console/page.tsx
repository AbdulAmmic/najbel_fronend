"use client";

import { useState } from "react";
import { ConsultationHeader } from "@/components/patient/consultationHeader";
import { VitalSignsInput } from "@/components/patient/vitalInputs";
import { PrescriptionComponent } from "@/components/patient/prescription";
import { LabRequestComponent } from "@/components/patient/labrequests";
import { ClinicalNotesComponent } from "@/components/patient/clinicalNotes";
import { AdmissionComponent } from "@/components/patient/admissionPage";
import { ReferralComponent } from "@/components/patient/referral";
import { AllergiesComponent } from "@/components/patient/allergies";

export default function ConsultationPage() {


  const patient = {
    name: "Aliyu Bello",
    age: 42,
    gender: "Male",
    patientId: "PT-0001",
    appointmentTime: "Today, 10:30 AM"
  };

  const handleVitalsUpdate = (vitals: any[]) => {
    console.log("Updated vitals:", vitals);
    // You can send this to your backend or update state
  };

  return (
    <div className="max-w-[1800px] mx-auto">
      {/* Consultation Header */}
      <ConsultationHeader
        patientName={patient.name}
        patientAge={patient.age}
        patientGender={patient.gender}
        patientId={patient.patientId}
        appointmentTime={patient.appointmentTime}
      />

      {/* Main Grid Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Vital Signs & Notes */}
        <div className="lg:col-span-2 space-y-8">
          {/* Vital Signs */}
          <VitalSignsInput onVitalsUpdate={handleVitalsUpdate} />

          {/* Clinical Notes */}
          <ClinicalNotesComponent />

          {/* Prescriptions */}
          <PrescriptionComponent />

          {/* Lab Requests */}
          <LabRequestComponent />
        </div>

        {/* Right Column - Actions & Information */}
        <div className="space-y-8">
          {/* Allergies (Critical - Top) */}
          <AllergiesComponent />

          {/* Admission */}
          <AdmissionComponent />

          {/* Referral */}
          <ReferralComponent />

          {/* Consultation Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Consultation Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">45 minutes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">In Progress</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Next Steps</span>
                <span className="font-medium">Follow-up in 2 weeks</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition">
                Complete Consultation
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                This will save all changes and close the consultation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-500">
          Consultation ID: CON-{Date.now().toString().slice(-6)} • Auto-save enabled
        </div>
        <div className="flex items-center gap-4">
          <button className="px-6 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
            Save Draft
          </button>
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
            Print Summary
          </button>
        </div>
      </div>
    </div>
  );
}