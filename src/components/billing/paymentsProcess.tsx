"use client";

import { X, DollarSign, CreditCard, Wallet, Banknote, Smartphone, CheckCircle, AlertCircle, Receipt, Printer } from "lucide-react";
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

interface PaymentProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onPaymentProcessed: (payment: any) => void;
}

export function PaymentProcessingModal({ isOpen, onClose, invoice, onPaymentProcessed }: PaymentProcessingModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "wallet" | "card">("cash");
  const [amount, setAmount] = useState(invoice?.amount || 0);
  const [selectedBank, setSelectedBank] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [cashierName, setCashierName] = useState("John Doe");
  const [step, setStep] = useState(1);

  const banks = [
    "Access Bank",
    "First Bank",
    "GTBank",
    "Zenith Bank",
    "UBA",
    "Fidelity Bank",
    "Stanbic IBTC",
    "Ecobank",
    "Union Bank",
    "Wema Bank"
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handlePayment = () => {
    if (amount <= 0 || !invoice) return;

    const payment = {
      id: `pay-${Date.now()}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      patientId: invoice.patientId,
      patientName: invoice.patientName,
      amount: amount,
      paymentMethod,
      bank: paymentMethod === "transfer" ? selectedBank : undefined,
      referenceNumber: paymentMethod === "transfer" ? referenceNumber : `CASH-${Date.now()}`,
      cashierName,
      processedAt: new Date().toISOString(),
      status: "completed" as const
    };

    onPaymentProcessed(payment);
    setStep(3);
  };

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Process Payment</h2>
                <p className="text-gray-600">Invoice: {invoice.invoiceNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Steps */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step >= stepNum ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNum}
                  </div>
                  <span className={`text-xs ${step >= stepNum ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {stepNum === 1 ? 'Method' : stepNum === 2 ? 'Details' : 'Confirm'}
                  </span>
                  {stepNum < 3 && (
                    <div className={`w-8 h-0.5 ${step > stepNum ? 'bg-emerald-600' : 'bg-gray-300'}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Invoice Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Invoice Total</span>
              <span className="text-xl font-bold text-gray-900">{formatCurrency(invoice.amount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Patient</span>
              <span className="font-medium">{invoice.patientName}</span>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900">Select Payment Method</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`p-4 rounded-xl border transition ${
                    paymentMethod === "cash"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Banknote className={`w-6 h-6 ${paymentMethod === "cash" ? "text-emerald-600" : "text-gray-400"}`} />
                    <span className={`font-medium ${paymentMethod === "cash" ? "text-emerald-700" : "text-gray-600"}`}>
                      Cash
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod("transfer")}
                  className={`p-4 rounded-xl border transition ${
                    paymentMethod === "transfer"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <CreditCard className={`w-6 h-6 ${paymentMethod === "transfer" ? "text-blue-600" : "text-gray-400"}`} />
                    <span className={`font-medium ${paymentMethod === "transfer" ? "text-blue-700" : "text-gray-600"}`}>
                      Bank Transfer
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod("wallet")}
                  className={`p-4 rounded-xl border transition ${
                    paymentMethod === "wallet"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Wallet className={`w-6 h-6 ${paymentMethod === "wallet" ? "text-purple-600" : "text-gray-400"}`} />
                    <span className={`font-medium ${paymentMethod === "wallet" ? "text-purple-700" : "text-gray-600"}`}>
                      Patient Wallet
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`p-4 rounded-xl border transition ${
                    paymentMethod === "card"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Smartphone className={`w-6 h-6 ${paymentMethod === "card" ? "text-orange-600" : "text-gray-400"}`} />
                    <span className={`font-medium ${paymentMethod === "card" ? "text-orange-700" : "text-gray-600"}`}>
                      Card Payment
                    </span>
                  </div>
                </button>
              </div>

              {paymentMethod === "wallet" && (
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-purple-700">Patient Wallet Payment</p>
                      <p className="text-sm text-purple-600 mt-1">
                        Patient can pay via their app. This will deduct from their wallet balance.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900">Payment Details</h3>
              
              {/* Amount */}
              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">Amount to Pay</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₦</span>
                  <input
                    type="number"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    max={invoice.amount}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-500">Invoice balance: {formatCurrency(invoice.amount)}</span>
                  <button
                    onClick={() => setAmount(invoice.amount)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Pay Full Amount
                  </button>
                </div>
              </div>

              {/* Cashier Name */}
              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">Cashier/Accountant Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              {/* Bank Details (for transfer) */}
              {paymentMethod === "transfer" && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-900 mb-2 block">Bank Name</label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                    >
                      <option value="">Select Bank</option>
                      {banks.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-900 mb-2 block">Reference/Transaction Number</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Enter transaction reference"
                    />
                  </div>
                </>
              )}

              {paymentMethod === "cash" && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-700">Cash Payment</p>
                      <p className="text-sm text-emerald-600 mt-1">
                        Ensure you collect the exact amount and provide a receipt to the patient.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-600">
                  Payment of {formatCurrency(amount)} has been processed successfully.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Payment Summary</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Invoice Number</span>
                    <span className="font-medium">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Patient</span>
                    <span className="font-medium">{invoice.patientName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium capitalize">{paymentMethod}</span>
                  </div>
                  {paymentMethod === "transfer" && selectedBank && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Bank</span>
                      <span className="font-medium">{selectedBank}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Processed By</span>
                    <span className="font-medium">{cashierName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Date & Time</span>
                    <span className="font-medium">{new Date().toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              className="px-6 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              {step > 1 ? 'Back' : 'Cancel'}
            </button>
            
            <div className="flex items-center gap-4">
              {step < 3 && (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && !paymentMethod) ||
                    (step === 2 && (amount <= 0 || !cashierName || 
                     (paymentMethod === "transfer" && (!selectedBank || !referenceNumber))))
                  }
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {step === 2 ? 'Process Payment' : 'Continue'}
                </button>
              )}
              {step === 3 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      // Print receipt logic
                      console.log("Print receipt");
                    }}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                  >
                    <Printer className="w-4 h-4" />
                    Print Receipt
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}