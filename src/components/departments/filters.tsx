"use client";

import { Filter, Search, SortAsc, Users, Bed } from "lucide-react";
import { useState } from "react";

interface DepartmentFiltersProps {
  onFilterChange: (filters: {
    search: string;
    status: string;
    location: string;
    minStaff: number | null;
    maxStaff: number | null;
    sortBy: string;
  }) => void;
}

export function DepartmentFilters({ onFilterChange }: DepartmentFiltersProps) {
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    location: "all",
    minStaff: null as number | null,
    maxStaff: null as number | null,
    sortBy: "name"
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const locations = ["Main Building", "North Wing", "South Wing", "East Wing", "West Wing", "Annex"];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters & Search</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? "Show Less" : "Show More"}
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search departments by name, code, or specialty..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="text-sm text-gray-600 mb-2 block">Status</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-2 block">Location</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={filters.location}
            onChange={(e) => handleFilterChange("location", e.target.value)}
          >
            <option value="all">All Locations</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-2 block">Min Staff</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="number"
              placeholder="0"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={filters.minStaff || ''}
              onChange={(e) => handleFilterChange("minStaff", e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-2 block">Sort By</label>
          <div className="relative">
            <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            >
              <option value="name">Department Name</option>
              <option value="staff">Staff Count</option>
              <option value="beds">Bed Count</option>
              <option value="occupancy">Occupancy Rate</option>
              <option value="fee">Consultation Fee</option>
            </select>
          </div>
        </div>
      </div>

      {/* Advanced Filters (Expandable) */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Advanced Filters</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Max Staff</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  placeholder="100"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={filters.maxStaff || ''}
                  onChange={(e) => handleFilterChange("maxStaff", e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Min Beds</label>
              <div className="relative">
                <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Max Beds</label>
              <div className="relative">
                <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  placeholder="50"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Min Fee</label>
              <input
                type="number"
                placeholder="₦0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <button 
              onClick={() => {
                setFilters({
                  search: "",
                  status: "all",
                  location: "all",
                  minStaff: null,
                  maxStaff: null,
                  sortBy: "name"
                });
                onFilterChange({
                  search: "",
                  status: "all",
                  location: "all",
                  minStaff: null,
                  maxStaff: null,
                  sortBy: "name"
                });
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}