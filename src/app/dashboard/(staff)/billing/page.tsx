"use client";

import Header from "@/components/Layouts/header";
import Sidebar from "@/components/Layouts/sidebar";
import { useState, useEffect } from "react";
import {
  DollarSign,
  Users,
  FileText,
  Download,
  Printer,
  Plus,
  TrendingUp,
  BarChart3,
  Bell,
  Calendar,
  RefreshCw,
  User,
  Wallet,
  Receipt
} from "lucide-react";

import { billing as billingApi } from "@/services/api";

// Import components
import { PaymentStats } from "@/components/billing/stats";
import { InvoiceFilters } from "@/components/billing/filters";
import { PaymentProcessingModal } from "@/components/billing/paymentsProcess";
import { CustomerWalletComponent } from "@/components/billing/wallet";
import { PatientLookup } from "@/components/billing/patLookup";
import { PatientInvoices } from "@/components/billing/invoiceCard";
import { TransactionHistory } from "@/components/billing/transactHistory";

// Type definitions
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

interface Customer {
  id: string;
  patientId: string;
  name: string;
  phone: string;
  email: string;
  lastVisit: string;
  totalInvoices: number;
  pendingAmount: number;
  walletBalance: number;
}

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Customer | null>(null);
  const [viewMode, setViewMode] = useState<"dashboard" | "patient" | "wallet">("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await billingApi.getInvoices();
      const mappedInvoices = data.map((inv: any) => ({
        id: inv.id.toString(),
        invoiceNumber: inv.invoice_number,
        patientId: inv.patient_id.toString(),
        patientName: inv.patient?.user?.full_name || "Unknown Patient",
        amount: inv.amount,
        dueDate: inv.due_date,
        status: inv.status,
        createdDate: inv.created_at,
        items: inv.items || []
      }));
      setInvoices(mappedInvoices);
      setFilteredInvoices(mappedInvoices);

      const txData = await billingApi.getTransactions();
      setTransactions(txData.map((tx: any) => ({
        id: tx.id.toString(),
        date: tx.created_at,
        invoiceNumber: tx.invoice?.invoice_number || "-",
        description: tx.type === 'topup' ? "Wallet Top-up" : `Payment for ${tx.invoice?.invoice_number || 'Services'}`,
        type: tx.type,
        amount: tx.amount,
        paymentMethod: tx.payment_method,
        status: tx.status,
        reference: tx.reference,
        cashierName: tx.cashier_name
      })));
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalRevenue: invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.amount, 0),
    pendingAmount: invoices.filter(i => i.status === "pending" || i.status === "overdue").reduce((sum, i) => sum + i.amount, 0),
    collectedToday: 125000,
    walletTransactions: transactions.filter(t => t.type === "topup").length,
    cashPayments: transactions.filter(t => t.paymentMethod === "cash").reduce((sum, t) => sum + t.amount, 0),
    transferPayments: transactions.filter(t => t.paymentMethod === "transfer").reduce((sum, t) => sum + t.amount, 0),
    cardPayments: 30000
  };

  const handleFilterChange = (filters: any) => {
    let filtered = [...invoices];
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
        invoice.patientName.toLowerCase().includes(searchTerm)
      );
    }
    if (filters.status !== "all") {
      filtered = filtered.filter(invoice => invoice.status === filters.status);
    }
    setFilteredInvoices(filtered);
  };

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    setViewMode("patient");
    const patientInvoices = invoices.filter(inv => inv.patientId === patient.patientId);
    setFilteredInvoices(patientInvoices);
  };

  const handleProcessPayment = (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (invoice) {
      setSelectedInvoice(invoice);
      setIsPaymentModalOpen(true);
    }
  };

  const handlePaymentProcessed = async (payment: any) => {
    try {
      await billingApi.payInvoice(parseInt(payment.invoiceId), payment.paymentMethod);
      setIsPaymentModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to process payment", err);
      alert("Error processing payment");
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    alert(`Downloading invoice: ${invoiceId}`);
  };

  const handleViewInvoiceDetails = (invoiceId: string) => {
    alert(`Viewing details for invoice: ${invoiceId}`);
  };

  return (
    <div className="max-w-[1800px] mx-auto">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finance & Billing</h1>
            <p className="text-gray-600 mt-2">Manage payments and financial transactions</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition">
              <Plus className="w-5 h-5" /> New Invoice
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-500">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Total outstanding: ₦{stats.pendingAmount.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            <button onClick={() => setViewMode("dashboard")} className={`px-4 py-2 rounded-lg transition ${viewMode === "dashboard" ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>Dashboard</button>
            <button onClick={() => setViewMode("patient")} className={`px-4 py-2 rounded-lg transition ${viewMode === "patient" ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>Patient View</button>
            <button onClick={() => setViewMode("wallet")} className={`px-4 py-2 rounded-lg transition ${viewMode === "wallet" ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>Wallet Management</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500">Loading financial data...</div>
      ) : viewMode === "dashboard" ? (
        <>
          <PaymentStats stats={stats} />
          <div className="mb-8"><PatientLookup onPatientSelect={handlePatientSelect} /></div>
          <InvoiceFilters onFilterChange={handleFilterChange} />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInvoices.map((invoice) => (
              <PatientInvoices
                key={invoice.id}
                patient={null}
                invoices={[invoice]}
                onProcessPayment={handleProcessPayment}
                onViewDetails={handleViewInvoiceDetails}
                onDownload={handleDownloadInvoice}
              />
            ))}
          </div>
        </>
      ) : viewMode === "patient" && selectedPatient ? (
        <div className="space-y-8">
          <PatientLookup onPatientSelect={handlePatientSelect} />
          <PatientInvoices
            patient={selectedPatient}
            invoices={filteredInvoices}
            onProcessPayment={handleProcessPayment}
            onViewDetails={handleViewInvoiceDetails}
            onDownload={handleDownloadInvoice}
          />
          <TransactionHistory patient={selectedPatient} transactions={transactions} />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Wallet View */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
            <p className="text-gray-500">Select a patient to manage their wallet.</p>
          </div>
        </div>
      )}

      <PaymentProcessingModal
        isOpen={isPaymentModalOpen}
        onClose={() => { setIsPaymentModalOpen(false); setSelectedInvoice(null); }}
        invoice={selectedInvoice}
        onPaymentProcessed={handlePaymentProcessed}
      />
    </div>
  );
}
