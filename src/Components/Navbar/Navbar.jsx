"use client";

import React, { useEffect, useState } from "react";
import {
  Trophy,
  Ticket,
  Target,
  RefreshCcw,
  List,
  XCircle,
  KeyRound,
  LogOut,
  UserCircle,
} from "lucide-react";
import axios from "axios";

const Navbar = () => {
  const [gameId, setGameId] = useState("-");
  const [lastPoints, setLastPoints] = useState("-");
  const [lastTicket, setLastTicket] = useState("-");
  const [balance, setBalance] = useState("-");

  // 1. Get gameId from JWT
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("userToken");
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload && payload.id) setGameId(payload.id);
        }
      } catch (err) {
        setGameId("-");
      }
    }
  }, []);

  // 2. Fetch last ticket/points info
  useEffect(() => {
    // Only run if gameId is available and not "-"
    if (gameId && gameId !== "-") {
      axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/navbar-details`, { loginId: gameId })
        .then(res => {
          setLastPoints(res.data.lastTotalPoint ?? "-");
          setLastTicket(res.data.lastTicketNumber ?? "-");
          setBalance(res.data.balance ?? "-");
        })
        .catch(() => {
          setLastPoints("-");
          setLastTicket("-");
          setBalance("-");
        });
    }
  }, [gameId]);

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
    <nav className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 sm:px-8 py-3 sm:py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl border-b border-slate-700/50 relative z-20 backdrop-blur-sm w-full">
      {/* Left: Game Info */}
      <div className="flex flex-col gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
          <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent tracking-wide">
            Game ID : <span className="font-mono text-base sm:text-lg">{gameId}</span>
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-slate-300 text-xs sm:text-sm">
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Trophy className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">Last Points:</span>
            <span className="font-mono font-semibold text-white">{lastPoints}pts</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Ticket className="w-4 h-4 text-pink-400" />
            <span className="text-slate-400">Last Ticket:</span>
            <span className="font-mono font-semibold text-white">{lastTicket}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">Limit:</span>
            <span className="font-mono font-semibold text-white">{balance}</span>
          </div>
        </div>
      </div>
      {/* Right: Actions Row */}
      <div className="flex items-center gap-2 sm:gap-3 mt-3 md:mt-0 w-full md:w-auto justify-end">
        <div className="flex items-center gap-1 sm:gap-2">
          {actions.map((action) => (
            <a
              key={action.name}
              href={action.href}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 shadow-xl hover:from-pink-500 hover:to-purple-500 hover:shadow-purple-500/25 transition-all duration-200 text-xs sm:text-sm active:scale-95`}
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
      </div>
    </nav>
  );
};

export default Navbar;
