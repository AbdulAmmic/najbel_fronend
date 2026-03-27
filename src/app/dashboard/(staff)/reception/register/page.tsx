"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Save, ArrowLeft, Calendar, User, Phone, MapPin, Heart } from "lucide-react";
import { auth } from "@/services/api"; // Using auth.register as per earlier findings
import Link from "next/link";
import BookAppointmentModal from "@/components/reception/BookAppointmentModal";

export default function RegisterPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    phone: "",
    address: "",
    emergency_contact: "",
    blood_group: "", // Optional
    email: "", // Optional, but usually good for unique user creation
    password: "DefaultPassword123!" // Temporary default, should be handled better in real app
  });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [createdPatient, setCreatedPatient] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Construct payload matching the expected API format
      // Based on auth.register(userData)
      const payload = {
        email: formData.email || `patient_${Date.now()}@najbel.com`, // Generate dummy email if missing
        password: formData.password,
        full_name: formData.full_name,
        role: "patient",
        phone_number: formData.phone,
        address: formData.address,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        blood_group: formData.blood_group,
        emergency_contact: formData.emergency_contact
      };

      const response = await auth.register(payload);
      setCreatedPatient(response); // Assuming response contains the created user/patient object

      // Show success and offer booking
      // Ideally we'd show a success toast here
      setShowBookingModal(true);

    } catch (error: any) {
      console.error("Registration failed", error);
      const msg = error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message || "Unknown error";
      alert(`Registration failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/reception" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Register New Patient</h1>
          <p className="text-gray-500">Create a new patient record</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
              <User className="w-5 h-5 text-blue-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input
                  name="full_name" required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g. John Doe"
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  name="date_of_birth" type="date" required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Gender</label>
                <select
                  name="gender" required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  onChange={handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Blood Group</label>
                <select
                  name="blood_group"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  onChange={handleChange}
                >
                  <option value="">Select (Optional)</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
              <Phone className="w-5 h-5 text-blue-600" />
              Contact Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  name="phone" required type="tel"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="+1 234 567 890"
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address (Optional)</label>
                <input
                  name="email" type="email"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="patient@example.com"
                  onChange={handleChange}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-700">Address</label>
                <input
                  name="address" required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Full residential address"
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
              <Heart className="w-5 h-5 text-red-600" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Emergency Contact Name & Phone</label>
                <input
                  name="emergency_contact" required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g. Jane Doe (Wife) - +1 234..."
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
            <Link href="/dashboard/reception" className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>Processing...</>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Register Patient
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {showBookingModal && (
        <BookAppointmentModal
          onClose={() => {
            setShowBookingModal(false);
            router.push('/dashboard/reception');
          }}
          onSuccess={() => {
            setShowBookingModal(false);
            router.push('/dashboard/reception');
          }}
          initialPatient={createdPatient}
        />
      )}
    </div>
  );
}
