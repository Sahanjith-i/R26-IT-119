import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import axios from "axios";
import io from "socket.io-client";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const API_URL = "http://localhost:5000";

function EnvironmentalMonitoring() {
  const [miners, setMiners] = useState([]);
  const [selectedMiner, setSelectedMiner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  // =====================================================
  // 🔔 NOTIFICATION STATE
  // =====================================================

  const [notification, setNotification] = useState(null);

  const previousSensorStatus = useRef({});
  const previousEnvironmentStatus = useRef(null);

  // =====================================================
  // 📡 FETCH MINERS
  // =====================================================

  const fetchMiners = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/miners`
      );

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setMiners(data);

      if (data.length > 0) {
        setSelectedMiner((current) => {
          if (!current) {
            return data[0];
          }

          return (
            data.find(
              (miner) =>
                miner.userId === current.userId
            ) || data[0]
          );
        });
      }
    } catch (error) {
      console.error(
        "Failed to load environmental data:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================================================
  // 🔄 INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchMiners();
  }, [fetchMiners]);

  // =====================================================
  // 🔔 SHOW NOTIFICATION
  // =====================================================

  const showNotification = useCallback(
    (type, title, message) => {
      setNotification({
        id: Date.now(),
        type,
        title,
        message,
      });

      setTimeout(() => {
        setNotification(null);
      }, 6000);
    },
    []
  );

  // =====================================================
  // 🔌 SOCKET.IO LIVE DATA
  // =====================================================

  useEffect(() => {
    const socket = io(API_URL, {
      transports: [
        "polling",
        "websocket",
      ],
    });

    // -----------------------------------------------------
    // CONNECTED
    // -----------------------------------------------------

    socket.on("connect", () => {
      console.log(
        "Environmental monitoring connected 🔌"
      );

      setConnected(true);
    });

    // -----------------------------------------------------
    // DISCONNECTED
    // -----------------------------------------------------

    socket.on("disconnect", () => {
      console.log(
        "Environmental monitoring disconnected ❌"
      );

      setConnected(false);

      showNotification(
        "offline",
        "Connection Offline",
        "Central monitoring connection has been lost."
      );
    });

    // -----------------------------------------------------
    // LIVE MINER DATA
    // -----------------------------------------------------

    socket.on(
      "dataUpdate",
      (updatedMiner) => {
        if (!updatedMiner) return;

        setMiners((current) => {
          const exists = current.some(
            (miner) =>
              miner.userId ===
              updatedMiner.userId
          );

          if (!exists) {
            return [
              updatedMiner,
              ...current,
            ];
          }

          return current.map((miner) =>
            miner.userId ===
            updatedMiner.userId
              ? {
                  ...miner,
                  ...updatedMiner,
                }
              : miner
          );
        });

        setSelectedMiner((current) => {
          if (
            current &&
            current.userId ===
              updatedMiner.userId
          ) {
            return {
              ...current,
              ...updatedMiner,
            };
          }

          return current;
        });
      }
    );

    // =====================================================
    // 🚨 ALERT UPDATE
    // =====================================================

    socket.on(
      "alertUpdate",
      (alertData) => {
        if (!alertData) return;

        showNotification(
          "danger",
          "Safety Alert",
          alertData.alertReason ||
            "A dangerous environmental condition has been detected."
        );
      }
    );

    // =====================================================
    // 🚨 SOS ALERT
    // =====================================================

    socket.on(
      "sosAlert",
      (sosData) => {
        if (!sosData) return;

        showNotification(
          "sos",
          "SOS EMERGENCY",
          "SOS emergency button has been activated."
        );
      }
    );

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      socket.disconnect();
    };
  }, [showNotification]);

  // =====================================================
  // 👷 SELECT MINER
  // =====================================================

  const handleMinerChange = (
    event
  ) => {
    const miner = miners.find(
      (item) =>
        item.userId ===
        event.target.value
    );

    if (miner) {
      setSelectedMiner(miner);
    }
  };

  // =====================================================
  // 📡 ENVIRONMENTAL SENSOR STATUS
  // =====================================================
  //
  // MQ135 = CO₂ + Ammonia
  // MQ4   = Methane
  // MQ7   = Carbon Monoxide
  //
  // ❌ BMP280 / Pressure removed
  //
  // =====================================================

  const sensorStatus = useMemo(() => {
    const status =
      selectedMiner?.sensorStatus || {};

    return {
      // ---------------------------------------------------
      // ☁️ MQ135 - CO₂
      // ---------------------------------------------------

      co2:
        status.ammonia === true,

      // ---------------------------------------------------
      // ☣️ MQ135 - AMMONIA
      // ---------------------------------------------------

      ammonia:
        status.ammonia === true,

      // ---------------------------------------------------
      // 🔥 MQ4 - METHANE
      // ---------------------------------------------------

      methane:
        status.methane === true,

      // ---------------------------------------------------
      // ☠️ MQ7 - CARBON MONOXIDE
      // ---------------------------------------------------

      carbonMonoxide:
        status.carbonMonoxide === true,
    };
  }, [selectedMiner]);

  // =====================================================
  // 🚨 SENSOR OFFLINE DETECTION
  // =====================================================

  useEffect(() => {
    if (!selectedMiner) return;

    const minerId =
      selectedMiner.userId ||
      "unknown";

    const currentStatus = {
      co2: sensorStatus.co2,

      ammonia:
        sensorStatus.ammonia,

      methane:
        sensorStatus.methane,

      carbonMonoxide:
        sensorStatus.carbonMonoxide,
    };

    const previous =
      previousSensorStatus.current[
        minerId
      ];

    // ---------------------------------------------------
    // FIRST LOAD
    // ---------------------------------------------------
    //
    // Don't show popup immediately.
    //
    // ---------------------------------------------------

    if (!previous) {
      previousSensorStatus.current[
        minerId
      ] = currentStatus;

      return;
    }

    // ===================================================
    // SENSOR NAMES
    // ===================================================

    const sensorNames = {
      co2:
        "MQ135 CO₂ Sensor",

      ammonia:
        "MQ135 Ammonia Sensor",

      methane:
        "MQ4 Methane Sensor",

      carbonMonoxide:
        "MQ7 Carbon Monoxide Sensor",
    };

    // ===================================================
    // CHECK INDIVIDUAL SENSOR
    // ===================================================

    Object.keys(
      currentStatus
    ).forEach((sensor) => {
      // -------------------------------------------------
      // ONLINE → OFFLINE
      // -------------------------------------------------

      if (
        previous[sensor] === true &&
        currentStatus[sensor] === false
      ) {
        showNotification(
          "offline",
          "Sensor Offline",
          `${sensorNames[sensor]} is offline. The last received value is still displayed.`
        );
      }

      // -------------------------------------------------
      // OFFLINE → ONLINE
      // -------------------------------------------------

      if (
        previous[sensor] === false &&
        currentStatus[sensor] === true
      ) {
        showNotification(
          "online",
          "Sensor Online",
          `${sensorNames[sensor]} is connected again.`
        );
      }
    });

    // ---------------------------------------------------
    // SAVE CURRENT STATUS
    // ---------------------------------------------------

    previousSensorStatus.current[
      minerId
    ] = currentStatus;
  }, [
    selectedMiner,
    sensorStatus,
    showNotification,
  ]);

  // =====================================================
  // 🌫 ENVIRONMENT STATUS
  // =====================================================

  const environmentStatus =
    useMemo(() => {
      if (!selectedMiner) {
        return {
          label: "NO DATA",
          color: "text-slate-400",
          bg: "bg-slate-500/10",
          border:
            "border-slate-500/20",
          dot: "bg-slate-500",
        };
      }

      // =================================================
      // ☁️ CO₂ - MQ135
      // =================================================

      const co2 =
        Number(
          selectedMiner.co2 ??
            selectedMiner.mq135Co2 ??
            selectedMiner.mq135
        ) || 0;

      // =================================================
      // ☣️ AMMONIA - MQ135
      // =================================================

      const ammonia =
        Number(
          selectedMiner.ammonia ??
            selectedMiner.mq135Ammonia ??
            selectedMiner.mq135
        ) || 0;

      // =================================================
      // 🔥 METHANE - MQ4
      // =================================================

      const methane =
        Number(
          selectedMiner.mq4
        ) || 0;

      // =================================================
      // ☠️ CARBON MONOXIDE - MQ7
      // =================================================

      const carbonMonoxide =
        Number(
          selectedMiner.mq7
        ) || 0;

      // =================================================
      // 🚨 DANGER
      // =================================================

      if (
        co2 >= 1500 ||
        ammonia >= 100 ||
        methane >= 400 ||
        carbonMonoxide >= 50
      ) {
        return {
          label: "DANGER",
          color: "text-red-400",
          bg: "bg-red-500/10",
          border:
            "border-red-500/30",
          dot: "bg-red-500",
        };
      }

      // =================================================
      // ⚠️ WARNING
      // =================================================

      if (
        co2 >= 1000 ||
        ammonia >= 50 ||
        methane >= 200 ||
        carbonMonoxide >= 25
      ) {
        return {
          label: "WARNING",
          color:
            "text-yellow-400",
          bg:
            "bg-yellow-500/10",
          border:
            "border-yellow-500/30",
          dot:
            "bg-yellow-500",
        };
      }

      // =================================================
      // ✅ SAFE
      // =================================================

      return {
        label: "SAFE",
        color: "text-green-400",
        bg: "bg-green-500/10",
        border:
          "border-green-500/20",
        dot: "bg-green-500",
      };
    }, [selectedMiner]);

  // =====================================================
  // 🚨 ENVIRONMENT ALERT POPUP
  // =====================================================

  useEffect(() => {
    const current =
      environmentStatus.label;

    const previous =
      previousEnvironmentStatus.current;

    if (
      previous &&
      previous !== current
    ) {
      // -------------------------------------------------
      // DANGER
      // -------------------------------------------------

      if (current === "DANGER") {
        showNotification(
          "danger",
          "Environmental Danger",
          "Dangerous gas levels have been detected. Immediate operator attention is required."
        );
      }

      // -------------------------------------------------
      // WARNING
      // -------------------------------------------------

      if (
        current === "WARNING"
      ) {
        showNotification(
          "warning",
          "Environmental Warning",
          "One or more environmental readings are above the normal range."
        );
      }

      // -------------------------------------------------
      // RETURNED TO SAFE
      // -------------------------------------------------

      if (
        previous === "DANGER" &&
        current === "SAFE"
      ) {
        showNotification(
          "online",
          "Environment Normal",
          "Environmental readings have returned to the normal range."
        );
      }
    }

    previousEnvironmentStatus.current =
      current;
  }, [
    environmentStatus,
    showNotification,
  ]);

  // =====================================================
  // 📊 VALUE FORMATTER
  // =====================================================

  const formatValue = (
    value,
    unit = ""
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "--";
    }

    const number =
      Number(value);

    if (
      Number.isNaN(number)
    ) {
      return `${value}${unit}`;
    }

    return `${number.toFixed(1)}${unit}`;
  };

  // =====================================================
  // 📡 SENSOR BADGE
  // =====================================================

  const SensorBadge = ({
    online,
  }) => (
    <span
      className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
        online
          ? "bg-green-500/10 border-green-500/20 text-green-400"
          : "bg-red-500/10 border-red-500/20 text-red-400"
      }`}
    >
      {online
        ? "ONLINE"
        : "OFFLINE"}
    </span>
  );

  // =====================================================
  // 📡 SENSOR STATE
  // =====================================================

  const SensorState = ({
    name,
    description,
    online,
  }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">

        <div>
          <p className="text-sm font-bold text-white">
            {name}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            {description}
          </p>
        </div>

        <SensorBadge
          online={online}
        />

      </div>
    </div>
  );

  // =====================================================
  // 🕐 LAST SENSOR UPDATE
  // =====================================================

  const lastUpdated =
    selectedMiner?.lastSensorUpdate ||
    selectedMiner?.updatedAt ||
    selectedMiner?.createdAt;

  const formattedLastUpdated =
    lastUpdated
      ? new Date(
          lastUpdated
        ).toLocaleString()
      : "Waiting for sensor data";

  // =====================================================
  // ⏳ LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mx-auto" />

          <p className="text-slate-400 mt-4 text-sm">
            Loading environmental monitoring...
          </p>

        </div>

      </div>
    );
  }
    // =====================================================
  // 🖥️ MAIN RETURN
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Sidebar />


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="ml-0 lg:ml-64 min-h-screen">

        {/* =================================================
            NAVBAR
        ================================================= */}

        <Navbar />


        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <div className="p-4 md:p-6 lg:p-8">

          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-8">

            <div>
              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl">
                  🌫️
                </div>

                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    Environmental Monitoring
                  </h1>

                  <p className="text-sm text-slate-500 mt-1">
                    Real-time environmental safety monitoring
                  </p>
                </div>

              </div>
            </div>


            {/* =================================================
                CONNECTION STATUS
            ================================================= */}

            <div className="flex items-center gap-3">

              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                  connected
                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >

                <span
                  className={`w-2 h-2 rounded-full ${
                    connected
                      ? "bg-green-400 animate-pulse"
                      : "bg-red-400"
                  }`}
                />

                <span className="text-xs font-bold">
                  {connected
                    ? "LIVE CONNECTION"
                    : "OFFLINE"}
                </span>

              </div>

            </div>

          </div>


          {/* =================================================
              MINER SELECTOR
          ================================================= */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>

                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Monitoring Miner
                </p>

                <h2 className="text-lg font-bold mt-1">
                  Select Miner
                </h2>

              </div>


              <div className="w-full md:w-80">

                <select
                  value={
                    selectedMiner?.userId || ""
                  }
                  onChange={
                    handleMinerChange
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 transition"
                >

                  {miners.length === 0 ? (
                    <option value="">
                      No miners available
                    </option>
                  ) : (
                    miners.map((miner) => (
                      <option
                        key={miner.userId}
                        value={miner.userId}
                      >
                        {miner.fullName ||
                          miner.userId ||
                          "Unknown Miner"}
                      </option>
                    ))
                  )}

                </select>

              </div>

            </div>

          </div>


          {/* =================================================
              NO MINER DATA
          ================================================= */}

          {!selectedMiner ? (

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">

              <div className="text-5xl mb-4">
                📡
              </div>

              <h2 className="text-xl font-bold">
                No Environmental Data
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                Waiting for data from the miner safety jacket.
              </p>

            </div>

          ) : (

            <>
              {/* =================================================
                  MINER INFORMATION
              ================================================= */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

                {/* Miner */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

                  <p className="text-xs text-slate-500 uppercase font-bold">
                    Miner
                  </p>

                  <h2 className="text-xl font-bold mt-2">
                    {selectedMiner.fullName ||
                      "Unknown Miner"}
                  </h2>

                  <p className="text-xs text-slate-600 mt-1">
                    ID:{" "}
                    {selectedMiner.userId ||
                      "--"}
                  </p>

                </div>


                {/* Environment Status */}
                <div
                  className={`border rounded-2xl p-5 ${environmentStatus.bg} ${environmentStatus.border}`}
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-xs text-slate-500 uppercase font-bold">
                        Environmental Status
                      </p>

                      <h2
                        className={`text-xl font-bold mt-2 ${environmentStatus.color}`}
                      >
                        {environmentStatus.label}
                      </h2>

                    </div>

                    <span
                      className={`w-4 h-4 rounded-full ${environmentStatus.dot} ${
                        environmentStatus.label !==
                        "SAFE"
                          ? "animate-pulse"
                          : ""
                      }`}
                    />

                  </div>

                </div>


                {/* Last Update */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

                  <p className="text-xs text-slate-500 uppercase font-bold">
                    Last Sensor Update
                  </p>

                  <p className="text-sm font-semibold text-slate-300 mt-3">
                    {formattedLastUpdated}
                  </p>

                  <div className="flex items-center gap-2 mt-3">

                    <span
                      className={`w-2 h-2 rounded-full ${
                        connected
                          ? "bg-green-400"
                          : "bg-red-400"
                      }`}
                    />

                    <span className="text-xs text-slate-500">
                      {connected
                        ? "Receiving live updates"
                        : "Connection unavailable"}
                    </span>

                  </div>

                </div>

              </div>


              {/* =================================================
                  OFFLINE SENSOR WARNING
              ================================================= */}

              {Object.values(
                sensorStatus
              ).some(
                (status) => status === false
              ) && (

                <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-5">

                  <div className="flex items-start gap-4">

                    <div className="w-11 h-11 shrink-0 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl">
                      ⚠️
                    </div>

                    <div className="flex-1">

                      <h3 className="text-red-400 font-bold">
                        Environmental Sensor Offline
                      </h3>

                      <p className="text-sm text-slate-400 mt-1">
                        One or more environmental sensors
                        are currently offline. The last
                        received values are still displayed.
                      </p>


                      {/* Offline Sensors */}

                      <div className="flex flex-wrap gap-2 mt-4">

                        {!sensorStatus.co2 && (
                          <span className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                            MQ135 - CO₂ Offline
                          </span>
                        )}

                        {!sensorStatus.ammonia && (
                          <span className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                            MQ135 - Ammonia Offline
                          </span>
                        )}

                        {!sensorStatus.methane && (
                          <span className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                            MQ4 - Methane Offline
                          </span>
                        )}

                        {!sensorStatus.carbonMonoxide && (
                          <span className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                            MQ7 - Carbon Monoxide Offline
                          </span>
                        )}

                      </div>

                    </div>

                  </div>

                </div>

              )}


              {/* =================================================
                  ENVIRONMENTAL SENSOR CARDS
              ================================================= */}

              <div className="mb-6">

                <div className="flex items-center justify-between mb-4">

                  <div>

                    <h2 className="text-lg font-bold">
                      Environmental Sensors
                    </h2>

                    <p className="text-xs text-slate-500 mt-1">
                      CO₂, Ammonia, Methane and Carbon Monoxide
                    </p>

                  </div>

                  <div className="text-xs text-slate-600">
                    4 Sensors
                  </div>

                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

                  {/* =================================================
                      MQ135 - CO2
                  ================================================= */}

                  <div
                    className={`bg-slate-900 border rounded-2xl p-6 transition ${
                      sensorStatus.co2
                        ? "border-slate-800 hover:border-cyan-500/30"
                        : "border-red-500/30"
                    }`}
                  >

                    <div className="flex items-start justify-between">

                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl">
                          ☁️
                        </div>

                        <div>

                          <p className="text-xs text-slate-500 uppercase font-bold">
                            MQ135
                          </p>

                          <h2 className="text-lg font-bold">
                            CO₂
                          </h2>

                        </div>

                      </div>

                      <SensorBadge
                        online={
                          sensorStatus.co2
                        }
                      />

                    </div>


                    <div className="mt-7">

                      <p className="text-xs text-slate-500">
                        Carbon Dioxide
                      </p>

                      <div className="flex items-end gap-2 mt-2">

                        <p className="text-4xl font-bold">

                          {formatValue(
                            selectedMiner?.co2 ??
                              selectedMiner?.mq135Co2 ??
                              selectedMiner?.mq135
                          )}

                        </p>

                        <span className="text-sm text-slate-500 mb-1">
                          ppm
                        </span>

                      </div>

                      <p className="text-xs text-slate-600 mt-2">

                        {sensorStatus.co2
                          ? "Live sensor reading"
                          : "Last received value"}

                      </p>

                    </div>


                    <div className="mt-6 pt-4 border-t border-slate-800">

                      <div className="flex justify-between text-xs">

                        <span className="text-slate-500">
                          Sensor
                        </span>

                        <span className="text-slate-300">
                          MQ135
                        </span>

                      </div>

                    </div>

                  </div>


                  {/* =================================================
                      MQ135 - AMMONIA
                  ================================================= */}

                  <div
                    className={`bg-slate-900 border rounded-2xl p-6 transition ${
                      sensorStatus.ammonia
                        ? "border-slate-800 hover:border-orange-500/30"
                        : "border-red-500/30"
                    }`}
                  >

                    <div className="flex items-start justify-between">

                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-2xl">
                          ☣️
                        </div>

                        <div>

                          <p className="text-xs text-slate-500 uppercase font-bold">
                            MQ135
                          </p>

                          <h2 className="text-lg font-bold">
                            Ammonia
                          </h2>

                        </div>

                      </div>

                      <SensorBadge
                        online={
                          sensorStatus.ammonia
                        }
                      />

                    </div>


                    <div className="mt-7">

                      <p className="text-xs text-slate-500">
                        Ammonia Level
                      </p>

                      <div className="flex items-end gap-2 mt-2">

                        <p className="text-4xl font-bold">

                          {formatValue(
                            selectedMiner?.ammonia ??
                              selectedMiner?.mq135Ammonia ??
                              selectedMiner?.mq135
                          )}

                        </p>

                        <span className="text-sm text-slate-500 mb-1">
                          ppm
                        </span>

                      </div>

                      <p className="text-xs text-slate-600 mt-2">

                        {sensorStatus.ammonia
                          ? "Live sensor reading"
                          : "Last received value"}

                      </p>

                    </div>


                    <div className="mt-6 pt-4 border-t border-slate-800">

                      <div className="flex justify-between text-xs">

                        <span className="text-slate-500">
                          Sensor
                        </span>

                        <span className="text-slate-300">
                          MQ135
                        </span>

                      </div>

                    </div>

                  </div>


                  {/* =================================================
                      MQ4 - METHANE
                  ================================================= */}

                  <div
                    className={`bg-slate-900 border rounded-2xl p-6 transition ${
                      sensorStatus.methane
                        ? "border-slate-800 hover:border-yellow-500/30"
                        : "border-red-500/30"
                    }`}
                  >

                    <div className="flex items-start justify-between">

                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-2xl">
                          🔥
                        </div>

                        <div>

                          <p className="text-xs text-slate-500 uppercase font-bold">
                            MQ4
                          </p>

                          <h2 className="text-lg font-bold">
                            Methane
                          </h2>

                        </div>

                      </div>

                      <SensorBadge
                        online={
                          sensorStatus.methane
                        }
                      />

                    </div>


                    <div className="mt-7">

                      <p className="text-xs text-slate-500">
                        Methane Level
                      </p>

                      <div className="flex items-end gap-2 mt-2">

                        <p className="text-4xl font-bold">

                          {formatValue(
                            selectedMiner?.mq4
                          )}

                        </p>

                        <span className="text-sm text-slate-500 mb-1">
                          ppm
                        </span>

                      </div>

                      <p className="text-xs text-slate-600 mt-2">

                        {sensorStatus.methane
                          ? "Live sensor reading"
                          : "Last received value"}

                      </p>

                    </div>


                    <div className="mt-6 pt-4 border-t border-slate-800">

                      <div className="flex justify-between text-xs">

                        <span className="text-slate-500">
                          Sensor
                        </span>

                        <span className="text-slate-300">
                          MQ4
                        </span>

                      </div>

                    </div>

                  </div>


                  {/* =================================================
                      MQ7 - CARBON MONOXIDE
                  ================================================= */}

                  <div
                    className={`bg-slate-900 border rounded-2xl p-6 transition ${
                      sensorStatus.carbonMonoxide
                        ? "border-slate-800 hover:border-red-500/30"
                        : "border-red-500/30"
                    }`}
                  >

                    <div className="flex items-start justify-between">

                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl">
                          ☠️
                        </div>

                        <div>

                          <p className="text-xs text-slate-500 uppercase font-bold">
                            MQ7
                          </p>

                          <h2 className="text-lg font-bold">
                            Carbon Monoxide
                          </h2>

                        </div>

                      </div>

                      <SensorBadge
                        online={
                          sensorStatus.carbonMonoxide
                        }
                      />

                    </div>


                    <div className="mt-7">

                      <p className="text-xs text-slate-500">
                        CO Level
                      </p>

                      <div className="flex items-end gap-2 mt-2">

                        <p className="text-4xl font-bold">

                          {formatValue(
                            selectedMiner?.mq7
                          )}

                        </p>

                        <span className="text-sm text-slate-500 mb-1">
                          ppm
                        </span>

                      </div>

                      <p className="text-xs text-slate-600 mt-2">

                        {sensorStatus.carbonMonoxide
                          ? "Live sensor reading"
                          : "Last received value"}

                      </p>

                    </div>


                    <div className="mt-6 pt-4 border-t border-slate-800">

                      <div className="flex justify-between text-xs">

                        <span className="text-slate-500">
                          Sensor
                        </span>

                        <span className="text-slate-300">
                          MQ7
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

              </div>
                            {/* =================================================
                  ENVIRONMENT SUMMARY
              ================================================= */}

              <div className="mb-6">

                <div className="flex items-center justify-between mb-4">

                  <div>
                    <h2 className="text-lg font-bold">
                      Environmental Summary
                    </h2>

                    <p className="text-xs text-slate-500 mt-1">
                      Current readings from environmental sensors
                    </p>
                  </div>

                  <div
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${environmentStatus.bg} ${environmentStatus.border} ${environmentStatus.color}`}
                  >
                    {environmentStatus.label}
                  </div>

                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

                  {/* =================================================
                      CO2 SUMMARY
                  ================================================= */}

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

                    <div className="flex items-center justify-between">

                      <div>
                        <p className="text-xs text-slate-500">
                          MQ135
                        </p>

                        <p className="text-sm font-semibold mt-1">
                          CO₂
                        </p>
                      </div>

                      <div className="text-xl">
                        ☁️
                      </div>

                    </div>


                    <div className="mt-5">

                      <p className="text-3xl font-bold">

                        {formatValue(
                          selectedMiner?.co2 ??
                            selectedMiner?.mq135Co2 ??
                            selectedMiner?.mq135
                        )}

                        <span className="text-xs text-slate-500 ml-2">
                          ppm
                        </span>

                      </p>

                    </div>


                    <div className="mt-4 flex items-center gap-2">

                      <span
                        className={`w-2 h-2 rounded-full ${
                          sensorStatus.co2
                            ? "bg-green-400"
                            : "bg-red-400"
                        }`}
                      />

                      <span
                        className={`text-xs ${
                          sensorStatus.co2
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {sensorStatus.co2
                          ? "Online"
                          : "Offline"}
                      </span>

                    </div>

                  </div>


                  {/* =================================================
                      AMMONIA SUMMARY
                  ================================================= */}

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

                    <div className="flex items-center justify-between">

                      <div>
                        <p className="text-xs text-slate-500">
                          MQ135
                        </p>

                        <p className="text-sm font-semibold mt-1">
                          Ammonia
                        </p>
                      </div>

                      <div className="text-xl">
                        ☣️
                      </div>

                    </div>


                    <div className="mt-5">

                      <p className="text-3xl font-bold">

                        {formatValue(
                          selectedMiner?.ammonia ??
                            selectedMiner?.mq135Ammonia ??
                            selectedMiner?.mq135
                        )}

                        <span className="text-xs text-slate-500 ml-2">
                          ppm
                        </span>

                      </p>

                    </div>


                    <div className="mt-4 flex items-center gap-2">

                      <span
                        className={`w-2 h-2 rounded-full ${
                          sensorStatus.ammonia
                            ? "bg-green-400"
                            : "bg-red-400"
                        }`}
                      />

                      <span
                        className={`text-xs ${
                          sensorStatus.ammonia
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {sensorStatus.ammonia
                          ? "Online"
                          : "Offline"}
                      </span>

                    </div>

                  </div>


                  {/* =================================================
                      METHANE SUMMARY
                  ================================================= */}

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

                    <div className="flex items-center justify-between">

                      <div>
                        <p className="text-xs text-slate-500">
                          MQ4
                        </p>

                        <p className="text-sm font-semibold mt-1">
                          Methane
                        </p>
                      </div>

                      <div className="text-xl">
                        🔥
                      </div>

                    </div>


                    <div className="mt-5">

                      <p className="text-3xl font-bold">

                        {formatValue(
                          selectedMiner?.mq4
                        )}

                        <span className="text-xs text-slate-500 ml-2">
                          ppm
                        </span>

                      </p>

                    </div>


                    <div className="mt-4 flex items-center gap-2">

                      <span
                        className={`w-2 h-2 rounded-full ${
                          sensorStatus.methane
                            ? "bg-green-400"
                            : "bg-red-400"
                        }`}
                      />

                      <span
                        className={`text-xs ${
                          sensorStatus.methane
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {sensorStatus.methane
                          ? "Online"
                          : "Offline"}
                      </span>

                    </div>

                  </div>


                  {/* =================================================
                      CARBON MONOXIDE SUMMARY
                  ================================================= */}

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

                    <div className="flex items-center justify-between">

                      <div>
                        <p className="text-xs text-slate-500">
                          MQ7
                        </p>

                        <p className="text-sm font-semibold mt-1">
                          Carbon Monoxide
                        </p>
                      </div>

                      <div className="text-xl">
                        ☠️
                      </div>

                    </div>


                    <div className="mt-5">

                      <p className="text-3xl font-bold">

                        {formatValue(
                          selectedMiner?.mq7
                        )}

                        <span className="text-xs text-slate-500 ml-2">
                          ppm
                        </span>

                      </p>

                    </div>


                    <div className="mt-4 flex items-center gap-2">

                      <span
                        className={`w-2 h-2 rounded-full ${
                          sensorStatus.carbonMonoxide
                            ? "bg-green-400"
                            : "bg-red-400"
                        }`}
                      />

                      <span
                        className={`text-xs ${
                          sensorStatus.carbonMonoxide
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {sensorStatus.carbonMonoxide
                          ? "Online"
                          : "Offline"}
                      </span>

                    </div>

                  </div>

                </div>

              </div>


              {/* =================================================
                  SAFETY ANALYSIS
              ================================================= */}

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">

                <div className="flex items-center justify-between mb-5">

                  <div>

                    <h2 className="text-lg font-bold">
                      Environmental Safety Analysis
                    </h2>

                    <p className="text-xs text-slate-500 mt-1">
                      Current environmental sensor condition
                    </p>

                  </div>


                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${environmentStatus.bg} ${environmentStatus.border}`}
                  >

                    <span
                      className={`w-2 h-2 rounded-full ${environmentStatus.dot}`}
                    />

                    <span
                      className={`text-xs font-bold ${environmentStatus.color}`}
                    >
                      {environmentStatus.label}
                    </span>

                  </div>

                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* CO2 */}
                  <div className="flex items-center justify-between bg-slate-950 rounded-xl p-4 border border-slate-800">

                    <div>

                      <p className="text-sm font-semibold">
                        CO₂
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        MQ135
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-sm font-bold">

                        {formatValue(
                          selectedMiner?.co2 ??
                            selectedMiner?.mq135Co2 ??
                            selectedMiner?.mq135
                        )}{" "}
                        ppm

                      </p>

                      <p
                        className={`text-xs mt-1 ${
                          sensorStatus.co2
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {sensorStatus.co2
                          ? "Sensor Online"
                          : "Sensor Offline"}
                      </p>

                    </div>

                  </div>


                  {/* Ammonia */}
                  <div className="flex items-center justify-between bg-slate-950 rounded-xl p-4 border border-slate-800">

                    <div>

                      <p className="text-sm font-semibold">
                        Ammonia
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        MQ135
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-sm font-bold">

                        {formatValue(
                          selectedMiner?.ammonia ??
                            selectedMiner?.mq135Ammonia ??
                            selectedMiner?.mq135
                        )}{" "}
                        ppm

                      </p>

                      <p
                        className={`text-xs mt-1 ${
                          sensorStatus.ammonia
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {sensorStatus.ammonia
                          ? "Sensor Online"
                          : "Sensor Offline"}
                      </p>

                    </div>

                  </div>


                  {/* Methane */}
                  <div className="flex items-center justify-between bg-slate-950 rounded-xl p-4 border border-slate-800">

                    <div>

                      <p className="text-sm font-semibold">
                        Methane
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        MQ4
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-sm font-bold">

                        {formatValue(
                          selectedMiner?.mq4
                        )}{" "}
                        ppm

                      </p>

                      <p
                        className={`text-xs mt-1 ${
                          sensorStatus.methane
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {sensorStatus.methane
                          ? "Sensor Online"
                          : "Sensor Offline"}
                      </p>

                    </div>

                  </div>


                  {/* Carbon Monoxide */}
                  <div className="flex items-center justify-between bg-slate-950 rounded-xl p-4 border border-slate-800">

                    <div>

                      <p className="text-sm font-semibold">
                        Carbon Monoxide
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        MQ7
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-sm font-bold">

                        {formatValue(
                          selectedMiner?.mq7
                        )}{" "}
                        ppm

                      </p>

                      <p
                        className={`text-xs mt-1 ${
                          sensorStatus.carbonMonoxide
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {sensorStatus.carbonMonoxide
                          ? "Sensor Online"
                          : "Sensor Offline"}
                      </p>

                    </div>

                  </div>

                </div>

              </div>


              {/* =================================================
                  INDIVIDUAL SENSOR STATUS
              ================================================= */}

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">

                <div className="mb-5">

                  <h2 className="text-lg font-bold">
                    Environmental Sensor Status
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Individual sensor connection status
                  </p>

                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                  <SensorState
                    name="MQ135"
                    description="CO₂"
                    online={
                      sensorStatus.co2
                    }
                  />

                  <SensorState
                    name="MQ135"
                    description="Ammonia"
                    online={
                      sensorStatus.ammonia
                    }
                  />

                  <SensorState
                    name="MQ4"
                    description="Methane"
                    online={
                      sensorStatus.methane
                    }
                  />

                  <SensorState
                    name="MQ7"
                    description="Carbon Monoxide"
                    online={
                      sensorStatus.carbonMonoxide
                    }
                  />

                </div>

              </div>


              {/* =================================================
                  LAST RECEIVED DATA NOTICE
              ================================================= */}

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">

                <div className="flex items-start gap-4">

                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    ℹ️
                  </div>

                  <div>

                    <h3 className="text-sm font-bold">
                      Sensor Data Information
                    </h3>

                    <p className="text-xs text-slate-500 mt-1 leading-5">
                      When a sensor goes offline, the dashboard
                      continues displaying the last received
                      value instead of replacing it with zero.
                      The sensor status will be shown as
                      <span className="text-red-400 font-semibold">
                        {" "}OFFLINE
                      </span>
                      until the sensor reconnects.
                    </p>

                  </div>

                </div>

              </div>

            </>

          )}


          {/* =================================================
              🔔 NOTIFICATION POPUP
          ================================================= */}

          {notification && (

            <div className="fixed top-6 right-6 z-[9999] w-[calc(100%-2rem)] max-w-md">

              <div
                className={`rounded-2xl border shadow-2xl p-5 backdrop-blur-xl ${
                  notification.type === "sos"
                    ? "bg-red-950/95 border-red-500/50"
                    : notification.type === "danger"
                    ? "bg-red-950/95 border-red-500/40"
                    : notification.type === "warning"
                    ? "bg-yellow-950/95 border-yellow-500/40"
                    : notification.type === "offline"
                    ? "bg-orange-950/95 border-orange-500/40"
                    : "bg-slate-900/95 border-slate-700"
                }`}
              >

                <div className="flex items-start gap-4">

                  {/* Icon */}

                  <div
                    className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-xl ${
                      notification.type === "sos"
                        ? "bg-red-500/20"
                        : notification.type === "danger"
                        ? "bg-red-500/20"
                        : notification.type === "warning"
                        ? "bg-yellow-500/20"
                        : notification.type === "offline"
                        ? "bg-orange-500/20"
                        : "bg-green-500/20"
                    }`}
                  >

                    {notification.type === "sos"
                      ? "🚨"
                      : notification.type === "danger"
                      ? "🚨"
                      : notification.type === "warning"
                      ? "⚠️"
                      : notification.type === "offline"
                      ? "📡"
                      : "✅"}

                  </div>


                  {/* Content */}

                  <div className="flex-1 min-w-0">

                    <div className="flex items-start justify-between gap-3">

                      <div>

                        <h3 className="font-bold text-sm">
                          {notification.title}
                        </h3>

                        <p className="text-xs text-slate-400 mt-1 leading-5">
                          {notification.message}
                        </p>

                      </div>


                      <button
                        type="button"
                        onClick={() =>
                          setNotification(
                            null
                          )
                        }
                        className="text-slate-500 hover:text-white transition text-lg"
                      >
                        ×
                      </button>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          )}

        </div>

      </main>

    </div>
  );
}


// =====================================================
// 📦 EXPORT
// =====================================================

export default EnvironmentalMonitoring;