"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, User, Trophy, Ticket, Target } from "lucide-react";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 sm:px-8 py-3 sm:py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-b border-slate-700/50 relative z-20 backdrop-blur-sm w-full">
      {/* Left: Game Info */}
      <div className="flex flex-col gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
          <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent tracking-wide">
            Game ID : <span className="font-mono text-base sm:text-lg">SJ37955</span>
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-slate-300 text-xs sm:text-sm">
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Trophy className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">Last Points:</span>
            <span className="font-mono font-semibold text-white">0pts</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Ticket className="w-4 h-4 text-pink-400" />
            <span className="text-slate-400">Last Ticket:</span>
            <span className="font-mono font-semibold text-white">-</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">Limit:</span>
            <span className="font-mono font-semibold text-white">6000</span>
          </div>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-1 sm:gap-3 mt-3 md:mt-0 w-full md:w-auto justify-end">
        {/* Profile Dropdown */}
        <div ref={dropdownRef} className="relative w-full md:w-auto">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center w-full md:w-auto justify-between md:justify-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl hover:from-pink-500 hover:to-purple-500 transition-all duration-300 focus:outline-none hover:shadow-purple-500/25 hover:scale-105 active:scale-95"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-sm sm:text-base">User</span>
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
            <div className="absolute right-0 mt-2 w-full min-w-[160px] sm:w-52 rounded-2xl shadow-2xl bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-purple-500/50 overflow-hidden animate-fade-in backdrop-blur-md">
              {[{ name: "Reprint", href: "/reprint" }, { name: "Result", href: "/result" }, { name: "Cancel", href: "/cancel" }, { name: "Password", href: "/password" }, { name: "Logout", href: "/" }].map((item, idx) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`block px-4 sm:px-6 py-3 text-slate-200 hover:bg-gradient-to-r hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-200 font-medium border-b border-slate-800/50 last:border-none relative overflow-hidden group ${
                    idx === 5 ? "text-red-400 hover:text-red-300" : "hover:text-white"
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
  );
};

export default Navbar;
