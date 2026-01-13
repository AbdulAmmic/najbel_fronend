"use client";

import { Filter, Search, SortAsc } from "lucide-react";
import { useState } from "react";

interface RoomFiltersProps {
  onFilterChange: (filters: {
    search: string;
    type: string;
    status: string;
    floor: string;
    ward: string;
    sortBy: string;
  }) => void;
}

export function RoomFilters({ onFilterChange }: RoomFiltersProps) {
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    status: "all",
    floor: "all",
    ward: "all",
    sortBy: "number"
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const floors = ["1", "2", "3", "4", "5"];
  const wards = ["A", "B", "C", "ICU", "ER", "Pediatrics", "Maternity"];

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
            placeholder="Search rooms by number, ward, or equipment..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="text-sm text-gray-600 mb-2 block">Room Type</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="general">General Ward</option>
            <option value="private">Private Room</option>
            <option value="icu">ICU</option>
            <option value="emergency">Emergency</option>
            <option value="pediatric">Pediatric</option>
            <option value="maternity">Maternity</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-2 block">Status</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
            <option value="reserved">Reserved</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-2 block">Floor</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={filters.floor}
            onChange={(e) => handleFilterChange("floor", e.target.value)}
          >
            <option value="all">All Floors</option>
            {floors.map(floor => (
              <option key={floor} value={floor}>Floor {floor}</option>
            ))}
          </select>
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
              <option value="number">Room Number</option>
              <option value="status">Status</option>
              <option value="type">Room Type</option>
              <option value="floor">Floor</option>
              <option value="rate">Daily Rate</option>
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
              <label className="text-sm text-gray-600 mb-2 block">Ward</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={filters.ward}
                onChange={(e) => handleFilterChange("ward", e.target.value)}
              >
                <option value="all">All Wards</option>
                {wards.map(ward => (
                  <option key={ward} value={ward}>{ward}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Min Rate</label>
              <input
                type="number"
                placeholder="₦0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Max Rate</label>
              <input
                type="number"
                placeholder="₦100,000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Amenities</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                <option value="all">All Amenities</option>
                <option value="wifi">WiFi</option>
                <option value="tv">TV</option>
                <option value="private_bathroom">Private Bathroom</option>
                <option value="ac">Air Conditioning</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}