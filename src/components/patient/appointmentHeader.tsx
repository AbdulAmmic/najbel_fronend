"use client";

import { Plus, Search, Filter, X } from "lucide-react";
import StatsCard from "./patientStatsComponent";
import SearchFilter from "./searchFilter";

export default function AppointmentsHeader({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  stats,
  onBookClick,
}: any) {
  return (
    <>
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Medical Appointments
            </h1>
            <p className="text-gray-600">
              Schedule, manage, and track your healthcare appointments
            </p>
          </div>

          <button
            onClick={onBookClick}
            className="group flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md w-full lg:w-auto"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Book New Appointment
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Upcoming"
            value={stats.upcoming}
            color="blue"
            trend="+2 this week"
          />
          <StatsCard
            title="Past Appointments"
            value={stats.past}
            color="green"
            trend="All completed"
          />
          <StatsCard
            title="Cancelled"
            value={stats.cancelled}
            color="red"
            trend="1 last month"
          />
        </div>

        {/* Search and Filter */}
        <SearchFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterType={filterType}
          setFilterType={setFilterType}
        />
      </div>
    </>
  );
}