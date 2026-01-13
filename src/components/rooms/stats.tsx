"use client";

import { Bed, Users, Wrench, Clock, TrendingUp, Building } from "lucide-react";

interface RoomStatsProps {
  stats: {
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    maintenanceRooms: number;
    occupancyRate: number;
    averageStay: string;
  };
}

export function RoomStats({ stats }: RoomStatsProps) {
  const statCards = [
    {
      label: "Total Rooms",
      value: stats.totalRooms,
      icon: <Building className="w-6 h-6" />,
      color: "bg-blue-50 text-blue-600",
      change: "+2 this month"
    },
    {
      label: "Available",
      value: stats.availableRooms,
      icon: <Bed className="w-6 h-6" />,
      color: "bg-emerald-50 text-emerald-600",
      change: `${((stats.availableRooms / stats.totalRooms) * 100).toFixed(1)}% available`
    },
    {
      label: "Occupied",
      value: stats.occupiedRooms,
      icon: <Users className="w-6 h-6" />,
      color: "bg-red-50 text-red-600",
      change: `${((stats.occupiedRooms / stats.totalRooms) * 100).toFixed(1)}% occupancy`
    },
    {
      label: "Under Maintenance",
      value: stats.maintenanceRooms,
      icon: <Wrench className="w-6 h-6" />,
      color: "bg-amber-50 text-amber-600",
      change: `${((stats.maintenanceRooms / stats.totalRooms) * 100).toFixed(1)}%`
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${stat.color}`}>
              {stat.icon}
            </div>
            {index === 0 && (
              <div className="flex items-center gap-1 text-emerald-600 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>+12%</span>
              </div>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
          <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
          <p className="text-xs text-gray-400 mt-2">{stat.change}</p>
        </div>
      ))}
    </div>
  );
}