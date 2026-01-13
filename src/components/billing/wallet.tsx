"use client";

import { Wallet, TrendingUp, TrendingDown, CreditCard, History, Plus, Download, Eye, ArrowUpDown } from "lucide-react";
import { useState } from "react";

interface Customer {
  id: string;
  name: string;
  patientId: string;
  email: string;
  phone: string;
  walletBalance: number;
  creditLimit: number;
  totalSpent: number;
  lastTopUp: string;
}

interface CustomerWalletComponentProps {
  customer: Customer;
  onAddFunds: (customerId: string) => void;
  onViewHistory: (customerId: string) => void;
  onAdjustCredit: (customerId: string) => void;
}

export function CustomerWalletComponent({ 
  customer, 
  onAddFunds, 
  onViewHistory,
  onAdjustCredit 
}: CustomerWalletComponentProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const recentTransactions = [
    { id: 1, type: "credit" as const, description: "Wallet Top-up", amount: 50000, date: "2024-03-20", method: "Bank Transfer" as const },
    { id: 2, type: "debit" as const, description: "Consultation Fee", amount: -10000, date: "2024-03-19", method: "Wallet" as const },
    { id: 3, type: "debit" as const, description: "Lab Test Payment", amount: -15000, date: "2024-03-18", method: "Wallet" as const },
    { id: 4, type: "credit" as const, description: "Wallet Top-up", amount: 30000, date: "2024-03-15", method: "Cash" as const },
    { id: 5, type: "debit" as const, description: "Medication Purchase", amount: -8000, date: "2024-03-14", method: "Wallet" as const },
  ];

  const usageStats = [
    { label: "Consultations", value: 5, amount: 45000 },
    { label: "Lab Tests", value: 3, amount: 35000 },
    { label: "Medications", value: 8, amount: 24000 },
    { label: "Other Services", value: 2, amount: 12000 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Customer Wallet</h2>
          <p className="text-gray-600 mt-1">{customer.name} • Patient ID: {customer.patientId}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewHistory(customer.id)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <History className="w-4 h-4" />
            History
          </button>
          <button
            onClick={() => onAddFunds(customer.id)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Add Funds
          </button>
        </div>
      </div>

      {/* Wallet Balance & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Current Balance */}
        <div className="col-span-2 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white text-blue-600 rounded-lg">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(customer.walletBalance)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="text-gray-500">Last top-up: {new Date(customer.lastTopUp).toLocaleDateString()}</p>
              <p className="text-emerald-600 mt-1">+12.5% from last month</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        {/* Credit Limit */}
        <div className="p-6 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Credit Limit</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(customer.creditLimit)}</p>
            </div>
          </div>
          <button
            onClick={() => onAdjustCredit(customer.id)}
            className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
          >
            <ArrowUpDown className="w-4 h-4 inline mr-1" />
            Adjust Limit
          </button>
        </div>

        {/* Total Spent */}
        <div className="p-6 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <TrendingDown className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">This month</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
          <select
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 text-left text-sm font-medium text-gray-600">Date</th>
                <th className="py-3 text-left text-sm font-medium text-gray-600">Description</th>
                <th className="py-3 text-left text-sm font-medium text-gray-600">Method</th>
                <th className="py-3 text-left text-sm font-medium text-gray-600">Amount</th>
                <th className="py-3 text-left text-sm font-medium text-gray-600">Balance</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx) => {
                let runningBalance = customer.walletBalance;
                return (
                  <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 text-sm text-gray-600">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <p className="font-medium text-gray-900">{tx.description}</p>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {tx.method}
                      </span>
                    </td>
                    <td className={`py-3 font-medium ${
                      tx.type === "credit" ? "text-emerald-600" : "text-red-600"
                    }`}>
                      {tx.type === "credit" ? "+" : ""}{formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {formatCurrency(runningBalance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Spending Breakdown */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Spending Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {usageStats.map((stat, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-lg font-bold text-gray-900">{stat.value} {stat.value === 1 ? 'visit' : 'visits'}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(stat.amount)}</p>
                </div>
                <div className={`w-2 h-8 ${
                  index === 0 ? "bg-blue-500" :
                  index === 1 ? "bg-emerald-500" :
                  index === 2 ? "bg-amber-500" :
                  "bg-purple-500"
                }`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600">Contact Information</p>
            <p className="font-medium">{customer.email} • {customer.phone}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
              <Download className="w-4 h-4" />
              Export Statement
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition">
              <Eye className="w-4 h-4" />
              Full Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}