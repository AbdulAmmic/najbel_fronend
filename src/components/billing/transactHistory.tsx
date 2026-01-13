"use client";

import { History, DollarSign, CreditCard, Wallet, Banknote, CheckCircle, XCircle, Calendar, Filter } from "lucide-react";
import { useState } from "react";

interface Transaction {
  id: string;
  date: string;
  invoiceNumber: string;
  description: string;
  type: "payment" | "refund" | "topup";
  amount: number;
  paymentMethod: "cash" | "transfer" | "wallet" | "card";
  status: "completed" | "pending" | "failed";
  reference: string;
  cashierName?: string;
}

interface TransactionHistoryProps {
  patient: any;
  transactions: Transaction[];
}

export function TransactionHistory({ patient, transactions }: TransactionHistoryProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "payment": return "bg-red-100 text-red-700";
      case "refund": return "bg-blue-100 text-blue-700";
      case "topup": return "bg-emerald-100 text-emerald-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-100 text-emerald-700";
      case "pending": return "bg-amber-100 text-amber-700";
      case "failed": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "cash": return <Banknote className="w-4 h-4" />;
      case "transfer": return <CreditCard className="w-4 h-4" />;
      case "wallet": return <Wallet className="w-4 h-4" />;
      case "card": return <CreditCard className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    if (filterType !== "all" && tx.type !== filterType) return false;
    if (filterMethod !== "all" && tx.paymentMethod !== filterMethod) return false;
    if (filterDate !== "all") {
      const txDate = new Date(tx.date);
      const now = new Date();
      const daysAgo = parseInt(filterDate);
      
      if (!isNaN(daysAgo)) {
        const cutoffDate = new Date();
        cutoffDate.setDate(now.getDate() - daysAgo);
        return txDate >= cutoffDate;
      }
    }
    return true;
  });

  // Calculate totals
  const totalPayments = transactions
    .filter(tx => tx.type === "payment" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalTopups = transactions
    .filter(tx => tx.type === "topup" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalRefunds = transactions
    .filter(tx => tx.type === "refund" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
          <p className="text-gray-600 mt-1">All financial transactions for {patient?.name || "patient"}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg">
          <History className="w-4 h-4" />
          <span className="text-sm font-medium">{transactions.length} transactions</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Payments</span>
            <DollarSign className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPayments)}</p>
          <p className="text-xs text-gray-500 mt-1">All completed payments</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Wallet Top-ups</span>
            <Wallet className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalTopups)}</p>
          <p className="text-xs text-gray-500 mt-1">Funds added to wallet</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Refunds Issued</span>
            <DollarSign className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalRefunds)}</p>
          <p className="text-xs text-gray-500 mt-1">All refunds processed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Filters:</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="payment">Payments</option>
            <option value="topup">Top-ups</option>
            <option value="refund">Refunds</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="transfer">Bank Transfer</option>
            <option value="wallet">Wallet</option>
            <option value="card">Card</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last Year</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 text-left text-sm font-medium text-gray-600">Date & Time</th>
              <th className="py-3 text-left text-sm font-medium text-gray-600">Description</th>
              <th className="py-3 text-left text-sm font-medium text-gray-600">Type & Method</th>
              <th className="py-3 text-left text-sm font-medium text-gray-600">Amount</th>
              <th className="py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="py-3 text-left text-sm font-medium text-gray-600">Reference</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">No transactions found</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3">
                    <div>
                      <p className="text-sm text-gray-900">
                        {new Date(tx.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </td>
                  <td className="py-3">
                    <div>
                      <p className="font-medium text-gray-900">{tx.description}</p>
                      <p className="text-sm text-gray-500">{tx.invoiceNumber}</p>
                      {tx.cashierName && (
                        <p className="text-xs text-gray-400 mt-1">Cashier: {tx.cashierName}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${getTypeColor(tx.type)}`}>
                        {getMethodIcon(tx.paymentMethod)}
                      </div>
                      <div>
                        <span className="block text-sm font-medium capitalize">{tx.type}</span>
                        <span className="text-xs text-gray-500 capitalize">{tx.paymentMethod}</span>
                      </div>
                    </div>
                  </td>
                  <td className={`py-3 font-bold ${
                    tx.type === "payment" ? "text-red-600" :
                    tx.type === "topup" ? "text-emerald-600" :
                    "text-blue-600"
                  }`}>
                    {tx.type === "payment" ? "-" : "+"}{formatCurrency(tx.amount)}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div>
                      <p className="text-sm text-gray-900 font-mono">{tx.reference}</p>
                      <p className="text-xs text-gray-500">Transaction ID</p>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      {filteredTransactions.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Showing {filteredTransactions.length} of {transactions.length} transactions
              {filterType !== "all" && ` (${filterType} only)`}
            </div>
            <div className="flex items-center gap-4">
              <button className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition">
                Download Statement
              </button>
              <button className="text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg transition">
                Print History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}