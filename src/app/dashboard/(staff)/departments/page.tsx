"use client";

import { useState } from "react";
import {
  Plus,
  Download,
  Printer,
  LayoutGrid,
  List,
  Building,
  TrendingUp,
  BarChart3
} from "lucide-react";

// Import components
import { DepartmentStats } from "@/components/departments/stats";
import { DepartmentFilters } from "@/components/departments/filters";
import { DepartmentCard } from "@/components/departments/cards";
import { AddDepartmentModal } from "@/components/departments/modal";
import { DepartmentDetailsModal } from "@/components/departments/details";

// Mock data
const initialDepartments = [
  {
    id: "1",
    name: "Cardiology",
    code: "CARD",
    head: "Dr. Sarah Johnson",
    totalStaff: 42,
    totalBeds: 60,
    occupiedBeds: 48,
    location: "Main Building, Floor 3",
    contact: "+234 801 234 5678",
    email: "cardiology@hospital.com",
    status: "active" as const,
    specialties: ["Heart Surgery", "Angioplasty", "Echocardiography", "Cardiac Rehab"],
    consultationFee: 10000,
    description: "Specialized in heart and cardiovascular system treatments"
  },
  {
    id: "2",
    name: "Neurology",
    code: "NEURO",
    head: "Dr. Michael Chen",
    totalStaff: 35,
    totalBeds: 45,
    occupiedBeds: 40,
    location: "North Wing, Floor 2",
    contact: "+234 802 345 6789",
    email: "neurology@hospital.com",
    status: "active" as const,
    specialties: ["Epilepsy", "Stroke Care", "Neuropathy", "Brain Surgery"],
    consultationFee: 8500,
    description: "Comprehensive neurological care and treatment"
  },
  {
    id: "3",
    name: "Orthopedics",
    code: "ORTHO",
    head: "Dr. James Wilson",
    totalStaff: 38,
    totalBeds: 55,
    occupiedBeds: 52,
    location: "Main Building, Floor 2",
    contact: "+234 803 456 7890",
    email: "orthopedics@hospital.com",
    status: "active" as const,
    specialties: ["Joint Replacement", "Spine Surgery", "Sports Medicine", "Fracture Care"],
    consultationFee: 7500,
    description: "Specializing in musculoskeletal system disorders"
  },
  {
    id: "4",
    name: "Pediatrics",
    code: "PED",
    head: "Dr. Fatima Ahmed",
    totalStaff: 45,
    totalBeds: 65,
    occupiedBeds: 58,
    location: "South Wing, Floor 1",
    contact: "+234 804 567 8901",
    email: "pediatrics@hospital.com",
    status: "active" as const,
    specialties: ["Neonatal Care", "Vaccination", "Child Nutrition", "Developmental Disorders"],
    consultationFee: 6000,
    description: "Comprehensive healthcare for children and adolescents"
  },
  {
    id: "5",
    name: "Emergency Medicine",
    code: "ER",
    head: "Dr. David Brown",
    totalStaff: 55,
    totalBeds: 40,
    occupiedBeds: 38,
    location: "Main Building, Ground Floor",
    contact: "+234 805 678 9012",
    email: "emergency@hospital.com",
    status: "active" as const,
    specialties: ["Trauma Care", "Toxicology", "Emergency Surgery", "Critical Care"],
    consultationFee: 5000,
    description: "24/7 emergency medical services and trauma care"
  },
  {
    id: "6",
    name: "Maternity & Gynecology",
    code: "GYN",
    head: "Dr. Grace Williams",
    totalStaff: 40,
    totalBeds: 50,
    occupiedBeds: 45,
    location: "East Wing, Floor 2",
    contact: "+234 806 789 0123",
    email: "gynecology@hospital.com",
    status: "active" as const,
    specialties: ["Prenatal Care", "Labor & Delivery", "Fertility", "Women's Health"],
    consultationFee: 8000,
    description: "Comprehensive women's health and maternity care"
  },
  {
    id: "7",
    name: "Radiology",
    code: "RAD",
    head: "Dr. Robert Taylor",
    totalStaff: 25,
    totalBeds: 0,
    occupiedBeds: 0,
    location: "Main Building, Floor 1",
    contact: "+234 807 890 1234",
    email: "radiology@hospital.com",
    status: "maintenance" as const,
    specialties: ["MRI", "CT Scan", "X-Ray", "Ultrasound"],
    consultationFee: 7000,
    description: "Advanced diagnostic imaging services"
  },
  {
    id: "8",
    name: "Psychiatry",
    code: "PSYCH",
    head: "Dr. Aisha Musa",
    totalStaff: 30,
    totalBeds: 35,
    occupiedBeds: 30,
    location: "West Wing, Floor 3",
    contact: "+234 808 901 2345",
    email: "psychiatry@hospital.com",
    status: "active" as const,
    specialties: ["Counseling", "Therapy", "Mental Health", "Addiction Treatment"],
    consultationFee: 9000,
    description: "Mental health and psychiatric care services"
  },
];

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState(initialDepartments);
  const [filteredDepartments, setFilteredDepartments] = useState(initialDepartments);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);

  // Calculate statistics
  const stats = {
    totalDepartments: departments.length,
    activeDepartments: departments.filter(d => d.status === "active").length,
    totalStaff: departments.reduce((sum, dept) => sum + dept.totalStaff, 0),
    totalBeds: departments.reduce((sum, dept) => sum + dept.totalBeds, 0),
    occupiedBeds: departments.reduce((sum, dept) => sum + dept.occupiedBeds, 0),
    averageOccupancy: Math.round((departments.reduce((sum, dept) => sum + (dept.occupiedBeds / dept.totalBeds), 0) / departments.filter(d => d.totalBeds > 0).length) * 100),
    totalRevenue: departments.reduce((sum, dept) => sum + (dept.consultationFee * dept.occupiedBeds * 30), 0)
  };

  // Handle filter changes
  const handleFilterChange = (filters: any) => {
    let filtered = [...departments];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm) ||
        dept.code.toLowerCase().includes(searchTerm) ||
        dept.head.toLowerCase().includes(searchTerm) ||
        dept.specialties.some((spec: string) => spec.toLowerCase().includes(searchTerm))
      );
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(dept => dept.status === filters.status);
    }

    // Location filter
    if (filters.location !== "all") {
      filtered = filtered.filter(dept => dept.location.includes(filters.location));
    }

    // Staff filter
    if (filters.minStaff !== null) {
      filtered = filtered.filter(dept => dept.totalStaff >= filters.minStaff);
    }
    if (filters.maxStaff !== null) {
      filtered = filtered.filter(dept => dept.totalStaff <= filters.maxStaff);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "staff":
          return b.totalStaff - a.totalStaff;
        case "beds":
          return b.totalBeds - a.totalBeds;
        case "occupancy":
          return (b.occupiedBeds / b.totalBeds) - (a.occupiedBeds / a.totalBeds);
        case "fee":
          return b.consultationFee - a.consultationFee;
        default:
          return 0;
      }
    });

    setFilteredDepartments(filtered);
  };

  // Handle adding new department
  const handleAddDepartment = (newDepartment: any) => {
    if (editingDepartment) {
      // Update existing department
      setDepartments(departments.map(dept => dept.id === editingDepartment.id ? newDepartment : dept));
      setEditingDepartment(null);
    } else {
      // Add new department
      setDepartments([...departments, newDepartment]);
    }
    setFilteredDepartments([...filteredDepartments, newDepartment]);
  };

  // Handle deleting department
  const handleDeleteDepartment = (deptId: string) => {
    if (confirm("Are you sure you want to delete this department? This action cannot be undone.")) {
      setDepartments(departments.filter(dept => dept.id !== deptId));
      setFilteredDepartments(filteredDepartments.filter(dept => dept.id !== deptId));
    }
  };

  // Handle viewing department details
  const handleViewDetails = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    if (dept) {
      setSelectedDepartment(dept);
      setIsDetailsModalOpen(true);
    }
  };

  // Handle editing department
  const handleEditDepartment = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    if (dept) {
      setEditingDepartment(dept);
      setIsAddModalOpen(true);
    }
  };

  return (
    <div className="max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
            <p className="text-gray-600 mt-2">
              Manage hospital departments, staff, and resources
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition">
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={() => {
                setEditingDepartment(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition"
            >
              <Plus className="w-5 h-5" />
              Add New Department
            </button>
          </div>
        </div>

        {/* Stats */}
        <DepartmentStats stats={stats} />

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-500">
            <Building className="w-4 h-4 inline mr-1" />
            Showing {filteredDepartments.length} of {departments.length} departments
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-400"}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-400"}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <DepartmentFilters onFilterChange={handleFilterChange} />

      {/* Departments Grid */}
      <div className={`mt-8 ${viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
        }`}>
        {filteredDepartments.map((department) => (
          <DepartmentCard
            key={department.id}
            department={department}
            onViewDetails={handleViewDetails}
            onEdit={handleEditDepartment}
            onDelete={handleDeleteDepartment}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredDepartments.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <Building className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No departments found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your filters or add a new department</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Add New Department
          </button>
        </div>
      )}

      {/* Performance Summary */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Department Performance</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {departments.slice(0, 5).map((dept) => {
              const occupancy = Math.round((dept.occupiedBeds / dept.totalBeds) * 100);
              return (
                <div key={dept.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{dept.name}</span>
                      <span className="text-sm text-gray-500">{occupancy}% occupancy</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${occupancy > 80 ? 'bg-red-500' :
                            occupancy > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        style={{ width: `${occupancy}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Revenue</span>
              <span className="font-semibold text-gray-900">
                ₦{(stats.totalRevenue / 1000000).toFixed(1)}M
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Busiest Department</span>
              <span className="font-semibold text-gray-900">Emergency (95%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg. Consultation Fee</span>
              <span className="font-semibold text-gray-900">
                ₦{Math.round(departments.reduce((sum, d) => sum + d.consultationFee, 0) / departments.length).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Staff Growth</span>
              <div className="flex items-center gap-1 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
                <span className="font-semibold">+12%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddDepartmentModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingDepartment(null);
        }}
        onAddDepartment={handleAddDepartment}
        editingDepartment={editingDepartment}
      />

      <DepartmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        department={selectedDepartment}
        onEdit={() => {
          setIsDetailsModalOpen(false);
          handleEditDepartment(selectedDepartment.id);
        }}
      />
    </div>
  );
}