"use client";

import { Filter, Search, Calendar, User, DollarSign } from "lucide-react";
import { useState } from "react";

interface InvoiceFiltersProps {
  onFilterChange: (filters: {
    search: string;
    status: string;
    dateRange: string;
    minAmount: number | null;
    maxAmount: number | null;
    sortBy: string;
  }) => void;
}

export function InvoiceFilters({ onFilterChange }: InvoiceFiltersProps) {
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    dateRange: "all",
    minAmount: null as number | null,
    maxAmount: null as number | null,
    sortBy: "date"
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Invoice Filters</h3>
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
            placeholder="Search invoices by number, patient name, or ID..."
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
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="partial">Partial Payment</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-2 block">Date Range</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={filters.dateRange}
            onChange={(e) => handleFilterChange("dateRange", e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-2 block">Min Amount</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="number"
              placeholder="₦0"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={filters.minAmount || ''}
              onChange={(e) => handleFilterChange("minAmount", e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-2 block">Sort By</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          >
            <option value="date">Due Date</option>
            <option value="amount">Amount</option>
            <option value="patient">Patient Name</option>
            <option value="status">Status</option>
            <option value="created">Created Date</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Advanced Filters</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Max Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  placeholder="₦1,000,000"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={filters.maxAmount || ''}
                  onChange={(e) => handleFilterChange("maxAmount", e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Payment Method</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="transfer">Bank Transfer</option>
                <option value="wallet">Patient Wallet</option>
                <option value="card">Card Payment</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Department</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                <option value="all">All Departments</option>
                <option value="cardiology">Cardiology</option>
                <option value="neurology">Neurology</option>
                <option value="orthopedics">Orthopedics</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Service Type</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                <option value="all">All Services</option>
                <option value="consultation">Consultation</option>
                <option value="lab">Lab Test</option>
                <option value="medication">Medication</option>
                <option value="surgery">Surgery</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => {
                setFilters({
                  search: "",
                  status: "all",
                  dateRange: "all",
                  minAmount: null,
                  maxAmount: null,
                  sortBy: "date"
                });
                onFilterChange({
                  search: "",
                  status: "all",
                  dateRange: "all",
                  minAmount: null,
                  maxAmount: null,
                  sortBy: "date"
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