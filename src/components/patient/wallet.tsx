"use client";

import { Wallet, TrendingUp, TrendingDown, CreditCard, Shield } from "lucide-react";
import { useState } from "react";

export default function WalletOverview({ data }: any) {
  const [showBalance, setShowBalance] = useState(false);

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl border-2 border-blue-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Wallet Overview</h2>
          <p className="text-gray-600">Your current balance and spending</p>
        </div>
        <button
          onClick={() => setShowBalance(!showBalance)}
          className="p-2 rounded-lg hover:bg-blue-50 transition"
          aria-label={showBalance ? "Hide balance" : "Show balance"}
        >
          <Shield className={`w-5 h-5 ${showBalance ? 'text-blue-600' : 'text-gray-400'}`} />
        </button>
      </div>

      {/* Main Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 mb-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Current Balance</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {showBalance ? `${data.currency}${data.balance.toLocaleString()}` : '••••••••'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <TrendingUp className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Active</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <p className="text-white/80 text-sm">Pending</p>
              <p className="text-lg font-bold text-white">{data.currency}{data.pendingPayments.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <p className="text-white/80 text-sm">Last Payment</p>
              <p className="text-lg font-bold text-white">{data.currency}{data.lastPayment.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Spending Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-gray-200 hover:border-blue-200 transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-lg font-bold text-gray-900">{data.currency}{data.totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-gray-200 hover:border-blue-200 transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-lg font-bold text-gray-900">24</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-gray-200 hover:border-blue-200 transition">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg. Monthly</p>
              <p className="text-lg font-bold text-gray-900">{data.currency}15,000</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}