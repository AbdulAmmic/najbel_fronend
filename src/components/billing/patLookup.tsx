"use client";

import { Search, User, Phone, Mail, Calendar, DollarSign, AlertCircle, Eye } from "lucide-react";
import { useState } from "react";

interface PatientLookupProps {
  onPatientSelect: (patient: any) => void;
}

export function PatientLookup({ onPatientSelect }: PatientLookupProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Mock patient data
  const patients = [
    {
      id: "1",
      patientId: "PT-0001",
      name: "Aliyu Bello",
      phone: "+234 801 234 5678",
      email: "aliyu.bello@email.com",
      lastVisit: "2024-03-15",
      totalInvoices: 5,
      pendingAmount: 45000,
      walletBalance: 125000
    },
    {
      id: "2",
      patientId: "PT-0002",
      name: "Fatima Ahmed",
      phone: "+234 802 345 6789",
      email: "fatima.ahmed@email.com",
      lastVisit: "2024-03-18",
      totalInvoices: 3,
      pendingAmount: 0,
      walletBalance: 85000
    },
    {
      id: "3",
      patientId: "PT-0003",
      name: "Chinedu Okoro",
      phone: "+234 803 456 7890",
      email: "chinedu.okoro@email.com",
      lastVisit: "2024-03-10",
      totalInvoices: 2,
      pendingAmount: 75000,
      walletBalance: 25000
    },
    {
      id: "4",
      patientId: "PT-0004",
      name: "Grace Williams",
      phone: "+234 804 567 8901",
      email: "grace.williams@email.com",
      lastVisit: "2024-03-20",
      totalInvoices: 1,
      pendingAmount: 32000,
      walletBalance: 50000
    },
  ];

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const term = searchTerm.toLowerCase();
    
    const results = patients.filter(patient =>
      patient.patientId.toLowerCase().includes(term) ||
      patient.name.toLowerCase().includes(term) ||
      patient.phone.includes(term) ||
      patient.email.toLowerCase().includes(term)
    );

    setSearchResults(results);
    setIsSearching(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const selectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setSearchTerm("");
    setSearchResults([]);
    onPatientSelect(patient);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Patient Lookup</h2>
          <p className="text-gray-600 mt-1">Search patient by ID, name, phone, or email</p>
        </div>
        {selectedPatient && (
          <button
            onClick={() => setSelectedPatient(null)}
            className="text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Enter Patient ID, Name, Phone, or Email..."
            className="w-full pl-12 pr-24 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && !selectedPatient && (
        <div className="mb-6 max-h-64 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Search Results ({searchResults.length})</h3>
          <div className="space-y-3">
            {searchResults.map(patient => (
              <button
                key={patient.id}
                onClick={() => selectPatient(patient)}
                className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-500">{patient.patientId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(patient.pendingAmount)} pending
                    </p>
                    <p className="text-xs text-gray-500">Last visit: {new Date(patient.lastVisit).toLocaleDateString()}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Patient Info */}
      {selectedPatient && (
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
                {selectedPatient.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900">{selectedPatient.name}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {selectedPatient.patientId}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{selectedPatient.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{selectedPatient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Last visit: {new Date(selectedPatient.lastVisit).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition">
              <Eye className="w-4 h-4" />
              Full Profile
            </button>
          </div>

          {/* Patient Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-500">Pending Amount</p>
                  <p className={`text-xl font-bold ${selectedPatient.pendingAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatCurrency(selectedPatient.pendingAmount)}
                  </p>
                </div>
              </div>
              {selectedPatient.pendingAmount > 0 && (
                <div className="flex items-center gap-1 text-xs text-red-600 mt-2">
                  <AlertCircle className="w-3 h-3" />
                  <span>Payment overdue</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-500">Wallet Balance</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(selectedPatient.walletBalance)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Available for payments</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-500">Total Invoices</p>
                  <p className="text-xl font-bold text-gray-900">{selectedPatient.totalInvoices}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">All time transactions</p>
            </div>
          </div>
        </div>
      )}

      {!selectedPatient && searchResults.length === 0 && !isSearching && (
        <div className="text-center py-8 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Enter patient details to search</p>
          <p className="text-sm text-gray-400 mt-1">Search by Patient ID, Name, Phone, or Email</p>
        </div>
      )}

      {isSearching && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Searching...</p>
        </div>
      )}
    </div>
  );
}