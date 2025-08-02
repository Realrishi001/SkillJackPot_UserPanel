"use client";

import React from "react";
import {
  RefreshCcw,
  List,
  XCircle,
  KeyRound,
  LogOut,
  UserCircle,
} from "lucide-react";

const Navbar = () => {
  const actions = [
    { name: "Account", href: "/account", icon: <UserCircle className="w-5 h-5" /> },
    { name: "Reprint", href: "/reprint", icon: <RefreshCcw className="w-5 h-5" /> },
    { name: "Result", href: "/result", icon: <List className="w-5 h-5" /> },
    { name: "Cancel", href: "/cancel", icon: <XCircle className="w-5 h-5" /> },
    { name: "Password", href: "/password", icon: <KeyRound className="w-5 h-5" /> },
  ];

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("userToken");
      window.location.href = "/";
    }
  };

  return (
    <nav className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-b border-slate-700/50 relative z-20 backdrop-blur-sm w-full">
      <div className="flex gap-1 sm:gap-2 w-fit mx-auto items-center">
        {actions.map((action) => (
          <a
            key={action.name}
            href={action.href}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-xl hover:from-pink-500 hover:to-purple-500 hover:shadow-purple-500/25 transition-all duration-200 text-xs sm:text-sm active:scale-95"
            style={{ minWidth: 90, justifyContent: "center" }}
          >
            {action.icon}
            <span>{action.name}</span>
          </a>
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md font-bold text-white bg-gradient-to-r from-red-600 to-pink-600 shadow-xl hover:from-pink-700 hover:to-red-500 hover:shadow-red-500/25 transition-all duration-200 text-xs sm:text-sm active:scale-95"
          style={{ minWidth: 90, justifyContent: "center" }}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
