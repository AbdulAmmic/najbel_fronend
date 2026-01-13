"use client";

import { useState } from "react";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Activity,
  Heart,
  Pill,
  FileText,
  Edit,
  Printer,
  Download,
  MoreVertical,
  ChevronRight,
  Clock,
  Bell,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Weight,
  Thermometer,
  Stethoscope,
  Users,
  PlusCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SinglePatientPage() {
  const router = useRouter();

  // Patient Data
  const patient = {
    id: 1,
    name: "Aliyu Bello",
    age: 42,
    gender: "Male",
    phone: "+234 801 234 5678",
    email: "aliyu.bello@email.com",
    address: "Wuse 2, Abuja, Nigeria",
    emergencyContact: "+234 802 345 6789",
    bloodGroup: "O+",
    height: "178 cm",
    weight: "82 kg",
    bmi: "25.9",
    lastCheckup: "2024-03-15",
    nextAppointment: "2024-04-10",
    primaryDoctor: "Dr. Sarah Johnson",
    status: "Active",
    allergies: ["Penicillin", "Sulfa drugs"],
    conditions: ["Hypertension", "Type 2 Diabetes"],
    medications: ["Metformin 500mg", "Lisinopril 10mg"],
    avatarColor: "bg-blue-100 text-blue-600",
  };

  // Medical History
  const medicalHistory = [
    {
      id: 1,
      date: "2024-03-15",
      type: "Consultation",
      doctor: "Dr. Sarah Johnson",
      diagnosis: "Hypertension checkup",
      notes: "Blood pressure controlled with medication",
      status: "completed"
    },
    {
      id: 2,
      date: "2024-02-28",
      type: "Lab Test",
      doctor: "Dr. Michael Chen",
      diagnosis: "Blood glucose test",
      notes: "Fasting blood sugar: 120 mg/dL",
      status: "completed"
    },
    {
      id: 3,
      date: "2024-02-10",
      type: "Follow-up",
      doctor: "Dr. Sarah Johnson",
      diagnosis: "Diabetes management",
      notes: "Adjusting medication dosage",
      status: "completed"
    },
    {
      id: 4,
      date: "2024-01-22",
      type: "Emergency",
      doctor: "Dr. Aisha Musa",
      diagnosis: "High blood pressure episode",
      notes: "Required immediate attention, stabilized",
      status: "completed"
    },
  ];

  // Upcoming Appointments
  const upcomingAppointments = [
    {
      id: 1,
      date: "2024-04-10",
      time: "2:00 PM",
      type: "General Checkup",
      doctor: "Dr. Sarah Johnson",
      department: "Cardiology",
      status: "confirmed"
    },
    {
      id: 2,
      date: "2024-05-05",
      time: "10:30 AM",
      type: "Lab Test",
      doctor: "Dr. Michael Chen",
      department: "Pathology",
      status: "pending"
    },
    {
      id: 3,
      date: "2024-06-15",
      time: "11:15 AM",
      type: "Follow-up",
      doctor: "Dr. Sarah Johnson",
      department: "Cardiology",
      status: "confirmed"
    },
  ];

  // Vital Signs
  const vitalSigns = [
    { label: "Blood Pressure", value: "128/82", unit: "mmHg", status: "normal", trend: "down" },
    { label: "Heart Rate", value: "72", unit: "bpm", status: "normal", trend: "stable" },
    { label: "Temperature", value: "36.8", unit: "°C", status: "normal", trend: "stable" },
    { label: "Blood Glucose", value: "120", unit: "mg/dL", status: "elevated", trend: "down" },
    { label: "SpO2", value: "98", unit: "%", status: "normal", trend: "stable" },
    { label: "Respiratory Rate", value: "16", unit: "/min", status: "normal", trend: "stable" },
  ];

  // Recent Lab Results
  const labResults = [
    { test: "Complete Blood Count", date: "2024-03-15", result: "Normal", status: "normal" },
    { test: "Lipid Profile", date: "2024-03-15", result: "Borderline", status: "warning" },
    { test: "Liver Function Test", date: "2024-02-28", result: "Normal", status: "normal" },
    { test: "HbA1c", date: "2024-02-28", result: "6.8%", status: "elevated" },
  ];

  // Quick Actions
  const quickActions = [
    {
      label: "New Visit",
      icon: <PlusCircle className="w-5 h-5" />,
      color: "bg-blue-50 hover:bg-blue-100 text-blue-600",
      action: () => console.log("New Visit")
    },
    {
      label: "Prescription",
      icon: <Pill className="w-5 h-5" />,
      color: "bg-emerald-50 hover:bg-emerald-100 text-emerald-600",
      action: () => console.log("New Prescription")
    },
    {
      label: "Lab Test",
      icon: <Activity className="w-5 h-5" />,
      color: "bg-purple-50 hover:bg-purple-100 text-purple-600",
      action: () => console.log("Order Lab Test")
    },
    {
      label: "Message",
      icon: <MessageSquare className="w-5 h-5" />,
      color: "bg-amber-50 hover:bg-amber-100 text-amber-600",
      action: () => console.log("Send Message")
    },
    {
      label: "Appointment",
      icon: <Calendar className="w-5 h-5" />,
      color: "bg-pink-50 hover:bg-pink-100 text-pink-600",
      action: () => console.log("Schedule Appointment")
    },
    {
      label: "Referral",
      icon: <Users className="w-5 h-5" />,
      color: "bg-indigo-50 hover:bg-indigo-100 text-indigo-600",
      action: () => console.log("Create Referral")
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "confirmed":
      case "normal":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "elevated":
      case "warning":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "emergency":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "down":
        return <TrendingUp className="w-4 h-4 rotate-180 text-emerald-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-[1800px] mx-auto">
      {/* Header with Back Button */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Patients
        </button>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-6">
            <div className={`h-24 w-24 rounded-2xl ${patient.avatarColor} flex items-center justify-center text-3xl font-bold`}>
              {patient.name.split(' ').map(n => n[0]).join('')}
            </div>

            <div>
              <div className="flex items-center gap-4 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(patient.status)}`}>
                  {patient.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{patient.age} years • {patient.gender}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  <span>Blood Group: {patient.bloodGroup}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Weight className="w-4 h-4" />
                  <span>BMI: {patient.bmi}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm font-medium text-gray-900">Primary Doctor:</span>
                <span className="text-sm text-blue-600">{patient.primaryDoctor}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition">
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition">
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
            <button className="p-3 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS AT THE TOP */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Quick Actions</h3>
          <span className="text-sm text-gray-500">Common tasks for this patient</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border border-blue-100 transition-all duration-200 hover:scale-[1.02] hover:shadow-sm ${action.color}`}
            >
              <div className="p-2 bg-white rounded-lg shadow-sm">
                {action.icon}
              </div>
              <span className="text-sm font-medium text-gray-800">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Patient Info & Vital Signs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Contact & Personal Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium text-gray-900">{patient.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium text-gray-900">June 15, 1982 (42 years)</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Emergency Contact</p>
                    <p className="font-medium text-gray-900">{patient.emergencyContact}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="font-medium text-gray-900">{patient.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">{patient.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Stethoscope className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Insurance Provider</p>
                    <p className="font-medium text-gray-900">National Health Insurance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vital Signs */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Vital Signs</h2>
              <span className="text-sm text-gray-500">Last updated: Today, 10:30 AM</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {vitalSigns.map((vital, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${vital.status === "normal" ? "bg-emerald-100 text-emerald-700" :
                        vital.status === "elevated" ? "bg-orange-100 text-orange-700" :
                          "bg-red-100 text-red-700"
                      }`}>
                      {vital.status.charAt(0).toUpperCase() + vital.status.slice(1)}
                    </span>
                    {getTrendIcon(vital.trend)}
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{vital.value}</p>
                  <p className="text-xs text-gray-500">{vital.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{vital.unit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Medical History */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Medical History</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded-lg">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {medicalHistory.map((record) => (
                <div key={record.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-xl transition">
                  <div className={`p-3 rounded-lg ${record.type === "Emergency" ? "bg-red-50 text-red-600" :
                      record.type === "Consultation" ? "bg-blue-50 text-blue-600" :
                        "bg-gray-50 text-gray-600"
                    }`}>
                    {record.type === "Emergency" ? <AlertCircle className="w-5 h-5" /> :
                      record.type === "Lab Test" ? <Activity className="w-5 h-5" /> :
                        <FileText className="w-5 h-5" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{record.diagnosis}</p>
                        <p className="text-sm text-gray-500 mt-1">{record.doctor}</p>
                      </div>
                      <span className="text-sm text-gray-500">{formatDate(record.date)}</span>
                    </div>

                    <p className="text-sm text-gray-600 mt-2">{record.notes}</p>

                    <div className="flex items-center gap-3 mt-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${record.type === "Emergency" ? "bg-red-50 text-red-700" :
                          record.type === "Consultation" ? "bg-blue-50 text-blue-700" :
                            "bg-gray-50 text-gray-700"
                        }`}>
                        {record.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Medical Summary & Upcoming Appointments */}
        <div className="space-y-8">
          {/* Medical Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Medical Summary</h2>

            {/* Allergies */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-gray-900">Allergies</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((allergy, index) => (
                  <span key={index} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>

            {/* Conditions */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">Medical Conditions</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {patient.conditions.map((condition, index) => (
                  <span key={index} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm">
                    {condition}
                  </span>
                ))}
              </div>
            </div>

            {/* Medications */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Pill className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Current Medications</h3>
              </div>
              <div className="space-y-2">
                {patient.medications.map((medication, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-700">{medication}</span>
                    <span className="text-sm text-blue-600">Daily</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Appointments</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded-lg">
                Schedule
              </button>
            </div>

            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{appointment.type}</p>
                      <p className="text-sm text-gray-500 mt-1">{appointment.doctor}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(appointment.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{appointment.time}</span>
                    </div>
                  </div>

                  <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Lab Results */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Lab Results</h2>

            <div className="space-y-4">
              {labResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                  <div>
                    <p className="font-medium text-gray-900">{result.test}</p>
                    <p className="text-sm text-gray-500">{formatDate(result.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(result.status)}`}>
                      {result.result}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 py-3 text-center text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl border border-gray-200 transition">
              View All Lab Reports
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            Patient ID: PT-{patient.id.toString().padStart(4, '0')} • Created: Jan 15, 2020 • Last updated: Today
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition">
              Medical History PDF
            </button>
            <button className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition">
              Emergency Access
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}