import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

export default function AppointmentTabs({ activeTab, setActiveTab, stats }: any) {
  const tabs = [
    {
      id: "upcoming",
      label: "Upcoming",
      icon: Clock,
      count: stats.upcoming,
      color: "text-blue-600 bg-blue-100",
    },
    {
      id: "past",
      label: "Past",
      icon: CheckCircle,
      count: stats.past,
      color: "text-green-600 bg-green-100",
    },
    {
      id: "cancelled",
      label: "Cancelled",
      icon: XCircle,
      count: stats.cancelled,
      color: "text-red-600 bg-red-100",
    },
  ];

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-3 px-5 py-3.5 rounded-xl font-medium
                transition-all duration-300 relative overflow-hidden group
                ${isActive
                  ? "bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-200 text-blue-700"
                  : "bg-white text-gray-700 border-2 border-gray-100 hover:border-blue-100 hover:text-blue-600"
                }
              `}
            >
              {/* Background effect for active */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-600/5"></div>
              )}
              
              <div className={`p-2 rounded-lg ${tab.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <span className="font-semibold">{tab.label}</span>
              
              <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              }`}>
                {tab.count}
              </span>
              
              {/* Hover indicator */}
              {!isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}