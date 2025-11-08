"use client";
import React from "react";
import { X, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function TicketStatusModal({ open, onClose, statusData }) {
  if (!open) return null;

  const getStatusInfo = () => {
    if (!statusData) return { icon: AlertCircle, color: "text-gray-300", text: "No Data" };
    if (statusData.isClaimed)
      return { icon: XCircle, color: "text-yellow-400", text: "Already Claimed" };
    if (statusData.isWinner)
      return { icon: CheckCircle, color: "text-green-400", text: "Winning Ticket!" };
    return { icon: XCircle, color: "text-red-400", text: "Not a Winning Ticket" };
  };

  const { icon: Icon, color, text } = getStatusInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-[400px] p-6 text-white relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-bold mb-4 text-center">
          🎟️ Ticket Status
        </h2>

        {/* Status Display */}
        <div className="flex flex-col items-center mb-4">
          <Icon size={50} className={`${color} mb-2`} />
          <p className={`text-lg font-bold ${color}`}>{text}</p>
        </div>

        {/* Details */}
        {statusData && (
          <div className="text-sm space-y-2 border-t border-slate-700 pt-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Ticket No:</span>
              <span className="font-semibold">{statusData.ticketNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Draw Time:</span>
              <span>{statusData.drawTime || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Prize:</span>
              <span className="text-emerald-400 font-bold">
                ₹{statusData.prizeAmount || 0}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
