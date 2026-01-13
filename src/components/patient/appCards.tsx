"use client";

import {
  Calendar,
  Clock,
  Video,
  MapPin,
  MoreVertical,
  ChevronRight,
  Phone,
  Download,
  Share2,
  User,
  Stethoscope,
  XCircle,
  CheckCircle,
  MessageSquare,
  MessageCircle
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AppointmentCard({ appointment }: any) {
  const [showActions, setShowActions] = useState(false);

  const statusConfig: any = {
    confirmed: {
      color: "from-green-500 to-emerald-600",
      bg: "bg-gradient-to-r from-green-50 to-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      label: "Confirmed",
    },
    pending: {
      color: "from-amber-500 to-orange-600",
      bg: "bg-gradient-to-r from-amber-50 to-orange-50",
      border: "border-amber-200",
      text: "text-amber-700",
      label: "Pending",
    },
    completed: {
      color: "from-blue-500 to-blue-600",
      bg: "bg-gradient-to-r from-blue-50 to-blue-100/50",
      border: "border-blue-200",
      text: "text-blue-700",
      label: "Completed",
    },
    cancelled: {
      color: "from-red-500 to-orange-600",
      bg: "bg-gradient-to-r from-red-50 to-orange-50",
      border: "border-red-200",
      text: "text-red-700",
      label: "Cancelled",
    },
  };

  const typeConfig: any = {
    video: {
      icon: Video,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      label: "Video Consult",
    },
    clinic: {
      icon: MapPin,
      color: "bg-gradient-to-br from-blue-500 to-cyan-600",
      label: "Clinic Visit",
    },
    emergency: {
      icon: Phone,
      color: "bg-gradient-to-br from-red-500 to-orange-600",
      label: "Emergency",
    },
  };

  const status = statusConfig[appointment.status];
  const type = typeConfig[appointment.type];
  const TypeIcon = type.icon;

  return (
    <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden">

      {/* Header with status */}
      <div className={`px-6 py-4 ${status.bg} ${status.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${status.color}`}></div>
            <span className={`font-semibold text-sm ${status.text}`}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${type.color} text-white`}>
              {type.label}
            </span>
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-lg hover:bg-white/50 transition"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6">
          {/* Doctor Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
              <img
                src={appointment.doctorAvatar}
                alt={appointment.doctor}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <TypeIcon className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Doctor Info */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {appointment.doctor}
            </h3>
            <p className="text-gray-600 flex items-center gap-2 mb-3">
              <Stethoscope className="w-4 h-4" />
              {appointment.specialty}
            </p>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg">
                {appointment.duration}
              </span>
              <span className="text-sm text-gray-500">
                ID: APPT-{appointment.id.toString().padStart(4, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/30 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-bold text-gray-900">{appointment.date}</p>
                <p className="text-sm text-gray-700">{appointment.time}</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/30 border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-bold text-gray-900">{status.label}</p>
                <p className="text-sm text-gray-700">{appointment.notes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/30 border border-gray-200">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">Notes: </span>
              {appointment.notes}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {appointment.status === "confirmed" && (
            <>
              <button
                onClick={() => appointment.meetingLink && window.open(appointment.meetingLink, '_blank')}
                disabled={!appointment.meetingLink}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow ${!appointment.meetingLink ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Video className="w-5 h-5" />
                Join Call
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-blue-400 hover:bg-blue-50 transition">
                <Calendar className="w-5 h-5" />
                Reschedule
              </button>
            </>
          )}

          {appointment.status === "pending" && (
            <>
              <Link
                href="/dashboard/patient/messages"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow"
              >
                <MessageSquare className="w-5 h-5" />
                Chat with Doctor
              </Link>
              <button
                onClick={() => window.open('https://wa.me/2340000000000', '_blank')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-emerald-300 text-emerald-600 rounded-xl font-semibold hover:border-emerald-400 hover:bg-emerald-50 transition"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </button>
            </>
          )}

          {appointment.status === "completed" && (
            <>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-blue-400 hover:bg-blue-50 transition">
                <Download className="w-5 h-5" />
                Download Report
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-blue-400 hover:bg-blue-50 transition">
                <Share2 className="w-5 h-5" />
                Share Results
              </button>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-transparent">
        <button className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-semibold group">
          View Full Details
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}