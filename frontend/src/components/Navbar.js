import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const [currentTime, setCurrentTime] = useState(new Date());

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const time = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const date = currentTime.toLocaleDateString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="h-20 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-6 shadow-lg">

      {/* LEFT */}
      <div className="flex items-center gap-4">

        <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xl">
          🛡️
        </div>

        <div>
          <h1 className="text-lg md:text-xl font-bold">
            Central Control System
          </h1>

          <p className="text-xs text-slate-500 hidden sm:block">
            Smart Wearable Safety Monitoring
          </p>
        </div>

      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3 md:gap-5">

        {/* SYSTEM ONLINE */}
        <div className="hidden md:flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-xl">

          <span className="relative flex h-2.5 w-2.5">

            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>

            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>

          </span>

          <span className="text-xs font-semibold text-green-400">
            SYSTEM ONLINE
          </span>

        </div>

        {/* DATE AND TIME */}
        <div className="hidden lg:block text-right">

          <p className="text-sm font-semibold text-slate-200">
            {time}
          </p>

          <p className="text-xs text-slate-500">
            {date}
          </p>

        </div>

        {/* 🔔 NOTIFICATION */}
        <button
          type="button"
          onClick={() => navigate("/notifications")}
          className="relative w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-cyan-500/40 transition flex items-center justify-center text-lg"
          title="Notifications"
          aria-label="Open Notifications"
        >
          🔔

          {/* Notification indicator */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-800"></span>
        </button>

        {/* ADMIN */}
        <div className="hidden sm:flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">

          <div className="w-9 h-9 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
            A
          </div>

          <div className="leading-tight">

            <p className="text-sm font-bold text-white">
              Admin
            </p>

            <p className="text-[11px] text-slate-500">
              Control Operator
            </p>

          </div>

        </div>

      </div>

    </header>
  );
}

export default Navbar;