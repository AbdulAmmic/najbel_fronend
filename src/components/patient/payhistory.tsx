"use client";

import { Calendar, CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function PaymentHistory({ transactions = [] }: { transactions?: any[] }) {
  const [selectedFilter, setSelectedFilter] = useState("all");

  const statusConfig: any = {
    completed: {
      icon: CheckCircle,
      color: "bg-emerald-100 text-emerald-700",
      bg: "bg-emerald-50",
    },
    pending: {
      icon: Clock,
      color: "bg-amber-100 text-amber-700",
      bg: "bg-amber-50",
    },
    failed: {
      icon: AlertCircle,
      color: "bg-red-100 text-red-700",
      bg: "bg-red-50",
    },
  };

  const filters = [
    { id: "all", label: "All Payments" },
    { id: "completed", label: "Completed" },
    { id: "pending", label: "Pending" },
  ];

  const filteredTransactions = transactions.filter(tx =>
    selectedFilter === "all" || tx.status === selectedFilter
  );

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
            <p className="text-gray-600">Track all your transactions</p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${selectedFilter === filter.id
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="divide-y divide-gray-100">
        {filteredTransactions.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No transactions found.</div>
        ) : filteredTransactions.map((tx) => {
          const StatusIcon = statusConfig[tx.status]?.icon || CheckCircle;
          const statusColor = statusConfig[tx.status]?.color || "bg-gray-100 text-gray-700";

          return (
            <div
              key={tx.id}
              className={`p-6 hover:bg-gray-50/50 transition-colors ${statusConfig[tx.status]?.bg || ''}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start lg:items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-900">{tx.type === 'topup' ? 'Wallet Top-up' : 'Service Payment'}</h3>
                      <span className="text-xl font-bold text-gray-900">
                        ₦{tx.amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Ref:</span> {tx.reference}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Method:</span> {tx.payment_method}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 ${statusColor}`}>
                    <StatusIcon className="w-4 h-4" />
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}