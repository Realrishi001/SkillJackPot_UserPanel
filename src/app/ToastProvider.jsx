"use client";
import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        duration: 4000,
        style: {
          background: "rgba(15,23,42,0.95)",
          color: "#f8fafc",
          fontWeight: "600",
          borderRadius: "10px",
          padding: "10px 16px",
          border: "1px solid rgba(148,163,184,0.4)",
          boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
          backdropFilter: "blur(8px)",
        },
        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: "#0f172a",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#0f172a",
          },
        },
      }}
    />
  );
}
