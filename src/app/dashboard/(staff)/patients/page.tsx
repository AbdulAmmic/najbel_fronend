"use client";

import Header from "@/components/Layouts/header";
import Sidebar from "@/components/Layouts/sidebar";
import { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  User,
  Phone,
  Calendar,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Users,
  Activity,
  Download,
  Edit,
  Eye
} from "lucide-react";

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  nextAppointment: string;
  status: "Active" | "Inactive" | "Follow-up";
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  avatarColor: string;
}

import { patients as patientsApi, vitals as vitalsApi } from "@/services/api";
import { useEffect } from "react";

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Vitals Modal State
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [vitalsForm, setVitalsForm] = useState({
    weight: "",
    height: "",
    blood_pressure: "",
    heart_rate: "",
    temperature: "",
    oxygen_saturation: ""
  });

  const handleOpenVitals = (patient: Patient) => {
    setSelectedPatient(patient);
    setVitalsForm({
      weight: "",
      height: "",
      blood_pressure: "",
      heart_rate: "",
      temperature: "",
      oxygen_saturation: ""
    });
    setShowVitalsModal(true);
  };

  const handleSaveVitals = async () => {
    if (!selectedPatient) return;
    try {
      await vitalsApi.create({
        patient_id: selectedPatient.id,
        weight: parseFloat(vitalsForm.weight),
        height: parseFloat(vitalsForm.height),
        blood_pressure: vitalsForm.blood_pressure,
        heart_rate: parseInt(vitalsForm.heart_rate),
        temperature: parseFloat(vitalsForm.temperature),
        oxygen_saturation: parseInt(vitalsForm.oxygen_saturation)
      });
      alert("Vitals recorded successfully!");
      setShowVitalsModal(false);
    } catch (e) {
      console.error("Failed to save vitals", e);
      alert("Failed to save vitals");
    }
  };

  const patientsPerPage = 8;

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserRole(user.role); // e.g., "nurse", "doctor"
        }

        const data = await patientsApi.getMyPatients();
        setPatients(data.map((p: any) => ({
          ...p,
          id: p.id,
          name: p.name,
          age: p.age,
          gender: p.gender,
          phone: p.phone,
          email: p.email,
          bloodGroup: p.blood_group || "O+",
          avatarColor: p.gender === "Male" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600",
          status: p.status || "Active",
          lastVisit: p.lastVisit || "Never",
          nextAppointment: "Pending"
        })));
      } catch (error) {
        console.error("Failed to load patients", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients
    .filter(patient => {
      const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone.includes(searchQuery);

      if (selectedFilter === "all") return matchesSearch;
      if (selectedFilter === "active") return matchesSearch && patient.status === "Active";
      if (selectedFilter === "inactive") return matchesSearch && patient.status === "Inactive";
      if (selectedFilter === "follow-up") return matchesSearch && patient.status === "Follow-up";

      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "age-asc") return a.age - b.age;
      if (sortBy === "age-desc") return b.age - a.age;
      return 0;
    });

  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

  const totalPatients = patients.length;
  const activePatients = patients.filter(p => p.status === "Active").length;
  const followUpPatients = patients.filter(p => p.status === "Follow-up").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Inactive":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "Follow-up":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    if (dateString === "Pending") return "Pending";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-[1800px] mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Patient Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and view all patient records
            </p>
          </div>

        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalPatients}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Patients</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{activePatients}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Follow-up Needed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{followUpPatients}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search patients by name, email, or phone..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Filter:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {["all", "active", "inactive", "follow-up"].map((filter) => (
                  <button
                    key={filter}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedFilter === filter
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    onClick={() => setSelectedFilter(filter)}
                  >
                    {filter === "all" ? "All" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-600">Sort:</span>
                <select
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="age-asc">Age (Lowest)</option>
                  <option value="age-desc">Age (Highest)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Patient</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Contact</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Last Visit</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Next Appointment</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl ${patient.avatarColor} flex items-center justify-center font-semibold`}>
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{patient.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">{patient.age} years</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">{patient.gender}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">{patient.bloodGroup}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{patient.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 truncate max-w-[200px]">{patient.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{formatDate(patient.lastVisit)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className={`text-sm font-medium ${patient.nextAppointment === "Pending"
                        ? "text-gray-500"
                        : "text-gray-700"
                        }`}>
                        {patient.nextAppointment === "Pending" ? "Pending" : formatDate(patient.nextAppointment)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(patient.status)}`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition">
                        <Edit className="w-4 h-4" />
                      </button>
                      {userRole === "nurse" && (
                        <button
                          className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition"
                          onClick={() => handleOpenVitals(patient)}
                          title="Record Vitals"
                        >
                          <Activity className="w-4 h-4" /> {/* Using Activity icon for Vitals */}
                        </button>
                      )}
                      <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vitals Modal */}
        {showVitalsModal && selectedPatient && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Record Vitals for {selectedPatient.name}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded-lg"
                      value={vitalsForm.weight}
                      onChange={e => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Height (cm)</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded-lg"
                      value={vitalsForm.height}
                      onChange={e => setVitalsForm({ ...vitalsForm, height: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">BP (mmHg)</label>
                    <input
                      type="text"
                      placeholder="120/80"
                      className="w-full border p-2 rounded-lg"
                      value={vitalsForm.blood_pressure}
                      onChange={e => setVitalsForm({ ...vitalsForm, blood_pressure: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded-lg"
                      value={vitalsForm.heart_rate}
                      onChange={e => setVitalsForm({ ...vitalsForm, heart_rate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full border p-2 rounded-lg"
                      value={vitalsForm.temperature}
                      onChange={e => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">O2 Sat (%)</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded-lg"
                      value={vitalsForm.oxygen_saturation}
                      onChange={e => setVitalsForm({ ...vitalsForm, oxygen_saturation: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setShowVitalsModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveVitals}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Vitals
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstPatient + 1}-{Math.min(indexOfLastPatient, filteredPatients.length)} of {filteredPatients.length} patients
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${currentPage === 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg ${currentPage === page
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${currentPage === totalPages
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-gray-500">
          Data last updated: Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition">
            <Download className="w-4 h-4" />
            Export Data
          </button>
          <button className="px-6 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition">
            Print List
          </button>
        </div>
      </div>
    </div>
  );
}