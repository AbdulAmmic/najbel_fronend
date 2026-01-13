import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCard({ title, value, color, trend }: any) {
  const colorConfig: any = {
    blue: {
      bg: "from-blue-50 to-blue-100/30",
      text: "text-blue-600",
      gradient: "from-blue-500 to-blue-600",
    },
    green: {
      bg: "from-emerald-50 to-emerald-100/30",
      text: "text-emerald-600",
      gradient: "from-emerald-500 to-green-600",
    },
    red: {
      bg: "from-red-50 to-red-100/30",
      text: "text-red-600",
      gradient: "from-red-500 to-orange-600",
    },
    purple: {
      bg: "from-purple-50 to-purple-100/30",
      text: "text-purple-600",
      gradient: "from-purple-500 to-purple-600",
    },
  };

  const config = colorConfig[color];

  return (
    <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-gray-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
              Appointments
            </span>
          </div>
        </div>
        <div className="relative">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {trend?.includes('+') ? (
                <TrendingUp className="w-5 h-5 text-white" />
              ) : (
                <TrendingDown className="w-5 h-5 text-white" />
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-3">{trend}</p>
    </div>
  );
}