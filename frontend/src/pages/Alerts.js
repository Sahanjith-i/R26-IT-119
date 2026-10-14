import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import io from "socket.io-client";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000";

function Alerts() {
  const [miners, setMiners] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMiners = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/miners`);

      setMiners(Array.isArray(res.data) ? res.data : []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load miners:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMiners();
  }, [fetchMiners]);

  useEffect(() => {
    const socket = io(API_URL);

    socket.on("connect", () => {
      console.log("Alert monitoring connected");
    });

    socket.on("dataUpdate", (data) => {
      if (!data) return;

      setMiners((current) => {
        const id = data.userId || data._id;

        const exists = current.some(
          (miner) =>
            (miner.userId || miner._id) === id
        );

        if (exists) {
          return current.map((miner) =>
            (miner.userId || miner._id) === id
              ? { ...miner, ...data }
              : miner
          );
        }

        return [...current, data];
      });

      setLastUpdated(new Date());
    });

    socket.on("disconnect", () => {
      console.log("Alert monitoring disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // =====================================================
  // GET ALERT TYPE
  // =====================================================

  const getAlertType = (miner) => {
    if (
      miner.sosAlert === true ||
      miner.sos === true ||
      miner.emergency === true
    ) {
      return "SOS";
    }

    const status = String(
      miner.status || ""
    ).toUpperCase();

    if (
      status === "DANGER" ||
      status === "CRITICAL"
    ) {
      return "DANGER";
    }

    if (status === "WARNING") {
      return "WARNING";
    }

    return "SAFE";
  };

  // =====================================================
  // ACTIVE ALERTS
  // =====================================================

  const alerts = useMemo(() => {
    return miners
      .map((miner) => ({
        ...miner,
        alertType: getAlertType(miner),
      }))
      .filter(
        (miner) =>
          miner.alertType !== "SAFE"
      );
  }, [miners]);

  // =====================================================
  // COUNTS
  // =====================================================

  const warningCount = alerts.filter(
    (item) => item.alertType === "WARNING"
  ).length;

  const dangerCount = alerts.filter(
    (item) => item.alertType === "DANGER"
  ).length;

  const sosCount = alerts.filter(
    (item) => item.alertType === "SOS"
  ).length;

  // =====================================================
  // FILTER
  // =====================================================

  const filteredAlerts = alerts.filter(
    (alert) => {
      const matchesFilter =
        filter === "ALL" ||
        alert.alertType === filter;

      const text =
        `${alert.fullName || ""} ${
          alert.userId || ""
        }`.toLowerCase();

      const matchesSearch =
        text.includes(search.toLowerCase());

      return (
        matchesFilter &&
        matchesSearch
      );
    }
  );

  // =====================================================
  // ALERT STYLE
  // =====================================================

  const getAlertStyle = (type) => {
    if (type === "SOS") {
      return {
        icon: "🚨",
        title: "SOS EMERGENCY",
        text: "text-red-400",
        border: "border-red-500/40",
        background: "bg-red-500/5",
        badge:
          "bg-red-500/10 text-red-400 border-red-500/30",
      };
    }

    if (type === "DANGER") {
      return {
        icon: "🔴",
        title: "CRITICAL DANGER",
        text: "text-red-400",
        border: "border-red-500/30",
        background: "bg-red-500/5",
        badge:
          "bg-red-500/10 text-red-400 border-red-500/30",
      };
    }

    return {
      icon: "⚠️",
      title: "WARNING",
      text: "text-yellow-400",
      border: "border-yellow-500/30",
      background: "bg-yellow-500/5",
      badge:
        "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    };
  };

  // =====================================================
  // SENSOR DATA
  // =====================================================

  const getSensorData = (miner) => {
    const data = [];

    if (
      miner.heartRate !== undefined &&
      miner.heartRate !== null
    ) {
      data.push(
        `❤️ ${miner.heartRate} BPM`
      );
    }

    if (
      miner.bpm !== undefined &&
      miner.bpm !== null
    ) {
      data.push(
        `❤️ ${miner.bpm} BPM`
      );
    }

    if (
      miner.temperature !== undefined &&
      miner.temperature !== null
    ) {
      data.push(
        `🌡 ${miner.temperature}°C`
      );
    }

    if (
      miner.spo2 !== undefined &&
      miner.spo2 !== null
    ) {
      data.push(
        `🩸 SpO₂ ${miner.spo2}%`
      );
    }

    if (
      miner.co2 !== undefined &&
      miner.co2 !== null
    ) {
      data.push(
        `🌫 CO₂ ${miner.co2} ppm`
      );
    }

    if (
      miner.gasLevel !== undefined &&
      miner.gasLevel !== null
    ) {
      data.push(
        `🧪 Gas ${miner.gasLevel}`
      );
    }

    return data;
  };

  const updateTime = lastUpdated
    ? lastUpdated.toLocaleTimeString()
    : "--";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <div className="ml-60">
        <Navbar />

        <main className="p-6 lg:p-8">

          {/* HEADER */}

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">

            <div>
              <div className="flex items-center gap-3 mb-3">

                <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                  EMERGENCY MANAGEMENT
                </span>

                <span className="flex items-center gap-2 text-xs text-green-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  LIVE MONITORING
                </span>

              </div>

              <h1 className="text-3xl lg:text-4xl font-bold">
                Alert Management
              </h1>

              <p className="text-slate-500 mt-2">
                Central monitoring of emergency,
                danger and warning conditions from
                Smart Miner Safety Jackets.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3">
              <p className="text-[10px] text-slate-600 uppercase font-bold">
                Last Data Update
              </p>

              <p className="text-sm text-slate-300 font-semibold mt-1">
                {updateTime}
              </p>
            </div>

          </div>

          {/* SUMMARY */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-xs text-slate-500 uppercase font-bold">
                Active Alerts
              </p>

              <p className="text-3xl font-bold mt-3">
                {alerts.length}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFilter("WARNING")}
              className="text-left bg-slate-900 border border-yellow-500/20 hover:border-yellow-500/50 rounded-2xl p-5 transition"
            >
              <p className="text-xs text-yellow-500 uppercase font-bold">
                Warnings
              </p>

              <p className="text-3xl font-bold text-yellow-400 mt-3">
                {warningCount}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFilter("DANGER")}
              className="text-left bg-slate-900 border border-red-500/20 hover:border-red-500/50 rounded-2xl p-5 transition"
            >
              <p className="text-xs text-red-500 uppercase font-bold">
                Danger
              </p>

              <p className="text-3xl font-bold text-red-400 mt-3">
                {dangerCount}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFilter("SOS")}
              className="text-left bg-slate-900 border border-red-500/30 hover:border-red-500/70 rounded-2xl p-5 transition"
            >
              <p className="text-xs text-red-400 uppercase font-bold">
                Active SOS
              </p>

              <p className="text-3xl font-bold text-red-400 mt-3">
                {sosCount}
              </p>
            </button>

          </div>

          {/* FILTER BAR */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

              <div className="flex flex-wrap gap-2">

                {[
                  "ALL",
                  "SOS",
                  "DANGER",
                  "WARNING",
                ].map((item) => (

                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={
                      filter === item
                        ? "px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                        : "px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
                    }
                  >
                    {item === "ALL"
                      ? "All Alerts"
                      : item}
                  </button>

                ))}

              </div>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search miner..."
                className="w-full lg:w-80 bg-slate-800 border border-slate-700 focus:border-cyan-500 rounded-xl py-3 px-4 outline-none text-sm"
              />

            </div>

          </div>

          {/* CONTENT */}

          {loading ? (

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">

              <div className="w-10 h-10 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>

              <p className="text-slate-400">
                Loading alert information...
              </p>

            </div>

          ) : filteredAlerts.length === 0 ? (

            <div className="bg-slate-900 border border-green-500/20 rounded-2xl p-16 text-center">

              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-3xl mx-auto mb-5">
                ✓
              </div>

              <h2 className="text-xl font-bold text-green-400">
                No Active Alerts
              </h2>

              <p className="text-slate-500 mt-2">
                All monitored miners are currently
                operating without active alerts.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {filteredAlerts.map((miner) => {

                const style =
                  getAlertStyle(
                    miner.alertType
                  );

                const sensorData =
                  getSensorData(miner);

                const minerId =
                  miner.userId ||
                  miner._id;

                return (

                  <div
                    key={minerId}
                    className={`border rounded-2xl overflow-hidden ${style.border} ${style.background}`}
                  >

                    <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                      <div className="flex items-start gap-4">

                        <div className="w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center text-2xl">
                          {style.icon}
                        </div>

                        <div>

                          <div className="flex flex-wrap items-center gap-3">

                            <h2 className={`text-lg font-bold ${style.text}`}>
                              {style.title}
                            </h2>

                            <span className={`px-3 py-1 rounded-full border text-[10px] font-bold ${style.badge}`}>
                              {miner.alertType}
                            </span>

                          </div>

                          <p className="text-sm text-slate-500 mt-1">
                            {miner.fullName ||
                              "Registered Miner"}
                          </p>

                          <p className="text-xs text-slate-600 mt-1">
                            Miner ID:{" "}
                            {minerId}
                          </p>

                        </div>

                      </div>

                      {miner.alertType === "SOS" && (
                        <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold animate-pulse">
                          🚨 IMMEDIATE ACTION REQUIRED
                        </div>
                      )}

                    </div>

                    <div className="border-t border-slate-800 px-5 py-4 bg-slate-950/30">

                      <p className="text-[10px] text-slate-600 uppercase font-bold mb-3">
                        Sensor Information
                      </p>

                      <div className="flex flex-wrap gap-2">

                        {sensorData.length > 0 ? (

                          sensorData.map(
                            (item, index) => (

                              <span
                                key={index}
                                className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300"
                              >
                                {item}
                              </span>

                            )
                          )

                        ) : (

                          <span className="text-xs text-slate-600">
                            No sensor values available
                          </span>

                        )}

                      </div>

                      <div className="flex flex-wrap gap-3 mt-4">

                        <a
                          href={`/miner/${minerId}`}
                          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold transition"
                        >
                          View Miner
                        </a>

                        <a
                          href={`/map/${minerId}`}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold transition"
                        >
                          📍 View Location
                        </a>

                      </div>

                    </div>

                  </div>

                );
              })}

            </div>

          )}

          {/* FOOTER STATUS */}

          <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-5">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>
                <p className="text-sm font-bold">
                  Central Control & Alert Management
                </p>

                <p className="text-xs text-slate-600 mt-1">
                  Smart Miner Safety Jacket • ESP32 • LoRa
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-green-400 font-semibold">

                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>

                REAL-TIME MONITORING ACTIVE

              </div>

            </div>

          </div>

        </main>
      </div>
    </div>
  );
}

export default Alerts;