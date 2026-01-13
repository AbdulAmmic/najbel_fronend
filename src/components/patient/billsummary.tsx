"use client";

import { Receipt, Info, FileText, Clock } from "lucide-react";

export default function BillingSummary({ invoices = [] }: { invoices?: any[] }) {
  const pendingAmount = invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalItems = invoices.length;

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Receipt className="w-6 h-6 text-blue-600" />
        Billing Summary
      </h2>

      <div className="space-y-6">
        {/* Total Outstanding */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/50 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-blue-600 mb-1">Total Outstanding</p>
            <p className="text-3xl font-bold text-gray-900">₦{pendingAmount.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase tracking-wider">
                {invoices.filter(i => i.status !== 'paid').length} Pending
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-sm text-gray-600 font-medium">Total Paid to Date</span>
            </div>
            <span className="font-bold text-emerald-600">₦{totalPaid.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600 font-medium">Total Invoices</span>
            </div>
            <span className="font-bold text-gray-900">{totalItems}</span>
          </div>
        </div>

        {/* Info Card */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed font-medium">
            Please ensure all pending payments are cleared before your next consultation to avoid service delays.
          </p>
        </div>
      </div>
    </div>
  );
}

// Add missing components to imports if needed
import { CheckCircle } from "lucide-react";