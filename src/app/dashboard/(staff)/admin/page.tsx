"use client";

import { useState } from "react";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-1">

      {/* Sidebar (Optional placeholder — remove if not needed) */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-0"
          } bg-white border-r shadow-sm transition-all duration-300 overflow-hidden hidden md:block`}
      >
        <div className="p-4 font-semibold text-gray-700">
          Sidebar
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Welcome to Namutunci Clinic Dashboard
        </h2>

        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-600">
            Your content goes here. Replace this section with your patient dashboard, clinic stats, tables, or components.
          </p>
        </div>
      </main>
    </div>
  );
}
