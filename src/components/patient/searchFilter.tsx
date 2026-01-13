import { Search, Filter, X } from "lucide-react";

export default function SearchFilter({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
}: any) {
  const filters = [
    { id: "all", label: "All Types" },
    { id: "video", label: "Video" },
    { id: "clinic", label: "Clinic" },
    { id: "emergency", label: "Emergency" },
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by doctor, specialty, or date..."
            className="w-full pl-11 pr-10 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all placeholder-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setFilterType(filter.id)}
              className={`px-4 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
                filterType === filter.id
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}