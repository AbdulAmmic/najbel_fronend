"use client";

import { useState } from "react";
import { User, Eye, EyeOff, CreditCard } from "lucide-react";

interface PatientCardProps {
  name: string;
  patientId: string;
  bloodGroup: string;
  balance: string;
}

export default function PatientCard({
  name,
  patientId,
  bloodGroup,
  balance,
}: PatientCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [showBalance, setShowBalance] = useState(false);

  return (
    <div className="w-full max-w-md">
      <div
        onClick={() => setFlipped(!flipped)}
        className={`
          relative h-44 w-full cursor-pointer
          transition-transform duration-500
          ${flipped ? "[transform:rotateY(180deg)]" : ""}
          preserve-3d
        `}
      >
        {/* FRONT */}
        <div className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white p-5">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Patient Card</span>
            <User className="w-5 h-5 opacity-80" />
          </div>

          <div className="mt-6">
            <p className="text-lg font-semibold">{name}</p>
            <p className="text-sm opacity-80 mt-1">{patientId}</p>
          </div>

          <div className="absolute bottom-5 left-5 right-5 flex justify-between text-sm">
            <span>Blood Group</span>
            <span className="font-semibold">{bloodGroup}</span>
          </div>
        </div>

        {/* BACK */}
        <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] rounded-2xl bg-gray-900 text-white p-5">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Wallet Balance</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBalance(!showBalance);
              }}
            >
              {showBalance ? (
                <EyeOff className="w-5 h-5 opacity-80" />
              ) : (
                <Eye className="w-5 h-5 opacity-80" />
              )}
            </button>
          </div>

          <div className="mt-8 text-2xl font-bold">
            {showBalance ? balance : "••••••••"}
          </div>

          <div className="absolute bottom-5 right-5">
            <CreditCard className="w-6 h-6 opacity-70" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
