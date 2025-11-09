"use client";
import React from "react";
import {
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TicketCheck,
} from "lucide-react";

export default function TicketStatusModal({ open, onClose, statusData }) {
  if (!open) return null;

  const getStatusInfo = () => {
    if (!statusData)
      return { icon: AlertCircle, color: "text-gray-300", text: "No Data" };

    switch (statusData.status) {
      case "winner":
        return {
          icon: CheckCircle,
          color: "text-green-400",
          text: "🎉 Winning Ticket!",
        };
      case "already_claimed":
        return {
          icon: TicketCheck,
          color: "text-yellow-400",
          text: "⚠️ Ticket Already Claimed",
        };
      case "no_declaration":
        return {
          icon: Clock,
          color: "text-blue-400",
          text: "⏳ Result Not Declared Yet",
        };
      case "no_winning":
        return {
          icon: XCircle,
          color: "text-red-400",
          text: "🚫 Not a Winning Ticket",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-gray-400",
          text: "Unknown Status",
        };
    }
  };

  const { icon: Icon, color, text } = getStatusInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-[420px] p-6 text-white relative">
        {/* ❌ Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4 text-center text-purple-400">
          🎟️ Ticket Status
        </h2>

        {/* Status Icon & Text */}
        <div className="flex flex-col items-center mb-5">
          <Icon size={50} className={`${color} mb-2`} />
          <p className={`text-lg font-bold ${color}`}>{text}</p>
        </div>

        {/* Ticket Info */}
        {statusData && (
          <div className="text-sm space-y-2 border-t border-slate-700 pt-3">
            <div className="flex justify-between">
              <span className="text-gray-400">🎫 Ticket ID:</span>
              <span className="font-semibold">{statusData.ticketId || "-"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">🕓 Draw Time:</span>
              <span>{statusData.drawTime || "-"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">📅 Draw Date:</span>
              <span>{statusData.drawDate || "-"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">💰 Prize Amount:</span>
              <span className="text-emerald-400 font-bold">
                ₹{statusData.prizeAmount || 0}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">📍 Status:</span>
              <span className={`font-semibold ${color}`}>{text}</span>
            </div>

            {statusData.status === "already_claimed" && (
              <div className="mt-3 p-3 bg-yellow-900/30 rounded-md border border-yellow-700/50 text-yellow-300">
                <p className="text-xs font-semibold">
                  Claimed On:{" "}
                  {`${statusData.claimedDate || ""} at ${
                    statusData.claimedTime || ""
                  }`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
