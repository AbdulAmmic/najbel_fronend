"use client";

import { FileText, Download, Eye, Share2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function InvoiceList({ invoices = [], onPay }: { invoices?: any[], onPay?: (id: number) => void }) {
  const [selectedStatus, setSelectedStatus] = useState("all");

  const statusConfig: any = {
    paid: {
      icon: CheckCircle,
      color: "bg-emerald-100 text-emerald-700",
      label: "Paid",
    },
    pending: {
      icon: Clock,
      color: "bg-amber-100 text-amber-700",
      label: "Pending",
    },
    overdue: {
      icon: AlertCircle,
      color: "bg-red-100 text-red-700",
      label: "Overdue",
    },
    partial: {
      icon: Clock,
      color: "bg-blue-100 text-blue-700",
      label: "Partial",
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    selectedStatus === "all" || inv.status === selectedStatus
  );

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Invoices</h2>
          <div className="flex gap-2">
            {["all", "pending", "paid", "overdue"].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${selectedStatus === status
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:bg-gray-50"
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {filteredInvoices.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No invoices found.</div>
        ) : filteredInvoices.map((invoice) => {
          const StatusIcon = statusConfig[invoice.status]?.icon || FileText;
          const statusColor = statusConfig[invoice.status]?.color || "bg-gray-100 text-gray-700";

          return (
            <div key={invoice.id} className="p-6 hover:bg-gray-50/50 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start lg:items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{invoice.invoice_number}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                          <span>{new Date(invoice.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className="text-xl font-bold text-gray-900">
                        ₦{invoice.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 ${statusColor}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig[invoice.status]?.label || invoice.status}
                  </div>

                  <div className="flex items-center gap-1">
                    {invoice.status !== 'paid' && (
                      <button
                        onClick={() => onPay?.(invoice.id)}
                        className="p-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        Pay
                      </button>
                    )}
                    <button className="p-2 rounded-lg hover:bg-gray-100 transition" title="Download">
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>
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