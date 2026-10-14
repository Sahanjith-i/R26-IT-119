import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Miners() {
  const [miners, setMiners] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH MINERS
  // =====================================================

  const fetchMiners = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/miners"
      );

      setMiners(Array.isArray(res.data) ? res.data : []);
      setError("");

    } catch (err) {
      console.error("Failed to load miners:", err);
      setError("Unable to connect to Central Control Server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    fetchMiners();

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      fetchMiners();
    }, 5000);

    return () => clearInterval(interval);

  }, []);


  // =====================================================
  // STATUS HELPERS
  // =====================================================

  const getStatusClass = (status) => {

    switch (status) {

      case "DANGER":
        return "bg-red-500/15 border-red-500 text-red-400";

      case "WARNING":
        return "bg-yellow-500/15 border-yellow-500 text-yellow-400";

      default:
        return "bg-green-500/15 border-green-500 text-green-400";

    }
  };


  const getStatusDot = (status) => {

    switch (status) {

      case "DANGER":
        return "bg-red-500";

      case "WARNING":
        return "bg-yellow-400";

      default:
        return "bg-green-400";

    }
  };


  // =====================================================
  // SENSOR STATUS
  // =====================================================

  const getSensorStatus = (value) => {

    if (
      value === null ||
      value === undefined ||
      value === 0
    ) {
      return "Offline";
    }

    return "Online";
  };


  // =====================================================
  // FILTER MINERS
  // =====================================================

  const filteredMiners = miners.filter((miner) => {

    const searchValue = search.toLowerCase();

    return (
      miner.userId?.toLowerCase().includes(searchValue) ||
      miner.fullName?.toLowerCase().includes(searchValue) ||
      miner.nic?.toLowerCase().includes(searchValue)
    );

  });


  // =====================================================
  // COUNTS
  // =====================================================

  const totalMiners = miners.length;

  const safeMiners = miners.filter(
    (m) => m.status === "SAFE"
  ).length;

  const warningMiners = miners.filter(
    (m) => m.status === "WARNING"
  ).length;

  const dangerMiners = miners.filter(
    (m) => m.status === "DANGER"
  ).length;

  const sosMiners = miners.filter(
    (m) => m.sosAlert === true
  ).length;


  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="flex min-h-screen bg-slate-950 text-white">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Sidebar />


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="ml-60 w-full">

        <Navbar />


        <main className="p-6">


          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

            <div>

              <p className="text-cyan-400 text-sm font-semibold tracking-wider uppercase">
                Central Control System
              </p>

              <h1 className="text-3xl md:text-4xl font-bold mt-1">
                Miner Management
              </h1>

              <p className="text-slate-400 mt-2">
                Monitor and manage miners connected to the
                Smart Safety Jacket.
              </p>

            </div>


            {/* LIVE STATUS */}

            <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 px-5 py-3 rounded-xl">

              <span className="relative flex h-3 w-3">

                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>

                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>

              </span>

              <span className="text-sm font-semibold text-green-400">
                SYSTEM ONLINE
              </span>

            </div>

          </div>


          {/* =================================================
              SUMMARY CARDS
          ================================================= */}

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">


            {/* TOTAL */}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

              <p className="text-slate-400 text-sm">
                Total Miners
              </p>

              <h2 className="text-3xl font-bold mt-2">
                {totalMiners}
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Registered miners
              </p>

            </div>


            {/* SAFE */}

            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5">

              <p className="text-green-400 text-sm">
                Safe
              </p>

              <h2 className="text-3xl font-bold text-green-400 mt-2">
                {safeMiners}
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Normal condition
              </p>

            </div>


            {/* WARNING */}

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">

              <p className="text-yellow-400 text-sm">
                Warning
              </p>

              <h2 className="text-3xl font-bold text-yellow-400 mt-2">
                {warningMiners}
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Needs attention
              </p>

            </div>


            {/* DANGER */}

            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">

              <p className="text-red-400 text-sm">
                Danger
              </p>

              <h2 className="text-3xl font-bold text-red-400 mt-2">
                {dangerMiners}
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Critical condition
              </p>

            </div>


            {/* SOS */}

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5">

              <p className="text-orange-400 text-sm">
                Active SOS
              </p>

              <h2 className="text-3xl font-bold text-orange-400 mt-2">
                {sosMiners}
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Emergency alerts
              </p>

            </div>

          </div>


          {/* =================================================
              SEARCH BAR
          ================================================= */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">

            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">

              <div className="relative flex-1">

                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  🔍
                </span>

                <input
                  type="text"
                  placeholder="Search by Miner ID, name or NIC..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition"
                />

              </div>


              <div className="text-sm text-slate-400">

                Showing{" "}
                <span className="text-white font-semibold">
                  {filteredMiners.length}
                </span>{" "}
                miner(s)

              </div>

            </div>

          </div>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">

              <div className="flex items-center gap-3">

                <span className="text-xl">
                  ⚠️
                </span>

                <div>

                  <p className="font-semibold text-red-400">
                    Connection Error
                  </p>

                  <p className="text-sm text-slate-400 mt-1">
                    {error}
                  </p>

                </div>

              </div>

            </div>

          )}


          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">

              <div className="animate-spin w-10 h-10 border-4 border-slate-700 border-t-cyan-400 rounded-full mx-auto mb-4"></div>

              <p className="text-slate-400">
                Loading miner data...
              </p>

            </div>

          )}


          {/* =================================================
              NO MINERS
          ================================================= */}

          {!loading && filteredMiners.length === 0 && (

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">

              <div className="text-5xl mb-4">
                👷
              </div>

              <h2 className="text-xl font-bold">
                No Miner Data Available
              </h2>

              <p className="text-slate-400 mt-2">
                {search
                  ? "No miners match your search."
                  : "No miners are currently registered in the system."
                }
              </p>

            </div>

          )}


          {/* =================================================
              MINER CARDS
          ================================================= */}

          {!loading && filteredMiners.length > 0 && (

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

              {filteredMiners.map((miner) => (

                <div
                  key={miner.userId || miner._id}
                  className={`bg-slate-900 border rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                    miner.sosAlert
                      ? "border-orange-500 shadow-orange-500/20"
                      : "border-slate-800"
                  }`}
                >


                  {/* =================================================
                      CARD HEADER
                  ================================================= */}

                  <div className="p-5 border-b border-slate-800">

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">
                          Miner ID
                        </p>

                        <h2 className="text-xl font-bold mt-1">
                          {miner.userId || "Unknown"}
                        </h2>

                        {miner.fullName && (

                          <p className="text-slate-400 text-sm mt-1">
                            {miner.fullName}
                          </p>

                        )}

                      </div>


                      {/* STATUS */}

                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-bold ${getStatusClass(
                          miner.status
                        )}`}
                      >

                        <span
                          className={`w-2 h-2 rounded-full ${getStatusDot(
                            miner.status
                          )}`}
                        ></span>

                        {miner.status || "SAFE"}

                      </div>

                    </div>


                    {/* SOS */}

                    {miner.sosAlert && (

                      <div className="mt-4 bg-orange-500/15 border border-orange-500/40 rounded-xl px-4 py-3">

                        <div className="flex items-center gap-3">

                          <span className="text-2xl animate-pulse">
                            🚨
                          </span>

                          <div>

                            <p className="font-bold text-orange-400">
                              SOS EMERGENCY
                            </p>

                            <p className="text-xs text-slate-400">
                              Manual emergency button activated
                            </p>

                          </div>

                        </div>

                      </div>

                    )}

                  </div>


                  {/* =================================================
                      HEALTH DATA
                  ================================================= */}

                  <div className="p-5">

                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">
                      Health Monitoring
                    </p>


                    <div className="grid grid-cols-2 gap-3">


                      {/* HEART RATE */}

                      <div className="bg-slate-800 rounded-xl p-4">

                        <p className="text-xs text-slate-400">
                          ❤️ Heart Rate
                        </p>

                        <p className="text-xl font-bold mt-1">

                          {miner.heartRate ??
                            miner.bpm ??
                            "--"}

                          {getSensorStatus(
                            miner.heartRate ??
                              miner.bpm
                          ) === "Online" && (
                            <span className="text-xs text-slate-500 ml-1">
                              BPM
                            </span>
                          )}

                        </p>

                      </div>


                      {/* SPO2 */}

                      <div className="bg-slate-800 rounded-xl p-4">

                        <p className="text-xs text-slate-400">
                          🫁 SpO₂
                        </p>

                        <p className="text-xl font-bold mt-1">

                          {miner.spo2 ?? "--"}

                          {miner.spo2 > 0 && (
                            <span className="text-xs text-slate-500 ml-1">
                              %
                            </span>
                          )}

                        </p>

                      </div>


                      {/* TEMPERATURE */}

                      <div className="bg-slate-800 rounded-xl p-4">

                        <p className="text-xs text-slate-400">
                          🌡 Temperature
                        </p>

                        <p className="text-xl font-bold mt-1">

                          {miner.temperature ?? "--"}

                          {miner.temperature !== null &&
                            miner.temperature !== undefined && (
                              <span className="text-xs text-slate-500 ml-1">
                                °C
                              </span>
                            )}

                        </p>

                      </div>


                      {/* MOTION */}

                      <div className="bg-slate-800 rounded-xl p-4">

                        <p className="text-xs text-slate-400">
                          🏃 Motion
                        </p>

                        <p className="text-xl font-bold mt-1">
                          {miner.motionStatus || "NORMAL"}
                        </p>

                      </div>

                    </div>


                    {/* =================================================
                        ENVIRONMENT DATA
                    ================================================= */}

                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mt-6 mb-4">
                      Environmental Monitoring
                    </p>


                    <div className="space-y-3">


                      {/* AMMONIA */}

                      <div className="flex justify-between items-center bg-slate-800 rounded-lg px-4 py-3">

                        <span className="text-sm text-slate-400">
                          MQ137 · Ammonia
                        </span>

                        <span className="font-semibold">
                          {miner.mq137 ?? "--"}
                        </span>

                      </div>


                      {/* METHANE */}

                      <div className="flex justify-between items-center bg-slate-800 rounded-lg px-4 py-3">

                        <span className="text-sm text-slate-400">
                          MQ4 · Methane
                        </span>

                        <span className="font-semibold">
                          {miner.mq4 ?? "--"}
                        </span>

                      </div>


                      {/* CO2 */}

                      <div className="flex justify-between items-center bg-slate-800 rounded-lg px-4 py-3">

                        <span className="text-sm text-slate-400">
                          SCD41 · CO₂
                        </span>

                        <span className="font-semibold">
                          {miner.co2 ?? "--"}
                          {miner.co2 != null && (
                            <span className="text-xs text-slate-500 ml-1">
                              ppm
                            </span>
                          )}
                        </span>

                      </div>


                      {/* CO */}

                      <div className="flex justify-between items-center bg-slate-800 rounded-lg px-4 py-3">

                        <span className="text-sm text-slate-400">
                          MQ7 · Carbon Monoxide
                        </span>

                        <span className="font-semibold">
                          {miner.mq7 ?? "--"}
                        </span>

                      </div>


                      {/* PRESSURE */}

                      <div className="flex justify-between items-center bg-slate-800 rounded-lg px-4 py-3">

                        <span className="text-sm text-slate-400">
                          DSP310 · Pressure
                        </span>

                        <span className="font-semibold">
                          {miner.pressure ?? "--"}
                        </span>

                      </div>

                    </div>


                    {/* =================================================
                        EMERGENCY / FALL
                    ================================================= */}

                    <div className="grid grid-cols-2 gap-3 mt-5">


                      <div
                        className={`rounded-xl p-4 border ${
                          miner.fallDetected
                            ? "bg-red-500/15 border-red-500/40"
                            : "bg-slate-800 border-slate-700"
                        }`}
                      >

                        <p className="text-xs text-slate-400">
                          Fall Detection
                        </p>

                        <p
                          className={`font-bold mt-1 ${
                            miner.fallDetected
                              ? "text-red-400"
                              : "text-green-400"
                          }`}
                        >
                          {miner.fallDetected
                            ? "FALL DETECTED"
                            : "NORMAL"}
                        </p>

                      </div>


                      <div
                        className={`rounded-xl p-4 border ${
                          miner.sosAlert
                            ? "bg-orange-500/15 border-orange-500/40"
                            : "bg-slate-800 border-slate-700"
                        }`}
                      >

                        <p className="text-xs text-slate-400">
                          SOS Button
                        </p>

                        <p
                          className={`font-bold mt-1 ${
                            miner.sosAlert
                              ? "text-orange-400"
                              : "text-green-400"
                          }`}
                        >
                          {miner.sosAlert
                            ? "ACTIVE"
                            : "READY"}
                        </p>

                      </div>

                    </div>


                    {/* =================================================
                        LOCATION
                    ================================================= */}

                    <div className="mt-5 bg-slate-800 rounded-xl p-4">

                      <div className="flex justify-between items-center">

                        <div>

                          <p className="text-xs text-slate-400">
                            📍 Current Location
                          </p>

                          <p className="text-sm font-semibold mt-1">

                            {miner.latitude != null &&
                            miner.longitude != null
                              ? `${Number(
                                  miner.latitude
                                ).toFixed(
                                  5
                                )}, ${Number(
                                  miner.longitude
                                ).toFixed(
                                  5
                                )}`
                              : "Location unavailable"}

                          </p>

                        </div>

                      </div>

                    </div>


                    {/* =================================================
                        VIEW DETAILS
                    ================================================= */}

                    <Link
                      to={`/miner/${miner.userId}`}
                      className="block w-full text-center mt-5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-xl transition"
                    >
                      View Full Miner Details →
                    </Link>

                  </div>

                </div>

              ))}

            </div>

          )}

        </main>

      </div>

    </div>
  );
}

export default Miners;