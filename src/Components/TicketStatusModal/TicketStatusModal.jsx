"use client";
import React, { useEffect } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TicketCheck,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function TicketStatusModal({ open, onClose, statusData }) {
  if (!open) return null;

  // 🎉 Confetti when Winning Ticket
  useEffect(() => {
    if (statusData?.status === "winner") {
      const duration = 2500;
      const end = Date.now() + duration;
      (function frame() {
        confetti({
          particleCount: 6,
          startVelocity: 25,
          spread: 80,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 6,
          startVelocity: 25,
          spread: 80,
          origin: { x: 1 },
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
  }, [statusData]);

  const getStatusInfo = () => {
    if (!statusData)
      return {
        icon: AlertCircle,
        color: "text-gray-300",
        title: "No Data",
        message: "No information available for this ticket.",
      };

    switch (statusData.status) {
      case "winner":
        return {
          icon: CheckCircle,
          color: "text-green-400",
          title: "🎉 Winning Ticket!",
          message: `Congratulations! You’ve won ₹${statusData.prizeAmount || 0}.`,
        };
      case "already_claimed":
        return {
          icon: TicketCheck,
          color: "text-yellow-400",
          title: "⚠️ Ticket Already Claimed",
          message:
            "This winning ticket has already been claimed. You cannot claim it again.",
        };
      case "no_declaration":
        return {
          icon: XCircle,
          color: "text-red-400",
          title: "🚫 Not a Winning Ticket",
          message:
            "This ticket has no matching winning numbers. Better luck next time!",
        };
      case "no_winning":
        return {
          icon: XCircle,
          color: "text-red-400",
          title: "🚫 Not a Winning Ticket",
          message:
            "This ticket has no matching winning numbers. Better luck next time!",
        };
      case "error":
        return {
          icon: XCircle,
          color: "text-red-400",
          title: "❌ Invalid Ticket",
          message: "The ticket ID entered is invalid or not found.",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-gray-400",
          title: "Unknown Status",
          message: "Unable to determine ticket status.",
        };
    }
  };

  const { icon: Icon, color, title, message } = getStatusInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-[420px] p-6 text-white relative transition-all scale-100 hover:scale-[1.01] duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-4 text-center text-purple-400">
          🎟️ Ticket Status
        </h2>

        {/* Status Icon & Message */}
        <div className="flex flex-col items-center mb-5 text-center">
          <Icon size={60} className={`${color} mb-2`} />
          <p className={`text-lg font-bold ${color}`}>{title}</p>
          <p className="text-sm text-gray-300 mt-1 px-4">{message}</p>
        </div>

        {/* Ticket Info */}
        {statusData && (
          <div className="text-sm space-y-2 border-t border-slate-700 pt-3">
            <div className="flex justify-between">
              <span className="text-gray-400">🎫 Ticket ID:</span>
              <span className="font-semibold">
                {statusData.ticketId || "-"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">🕓 Draw Time:</span>
              <span>{statusData.drawTime || "-"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">📅 Draw Date:</span>
              <span>{statusData.drawDate || "-"}</span>
            </div>

            {statusData.prizeAmount && statusData.prizeAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">💰 Prize Amount:</span>
                <span className="text-emerald-400 font-bold">
                  ₹{statusData.prizeAmount}
                </span>
              </div>
            )}

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

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
