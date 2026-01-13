"use client";

import { Wallet, FileText, Calendar, Activity, Pill, TrendingUp } from "lucide-react";

export default function PatientSummary() {
  return (
    <div className="space-y-4 p-4">
      
      {/* Simple Stats Grid - Top Section */}
      <div className="grid grid-cols-2 gap-3">
        <SimpleStatCard
          title="Wallet Balance"
          value="₦12,500"
          icon={Wallet}
          color="green"
        />
        <SimpleStatCard
          title="Next Visit"
          value="Tomorrow"
          icon={Calendar}
          color="blue"
        />
      </div>

      {/* Payment History - Simple List */}
      <div className="bg-white rounded-lg  p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Recent Payments</h3>
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            All Paid
          </span>
        </div>
        <div className="space-y-3">
          <PaymentItem
            title="Consultation Fee"
            date="Jan 15, 2024"
            amount="₦5,000"
            status="paid"
          />
          <PaymentItem
            title="Lab Tests"
            date="Jan 10, 2024"
            amount="₦7,500"
            status="paid"
          />
          <PaymentItem
            title="Medication"
            date="Jan 5, 2024"
            amount="₦3,200"
            status="paid"
          />
        </div>
        <button className="w-full mt-3 py-2 text-sm text-blue-600  border-blue-200 rounded-lg hover:bg-blue-50">
          View All Payments
        </button>
      </div>

      {/* Diagnosis History - Simple List */}
      <div className="bg-white rounded-lg  p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Recent Diagnosis</h3>
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            Active
          </span>
        </div>
        <div className="space-y-3">
          <DiagnosisItem
            condition="Upper Respiratory Infection"
            date="Jan 15, 2024"
            doctor="Dr. Musa"
            status="treated"
          />
          <DiagnosisItem
            condition="High Blood Pressure"
            date="Dec 20, 2023"
            doctor="Dr. Fatima"
            status="monitoring"
          />
          <DiagnosisItem
            condition="Seasonal Allergy"
            date="Nov 10, 2023"
            doctor="Dr. Ahmed"
            status="resolved"
          />
        </div>
        <button className="w-full mt-3 py-2 text-sm text-blue-600  border-blue-200 rounded-lg hover:bg-blue-50">
          View Medical History
        </button>
      </div>

      {/* Quick Stats - Bottom Section */}
      <div className="grid grid-cols-2 gap-3">
        <SimpleStatCard
          title="Medications"
          value="3 Active"
          icon={Pill}
          color="purple"
        />
        <SimpleStatCard
          title="Health Score"
          value="92/100"
          icon={TrendingUp}
          color="emerald"
        />
      </div>
    </div>
  );
}

/* -----------------------------
   Reusable Components
------------------------------*/

function SimpleStatCard({ title, value, icon: Icon, color }: any) {
  const colorClasses: any = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="bg-white rounded-lg  p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function PaymentItem({ title, date, amount, status }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div>
        <p className="font-medium text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-500">{date}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900 text-sm">{amount}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          status === 'paid' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {status}
        </span>
      </div>
    </div>
  );
}

function DiagnosisItem({ condition, date, doctor, status }: any) {
  const statusColors: any = {
    treated: "bg-blue-100 text-blue-700",
    monitoring: "bg-amber-100 text-amber-700",
    resolved: "bg-green-100 text-green-700",
  };

  return (
    <div className="py-2 border-b last:border-0">
      <div className="flex items-start justify-between mb-1">
        <p className="font-medium text-gray-900 text-sm">{condition}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[status]}`}>
          {status}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{date}</span>
        <span>By {doctor}</span>
      </div>
    </div>
  );
}