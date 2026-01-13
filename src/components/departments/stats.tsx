"use client";

import { Building, Users, Bed, Activity, TrendingUp, DollarSign, Clock } from "lucide-react";

interface DepartmentStatsProps {
  stats: {
    totalDepartments: number;
    activeDepartments: number;
    totalStaff: number;
    totalBeds: number;
    occupiedBeds: number;
    averageOccupancy: number;
    totalRevenue: number;
  };
}

export function DepartmentStats({ stats }: DepartmentStatsProps) {
  const occupancyRate = Math.round((stats.occupiedBeds / stats.totalBeds) * 100);
  
  const statCards = [
    {
      label: "Total Departments",
      value: stats.totalDepartments,
      icon: <Building className="w-6 h-6" />,
      color: "bg-blue-50 text-blue-600",
      change: "+2 this year"
    },
    {
      label: "Active Departments",
      value: stats.activeDepartments,
      icon: <Activity className="w-6 h-6" />,
      color: "bg-emerald-50 text-emerald-600",
      change: `${Math.round((stats.activeDepartments / stats.totalDepartments) * 100)}% active`
    },
    {
      label: "Total Staff",
      value: stats.totalStaff,
      icon: <Users className="w-6 h-6" />,
      color: "bg-purple-50 text-purple-600",
      change: "+15 this month"
    },
    {
      label: "Bed Occupancy",
      value: `${stats.occupiedBeds}/${stats.totalBeds}`,
      icon: <Bed className="w-6 h-6" />,
      color: "bg-red-50 text-red-600",
      change: `${occupancyRate}% occupied`
    },
    {
      label: "Avg. Occupancy",
      value: `${stats.averageOccupancy}%`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: "bg-amber-50 text-amber-600",
      change: "+2.4% from last month"
    },
    {
      label: "Monthly Revenue",
      value: `₦${(stats.totalRevenue / 1000000).toFixed(1)}M`,
      icon: <DollarSign className="w-6 h-6" />,
      color: "bg-green-50 text-green-600",
      change: "+8.2% growth"
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${stat.color}`}>
              {stat.icon}
            </div>
            {index === 5 && (
              <div className="flex items-center gap-1 text-green-600 text-xs">
                <TrendingUp className="w-3 h-3" />
                <span>+8.2%</span>
              </div>
            )}
          </div>
          <p className="text-xl font-bold text-gray-900 mb-1">{stat.value}</p>
          <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
          <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
        </div>
      ))}
    </div>
  );
}