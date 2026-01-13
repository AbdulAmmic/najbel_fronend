"use client";

import WalletOverview from "@/components/patient/wallet";
import PaymentHistory from "@/components/patient/payhistory";
import BillingSummary from "@/components/patient/billsummary";
import QuickActions from "@/components/patient/quickaction";
import InvoiceList from "@/components/patient/invList";
import { useState, useEffect } from "react";
import { billing as billingApi } from "@/services/api";

export default function PatientWalletPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletData, invoicesData, transactionsData] = await Promise.all([
        billingApi.getWallet(),
        billingApi.getMyInvoices(),
        billingApi.getTransactions(),
      ]);

      setWallet(walletData);
      setInvoices(invoicesData);
      setTransactions(transactionsData);
    } catch (err) {
      console.error("Failed to fetch wallet data", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (invoiceId: number) => {
    try {
      // Default to wallet for now or show a modal to choose
      await billingApi.payInvoice(invoiceId, "wallet");
      fetchData();
      alert("Payment successful!");
    } catch (err: any) {
      console.error("Payment failed", err);
      alert(err.response?.data?.detail || "Payment failed");
    }
  };

  const walletDisplayData = {
    balance: wallet?.balance || 0,
    pendingPayments: invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0),
    lastPayment: transactions.filter(t => t.type === 'payment')[0]?.amount || 0,
    totalSpent: transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0),
    currency: "₦",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500 animate-pulse font-medium">Loading your financial dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Wallet & Billing
        </h1>
        <p className="text-gray-600">
          Manage your payments, view invoices, and track spending
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wallet Overview */}
          <WalletOverview data={walletDisplayData} />

          {/* Payment History */}
          <PaymentHistory transactions={transactions} />

          {/* Invoice List */}
          <InvoiceList invoices={invoices} onPay={handlePay} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Billing Summary */}
          <BillingSummary invoices={invoices} />

          {/* Quick Actions */}
          <QuickActions />
        </div>
      </div>
    </div>
  );
}