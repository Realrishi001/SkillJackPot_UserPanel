"use client";
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, User, Home } from "lucide-react";
import Navbar from "../../Components/Navbar/Navbar";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Page() {
  const [userName, setUserName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [message, setMessage] = useState({ type: "", text: "" });
  const router = useRouter();

  useEffect(() => {
    // Redirect if not logged in
    if (!localStorage.getItem("userToken")) {
      router.push("/");
      return;
    }

    // Decode username from token (JWT)
    try {
      const token = localStorage.getItem("userToken");
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserName(payload?.userName || "");
    } catch (e) {
      console.error("Error decoding token:", e);
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!userName || !oldPassword || !newPassword || !confirm) {
      setMessage({ type: "error", text: "Please fill in all fields." });
      return;
    }
    if (newPassword !== confirm) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "New password must be at least 6 characters long.",
      });
      return;
    }

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/change-password`,
        {
          userName,
          oldPassword,
          newPassword,
        }
      );

      if (res.data.status === "success") {
        setMessage({
          type: "success",
          text: "✅ Password changed successfully!",
        });
        setOldPassword("");
        setNewPassword("");
        setConfirm("");
      } else {
        setMessage({
          type: "error",
          text: res.data.message || "Something went wrong.",
        });
      }
    } catch (err) {
      console.error("Password change error:", err);
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "❌ Failed to change password. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="max-w-7xl mx-auto pt-6 px-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow hover:scale-105 transition-all duration-150 hover:from-blue-700 hover:to-purple-700"
          title="Go to Dashboard"
        >
          <Home className="w-5 h-5" />
          <span className="hidden sm:inline">Home</span>
        </Link>
      </div>

      <div className="flex justify-center items-center min-h-[75vh] px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 border border-purple-600/20"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">
            Change Password
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mb-6"></div>

          {/* Username */}
          <div className="mb-4">
            <label className="text-slate-200 text-sm font-medium flex items-center gap-2 mb-2">
              <User className="w-4 h-4" /> Username
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 text-white border border-slate-600/50 focus:border-pink-500 outline-none transition-all"
              value={userName}
              readOnly
            />
          </div>

          {/* Old Password */}
          <div className="mb-4 relative">
            <label className="text-slate-200 text-sm font-medium flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4" /> Old Password
            </label>
            <input
              type={showOld ? "text" : "password"}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 text-white border border-slate-600/50 focus:border-pink-500 outline-none transition-all pr-12"
              placeholder="Enter old password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowOld((v) => !v)}
              className="absolute right-3 top-9 text-slate-400 hover:text-pink-400 transition"
              tabIndex={-1}
            >
              {showOld ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* New Password */}
          <div className="mb-4 relative">
            <label className="text-slate-200 text-sm font-medium flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4" /> New Password
            </label>
            <input
              type={showNew ? "text" : "password"}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 text-white border border-slate-600/50 focus:border-pink-500 outline-none transition-all pr-12"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-9 text-slate-400 hover:text-pink-400 transition"
              tabIndex={-1}
            >
              {showNew ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="mb-6 relative">
            <label className="text-slate-200 text-sm font-medium flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4" /> Confirm New Password
            </label>
            <input
              type={showConfirm ? "text" : "password"}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/80 text-white border border-slate-600/50 focus:border-pink-500 outline-none transition-all pr-12"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-9 text-slate-400 hover:text-pink-400 transition"
              tabIndex={-1}
            >
              {showConfirm ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Message */}
          {message.text && (
            <div
              className={`mb-4 text-center font-semibold rounded-lg px-4 py-3 ${
                message.type === "success"
                  ? "bg-green-700/30 text-green-400 border border-green-600/20"
                  : "bg-pink-900/30 text-pink-400 border border-pink-600/20"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-xl hover:from-pink-500 hover:to-purple-500 transition-all duration-300 text-lg hover:scale-105 active:scale-95 hover:shadow-purple-500/25"
          >
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
