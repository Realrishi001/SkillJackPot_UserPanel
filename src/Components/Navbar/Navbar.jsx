"use client"

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, User, Trophy, Ticket, Target, Bell } from "lucide-react";
import ShowResult from "../ShowResult/ShowResult";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef();
  const notifRef = useRef();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Close dropdowns if clicked outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div>
      <nav className="flex items-center justify-between px-8 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-b border-slate-700/50 relative z-20 backdrop-blur-sm">
      {/* Left: Game Info */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent tracking-wide">
            Game ID : <span className="font-mono text-lg">SJ37955</span>
          </h1>
        </div>
        <div className="flex flex-row gap-6 text-slate-300 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Trophy className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">Last Points:</span>
            <span className="font-mono font-semibold text-white">0pts</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Ticket className="w-4 h-4 text-pink-400" />
            <span className="text-slate-400">Last Ticket:</span>
            <span className="font-mono font-semibold text-white">-</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">Limit:</span>
            <span className="font-mono font-semibold text-white">6000</span>
          </div>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Show Result Button */}
<button
  className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl hover:from-pink-500 hover:to-purple-500 transition-all duration-200 focus:outline-none hover:shadow-purple-500/25 hover:scale-105 active:scale-95 font-semibold text-base"
  style={{ minWidth: 140 }}
  onClick={openModal}
>
  Show Result
</button>


        {/* Profile Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl hover:from-pink-500 hover:to-purple-500 transition-all duration-300 focus:outline-none hover:shadow-purple-500/25 hover:scale-105 active:scale-95"
          >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-base">User</span>
            <div className="transition-transform duration-200">
              {dropdownOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-52 rounded-2xl shadow-2xl bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-purple-500/50 overflow-hidden animate-fade-in backdrop-blur-md">
              {[
                { name: "Reprint", href: "/reprint" },
                { name: "Result", href: "/result" },
                { name: "Cancel", href: "/cancel" },
                { name: "Password", href: "/password" },
                { name: "Logout", href: "/" },
              ].map((item, idx) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`block px-6 py-4 text-slate-200 hover:bg-gradient-to-r hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-200 font-medium border-b border-slate-800/50 last:border-none relative overflow-hidden group ${
                    idx === 5
                      ? "text-red-400 hover:text-red-300"
                      : "hover:text-white"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <span className="relative z-10">{item.name}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Animation for dropdowns */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(-12px) scale(0.95);
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </nav>

    <ShowResult isOpen={isModalOpen} isClose={closeModal}/>
    </div>
  );
};

export default Navbar;
