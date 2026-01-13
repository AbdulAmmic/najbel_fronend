"use client";

import { FileText, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, Eye, Download, ArrowRight } from "lucide-react";
import { useState } from "react";

interface InvoiceItem {
  description: string;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue" | "partial" | "cancelled";
  paymentMethod?: "cash" | "transfer" | "wallet" | "card";
  createdDate: string;
  items: InvoiceItem[];
}

interface PatientInvoicesProps {
  patient: any;
  invoices: Invoice[];
  onProcessPayment: (invoiceId: string) => void;
  onViewDetails: (invoiceId: string) => void;
  onDownload: (invoiceId: string) => void;
}

export function PatientInvoices({ patient, invoices, onProcessPayment, onViewDetails, onDownload }: PatientInvoicesProps) {
  const [viewMode, setViewMode] = useState<"all" | "pending" | "paid">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-emerald-100 text-emerald-700";
      case "pending": return "bg-amber-100 text-amber-700";
      case "overdue": return "bg-red-100 text-red-700";
      case "partial": return "bg-blue-100 text-blue-700";
      case "cancelled": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "overdue": return <AlertCircle className="w-4 h-4" />;
      case "partial": return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  // Filter invoices based on view mode
  const filteredInvoices = invoices.filter(invoice => {
    if (viewMode === "all") return true;
    if (viewMode === "pending") return invoice.status === "pending" || invoice.status === "overdue";
    if (viewMode === "paid") return invoice.status === "paid";
    return true;
  });

  // Calculate totals
  const pendingInvoices = invoices.filter(i => i.status === "pending" || i.status === "overdue");
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidInvoices = invoices.filter(i => i.status === "paid");
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Patient Invoices</h2>
          <p className="text-gray-600 mt-1">
            {patient?.name || "Select a patient"} • {invoices.length} invoices
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="text-sm">
            <span className="text-gray-600">Pending: </span>
            <span className="font-bold text-red-600">{formatCurrency(totalPending)}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Paid: </span>
            <span className="font-bold text-emerald-600">{formatCurrency(totalPaid)}</span>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setViewMode("all")}
          className={`px-4 py-2 rounded-lg transition ${viewMode === "all" ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          All Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setViewMode("pending")}
          className={`px-4 py-2 rounded-lg transition ${viewMode === "pending" ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Pending ({pendingInvoices.length})
        </button>
        <button
          onClick={() => setViewMode("paid")}
          className={`px-4 py-2 rounded-lg transition ${viewMode === "paid" ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Paid ({paidInvoices.length})
        </button>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-600">No {viewMode} invoices for this patient</p>
          </div>
        ) : (
          filteredInvoices.map(invoice => (
            <div 
              key={invoice.id} 
              className={`p-5 border rounded-xl transition-all hover:shadow-md ${
                invoice.status === "overdue" ? 'border-red-300 bg-red-50/50' :
                invoice.status === "pending" ? 'border-amber-300' :
                'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{invoice.invoiceNumber}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                        <span>Created: {new Date(invoice.createdDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Items */}
                  <div className="mb-4 ml-12">
                    <p className="text-sm text-gray-600 mb-2">Services:</p>
                    <div className="space-y-2">
                      {invoice.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{item.description}</span>
                          <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="flex items-center justify-between ml-12">
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className={`text-xl font-bold ${
                        invoice.status === "overdue" ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {formatCurrency(invoice.amount)}
                      </p>
                      {invoice.paymentMethod && invoice.status === "paid" && (
                        <p className="text-sm text-gray-500 mt-1">
                          Paid via {invoice.paymentMethod} • {new Date(invoice.createdDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => onViewDetails(invoice.id)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Eye className="w-4 h-4" />
                    Details
                  </button>
                  <button
                    onClick={() => onDownload(invoice.id)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  {(invoice.status === "pending" || invoice.status === "overdue") && (
                    <button
                      onClick={() => onProcessPayment(invoice.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                    >
                      <DollarSign className="w-4 h-4" />
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Footer */}
      {filteredInvoices.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Showing {filteredInvoices.length} of {invoices.length} invoices
              {viewMode !== "all" && ` (${viewMode} only)`}
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition">
                <Download className="w-4 h-4" />
                Export All
              </button>
              {pendingInvoices.length > 0 && (
                <button 
                  onClick={() => {
                    // Process all pending payments
                    console.log("Process all pending");
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <ArrowRight className="w-4 h-4" />
                  Pay All Pending ({pendingInvoices.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}