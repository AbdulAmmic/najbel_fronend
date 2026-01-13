"use client";

import { DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet, Banknote, Smartphone } from "lucide-react";

interface PaymentStatsProps {
  stats: {
    totalRevenue: number;
    pendingAmount: number;
    collectedToday: number;
    walletTransactions: number;
    cashPayments: number;
    transferPayments: number;
    cardPayments: number;
  };
}

export function PaymentStats({ stats }: PaymentStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const statCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: <DollarSign className="w-6 h-6" />,
      color: "bg-blue-50 text-blue-600",
      change: "+15.2%",
      trend: "up"
    },
    {
      label: "Pending Payments",
      value: formatCurrency(stats.pendingAmount),
      icon: <TrendingDown className="w-6 h-6" />,
      color: "bg-red-50 text-red-600",
      change: "-2.8%",
      trend: "down"
    },
    {
      label: "Collected Today",
      value: formatCurrency(stats.collectedToday),
      icon: <TrendingUp className="w-6 h-6" />,
      color: "bg-emerald-50 text-emerald-600",
      change: "+8.5%",
      trend: "up"
    },
    {
      label: "Wallet Transactions",
      value: stats.walletTransactions,
      icon: <Wallet className="w-6 h-6" />,
      color: "bg-purple-50 text-purple-600",
      change: "+12.3%",
      trend: "up"
    },
  ];

  const paymentMethods = [
    {
      method: "Cash",
      amount: stats.cashPayments,
      percentage: Math.round((stats.cashPayments / stats.totalRevenue) * 100),
      icon: <Banknote className="w-4 h-4" />,
      color: "bg-emerald-500"
    },
    {
      method: "Bank Transfer",
      amount: stats.transferPayments,
      percentage: Math.round((stats.transferPayments / stats.totalRevenue) * 100),
      icon: <CreditCard className="w-4 h-4" />,
      color: "bg-blue-500"
    },
    {
      method: "Patient Wallet",
      amount: stats.walletTransactions,
      percentage: Math.round((stats.walletTransactions / stats.totalRevenue) * 100),
      icon: <Wallet className="w-4 h-4" />,
      color: "bg-purple-500"
    },
    {
      method: "Card Payment",
      amount: stats.cardPayments,
      percentage: Math.round((stats.cardPayments / stats.totalRevenue) * 100),
      icon: <Smartphone className="w-4 h-4" />,
      color: "bg-orange-500"
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Stats Cards */}
      <div className="lg:col-span-2 grid grid-cols-2 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-sm ${stat.trend === "up" ? "text-emerald-600" : "text-red-600"}`}>
                {stat.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{stat.change}</span>
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Payment Methods Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Payment Methods</h3>
        <div className="space-y-4">
          {paymentMethods.map((method, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded ${method.color}`}>
                    {method.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{method.method}</span>
                </div>
                <span className="text-sm text-gray-600">{method.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{ 
                    width: `${method.percentage}%`,
                    backgroundColor: method.color.replace('bg-', '').replace('-500', '-500')
                  }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">{method.percentage}% of total</span>
                <span className="text-xs text-gray-600">{formatCurrency(method.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}