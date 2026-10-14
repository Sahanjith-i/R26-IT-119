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

// =====================================================
// SENSOR CONFIGURATION
// =====================================================

const SENSOR_TIMEOUT = 10000;

const defaultSensorStatus = {
  motion: false,
  pressure: false,
  sosButton: false,
};

// =====================================================
// HELPERS
// =====================================================

const isRecent = (dateValue) => {
  if (!dateValue) return false;

  const time = new Date(dateValue).getTime();

  if (Number.isNaN(time)) return false;

  return Date.now() - time <= SENSOR_TIMEOUT;
};

const getSensorOnline = (
  miner,
  sensorName
) => {
  if (!miner) return false;

  // Backend sensorStatus has priority
  if (
    miner.sensorStatus &&
    typeof miner.sensorStatus[sensorName] === "boolean"
  ) {
    return miner.sensorStatus[sensorName];
  }

  // Fallback to last update
  return isRecent(
    miner.lastSensorUpdate ||
      miner.updatedAt
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

function MotionEmergency() {
  const [miners, setMiners] = useState([]);
  const [selectedMiner, setSelectedMiner] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [connected, setConnected] =
    useState(false);

  // Popup
  const [popup, setPopup] = useState(null);

  // Keep previous values
  const previousValues = useRef({});

  // Prevent duplicate alerts
  const previousAlertState = useRef({});

  // =====================================================
  // FETCH MINERS
  // =====================================================

  const fetchMiners = useCallback(
    async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/miners`
        );

        const data = Array.isArray(
          response.data
        )
          ? response.data
          : response.data?.miners || [];

        setMiners(data);

        if (data.length > 0) {
          setSelectedMiner((current) => {
            if (!current) {
              return data[0];
            }

            return (
              data.find(
                (miner) =>
                  miner.userId ===
                  current.userId
              ) || data[0]
            );
          });
        }
      } catch (error) {
        console.error(
          "Failed to load Motion & Emergency data:",
          error
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchMiners();
  }, [fetchMiners]);

  // =====================================================
  // POPUP
  // =====================================================

  const showPopup = useCallback(
    ({
      type = "warning",
      title,
      message,
    }) => {
      setPopup({
        type,
        title,
        message,
        id: Date.now(),
      });

      setTimeout(() => {
        setPopup(null);
      }, 7000);
    },
    []
  );

  // =====================================================
  // UPDATE MINER
  // =====================================================

  const updateMinerState = useCallback(
    (updatedMiner) => {
      if (!updatedMiner?.userId) return;

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
          current?.userId ===
          updatedMiner.userId
        ) {
          return {
            ...current,
            ...updatedMiner,
          };
        }

        return current;
      });
    },
    []
  );

  // =====================================================
  // SOCKET.IO LIVE MONITORING
  // =====================================================

  useEffect(() => {
    const socket = io(API_URL, {
      transports: [
        "polling",
        "websocket",
      ],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log(
        "Motion & Emergency connected 🔌"
      );

      setConnected(true);

      socket.emit(
        "requestMonitoringData"
      );
    });

    socket.on("disconnect", () => {
      console.log(
        "Motion & Emergency disconnected ❌"
      );

      setConnected(false);
    });

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "Socket error:",
          error.message
        );

        setConnected(false);
      }
    );

    // =================================================
    // LIVE DATA
    // =================================================

    socket.on(
      "dataUpdate",
      (data) => {
        if (!data) return;

        updateMinerState(data);
      }
    );

    // =================================================
    // FALL / EMERGENCY
    // =================================================

    socket.on(
      "alertUpdate",
      (alertData) => {
        if (!alertData) return;

        updateMinerState(
          alertData.miner ||
            alertData
        );

        const miner =
          alertData.miner ||
          alertData;

        const userId =
          miner.userId || "Unknown Miner";

        showPopup({
          type: "danger",
          title:
            "🚨 SAFETY ALERT",
          message:
            alertData.message ||
            miner.alertReason ||
            `Dangerous condition detected for ${userId}.`,
        });
      }
    );

    // =================================================
    // SOS
    // =================================================

    socket.on(
      "sosAlert",
      (sosData) => {
        if (!sosData) return;

        const miner =
          sosData.miner ||
          sosData;

        const updatedMiner = {
          ...miner,
          sosAlert: true,
          status: "DANGER",
        };

        updateMinerState(
          updatedMiner
        );

        showPopup({
          type: "danger",
          title:
            "🚨🚨 SOS EMERGENCY",
          message:
            sosData.message ||
            `SOS emergency button has been pressed by ${
              miner.fullName ||
              miner.userId ||
              "the miner"
            }. Immediate attention required.`,
        });
      }
    );

    // =================================================
    // MINER STATUS
    // =================================================

    socket.on(
      "minerStatusUpdate",
      (statusData) => {
        if (!statusData) return;

        updateMinerState(
          statusData
        );
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [
    showPopup,
    updateMinerState,
  ]);

  // =====================================================
  // SENSOR OFFLINE DETECTION
  // =====================================================

  useEffect(() => {
    if (!selectedMiner) return;

    const sensorStatus =
      selectedMiner.sensorStatus ||
      {};

    const sensors = [
      {
        key: "motion",
        name: "MPU6050 Motion Sensor",
      },
      {
        key: "pressure",
        name: "BMP280 Pressure Sensor",
      },
      {
        key: "sosButton",
        name: "SOS Button",
      },
    ];

    sensors.forEach(
      (sensor) => {
        const online =
          getSensorOnline(
            selectedMiner,
            sensor.key
          );

        const previous =
          previousAlertState.current[
            `${selectedMiner.userId}-${sensor.key}`
          ];

        if (
          previous === true &&
          online === false
        ) {
          showPopup({
            type: "offline",
            title:
              "⚠️ SENSOR OFFLINE",
            message: `${sensor.name} is currently offline. The last received value is still displayed.`,
          });
        }

        previousAlertState.current[
          `${selectedMiner.userId}-${sensor.key}`
        ] = online;
      }
    );
  }, [
    selectedMiner,
    showPopup,
  ]);

  // =====================================================
  // SENSOR VALUES
  // =====================================================

  const pressure =
    selectedMiner?.pressure ??
    previousValues.current[
      `${selectedMiner?.userId}-pressure`
    ] ??
    null;

  const motion =
    selectedMiner?.motionStatus ||
    previousValues.current[
      `${selectedMiner?.userId}-motion`
    ] ||
    "NORMAL";

  const fallDetected =
    Boolean(
      selectedMiner?.fallDetected
    );

  const sosAlert =
    Boolean(
      selectedMiner?.sosAlert
    );

  // =====================================================
  // SAVE LAST VALUES
  // =====================================================

  useEffect(() => {
    if (!selectedMiner?.userId)
      return;

    const id =
      selectedMiner.userId;

    if (
      selectedMiner.pressure !==
        null &&
      selectedMiner.pressure !==
        undefined
    ) {
      previousValues.current[
        `${id}-pressure`
      ] =
        selectedMiner.pressure;
    }

    if (
      selectedMiner.motionStatus
    ) {
      previousValues.current[
        `${id}-motion`
      ] =
        selectedMiner.motionStatus;
    }
  }, [selectedMiner]);

  // =====================================================
  // SENSOR STATUS
  // =====================================================

  const motionOnline =
    getSensorOnline(
      selectedMiner,
      "motion"
    );

  const pressureOnline =
    getSensorOnline(
      selectedMiner,
      "pressure"
    );

  const sosOnline =
    getSensorOnline(
      selectedMiner,
      "sosButton"
    );

  // =====================================================
  // SAFETY STATUS
  // =====================================================

  const motionSafety =
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

      if (
        sosAlert ||
        fallDetected
      ) {
        return {
          label: "EMERGENCY",
          color: "text-red-400",
          bg: "bg-red-500/10",
          border:
            "border-red-500/30",
          dot: "bg-red-500",
        };
      }

      const value =
        String(motion).toUpperCase();

      if (
        value === "WARNING" ||
        value === "UNSTABLE" ||
        value === "ABNORMAL"
      ) {
        return {
          label: "WARNING",
          color:
            "text-yellow-400",
          bg: "bg-yellow-500/10",
          border:
            "border-yellow-500/30",
          dot: "bg-yellow-500",
        };
      }

      return {
        label: "NORMAL",
        color: "text-green-400",
        bg: "bg-green-500/10",
        border:
          "border-green-500/20",
        dot: "bg-green-500",
      };
    }, [
      selectedMiner,
      sosAlert,
      fallDetected,
      motion,
    ]);

  // =====================================================
  // FORMAT VALUE
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

    const number = Number(value);

    if (Number.isNaN(number)) {
      return `${value}${unit}`;
    }

    return `${number.toFixed(1)}${unit}`;
  };

  // =====================================================
  // LAST UPDATE
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
  // MINER CHANGE
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
  // SENSOR BADGE
  // =====================================================

  const SensorBadge = ({
    online,
  }) => (
    <span
      className={`
        px-2.5
        py-1
        rounded-lg
        text-[10px]
        font-bold
        border
        ${
          online
            ? "bg-green-500/10 text-green-400 border-green-500/20"
            : "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse"
        }
      `}
    >
      {online
        ? "● ONLINE"
        : "● OFFLINE"}
    </span>
  );

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <div className="ml-60">
        <Navbar />

        <main className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">

            {/* =================================================
                POPUP
            ================================================= */}

            {popup && (
              <div
                className={`
                  fixed
                  top-6
                  right-6
                  z-[100]
                  w-[380px]
                  max-w-[calc(100vw-2rem)]
                  rounded-2xl
                  border
                  p-5
                  shadow-2xl
                  backdrop-blur-xl
                  animate-pulse
                  ${
                    popup.type ===
                    "danger"
                      ? "bg-red-950/95 border-red-500/50"
                      : popup.type ===
                        "offline"
                      ? "bg-orange-950/95 border-orange-500/50"
                      : "bg-yellow-950/95 border-yellow-500/50"
                  }
                `}
              >
                <div className="flex gap-4">

                  <div
                    className={`
                      w-11
                      h-11
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      text-xl
                      ${
                        popup.type ===
                        "danger"
                          ? "bg-red-500/20"
                          : "bg-orange-500/20"
                      }
                    `}
                  >
                    {popup.type ===
                    "danger"
                      ? "🚨"
                      : "⚠️"}
                  </div>

                  <div className="flex-1">
                    <p
                      className={`
                        font-bold
                        ${
                          popup.type ===
                          "danger"
                            ? "text-red-400"
                            : "text-orange-400"
                        }
                      `}
                    >
                      {popup.title}
                    </p>

                    <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                      {popup.message}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setPopup(null)
                    }
                    className="text-slate-500 hover:text-white text-lg"
                  >
                    ×
                  </button>

                </div>
              </div>
            )}

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">

              <div>
                <div className="flex items-center gap-3 mb-3">

                  <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold">
                    MOTION & EMERGENCY
                  </span>

                  <span className="flex items-center gap-2 text-xs font-semibold">

                    <span
                      className={
                        connected
                          ? "w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"
                          : "w-2.5 h-2.5 rounded-full bg-red-500"
                      }
                    />

                    <span
                      className={
                        connected
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {connected
                        ? "LIVE"
                        : "OFFLINE"}
                    </span>

                  </span>
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                  Motion & Emergency Monitoring
                </h1>

                <p className="text-slate-500 mt-2 max-w-2xl">
                  Real-time monitoring of
                  MPU6050 motion,
                  fall detection,
                  BMP280 pressure and
                  manual SOS emergency
                  alerts.
                </p>
              </div>

              {/* STATUS */}

              <div
                className={`
                  flex
                  items-center
                  gap-3
                  px-5
                  py-3
                  rounded-xl
                  border
                  ${motionSafety.border}
                  ${motionSafety.bg}
                `}
              >
                <span
                  className={`
                    w-3
                    h-3
                    rounded-full
                    ${motionSafety.dot}
                    ${
                      motionSafety.label !==
                      "NORMAL"
                        ? "animate-pulse"
                        : ""
                    }
                  `}
                />

                <div>
                  <p className="text-[10px] uppercase text-slate-500 font-bold">
                    Safety Status
                  </p>

                  <p
                    className={`
                      text-sm
                      font-bold
                      ${motionSafety.color}
                    `}
                  >
                    {motionSafety.label}
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
                MINER SELECTOR
            ================================================= */}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                <div>
                  <p className="text-xs uppercase text-slate-500 font-bold">
                    Active Miner
                  </p>

                  <h2 className="text-lg font-bold mt-1">
                    {selectedMiner?.fullName ||
                      "No miner selected"}
                  </h2>

                  <p className="text-xs text-slate-600 mt-1">
                    Miner ID:{" "}
                    {selectedMiner?.userId ||
                      "--"}
                  </p>
                </div>

                <div className="w-full lg:w-72">

                  <select
                    value={
                      selectedMiner?.userId ||
                      ""
                    }
                    onChange={
                      handleMinerChange
                    }
                    className="
                      w-full
                      bg-slate-800
                      border
                      border-slate-700
                      text-white
                      rounded-xl
                      px-4
                      py-3
                      outline-none
                      focus:border-purple-500
                    "
                  >
                    <option value="">
                      Select Miner
                    </option>

                    {miners.map(
                      (miner) => (
                        <option
                          key={
                            miner.userId
                          }
                          value={
                            miner.userId
                          }
                        >
                          {miner.fullName ||
                            miner.userId ||
                            "Unknown Miner"}
                        </option>
                      )
                    )}
                  </select>

                </div>

              </div>
            </div>

            {/* =================================================
                SENSOR CARDS
            ================================================= */}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

              {/* =================================================
                  BMP280
              ================================================= */}

              <div
                className={`
                  bg-slate-900
                  rounded-2xl
                  p-6
                  border
                  ${
                    pressureOnline
                      ? "border-slate-800"
                      : "border-red-500/40"
                  }
                `}
              >

                <div className="flex items-start justify-between">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl">
                      📊
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">
                        BMP280
                      </p>

                      <h2 className="text-lg font-bold">
                        Pressure Sensor
                      </h2>
                    </div>

                  </div>

                  <SensorBadge
                    online={
                      pressureOnline
                    }
                  />

                </div>

                <div className="mt-7">

                  <p className="text-xs text-slate-500">
                    Environmental Pressure
                  </p>

                  <div className="flex items-end gap-2 mt-2">

                    <span className="text-4xl font-bold">
                      {formatValue(
                        pressure
                      )}
                    </span>

                    <span className="text-sm text-slate-500 mb-1">
                      hPa
                    </span>

                  </div>

                  {!pressureOnline && (
                    <p className="text-xs text-red-400 mt-3">
                      ⚠ Sensor offline — showing last received value
                    </p>
                  )}

                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">

                  <div className="flex justify-between text-xs">

                    <span className="text-slate-500">
                      Sensor
                    </span>

                    <span className="text-slate-300">
                      BMP280
                    </span>

                  </div>

                </div>
              </div>

              {/* =================================================
                  MPU6050
              ================================================= */}

              <div
                className={`
                  bg-slate-900
                  rounded-2xl
                  p-6
                  border
                  ${
                    motionOnline
                      ? "border-slate-800"
                      : "border-red-500/40"
                  }
                `}
              >

                <div className="flex items-start justify-between">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl">
                      🏃
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">
                        MPU6050
                      </p>

                      <h2 className="text-lg font-bold">
                        Motion Sensor
                      </h2>
                    </div>

                  </div>

                  <SensorBadge
                    online={
                      motionOnline
                    }
                  />

                </div>

                <div className="mt-7">

                  <p className="text-xs text-slate-500">
                    Current Motion Status
                  </p>

                  <div className="flex items-center gap-3 mt-3">

                    <span
                      className={`
                        w-3
                        h-3
                        rounded-full
                        ${
                          !motionOnline
                            ? "bg-red-500"
                            : motionSafety.dot
                        }
                      `}
                    />

                    <span
                      className={`
                        text-2xl
                        font-bold
                        ${
                          !motionOnline
                            ? "text-red-400"
                            : motionSafety.color
                        }
                      `}
                    >
                      {motion}
                    </span>

                  </div>

                  {!motionOnline && (
                    <p className="text-xs text-red-400 mt-3">
                      ⚠ MPU6050 offline — last motion state retained
                    </p>
                  )}

                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">

                  <div className="flex justify-between text-xs">

                    <span className="text-slate-500">
                      Fall Detection
                    </span>

                    <span
                      className={
                        fallDetected
                          ? "text-red-400 font-bold animate-pulse"
                          : "text-green-400 font-bold"
                      }
                    >
                      {fallDetected
                        ? "🚨 DETECTED"
                        : "NORMAL"}
                    </span>

                  </div>

                </div>
              </div>

              {/* =================================================
                  SOS
              ================================================= */}

              <div
                className={`
                  bg-slate-900
                  rounded-2xl
                  p-6
                  border
                  transition
                  ${
                    sosAlert
                      ? "border-2 border-red-500/60 shadow-lg shadow-red-500/20"
                      : sosOnline
                      ? "border-slate-800"
                      : "border-red-500/40"
                  }
                `}
              >

                <div className="flex items-start justify-between">

                  <div className="flex items-center gap-4">

                    <div
                      className={`
                        w-12
                        h-12
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        text-2xl
                        ${
                          sosAlert
                            ? "bg-red-500/20 border border-red-500/40 animate-pulse"
                            : "bg-red-500/10 border border-red-500/20"
                        }
                      `}
                    >
                      🚨
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">
                        EMERGENCY SYSTEM
                      </p>

                      <h2 className="text-lg font-bold">
                        SOS Push Button
                      </h2>
                    </div>

                  </div>

                  <SensorBadge
                    online={sosOnline}
                  />

                </div>

                <div className="mt-7">

                  <p className="text-xs text-slate-500">
                    Manual Emergency Alert
                  </p>

                  <p
                    className={`
                      text-3xl
                      font-bold
                      mt-2
                      ${
                        sosAlert
                          ? "text-red-400"
                          : "text-green-400"
                      }
                    `}
                  >
                    {sosAlert
                      ? "SOS ACTIVATED"
                      : "SYSTEM READY"}
                  </p>

                  {!sosOnline && (
                    <p className="text-xs text-red-400 mt-3">
                      ⚠ SOS sensor offline — last state retained
                    </p>
                  )}

                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">

                  <div className="flex justify-between text-xs">

                    <span className="text-slate-500">
                      Button Status
                    </span>

                    <span
                      className={
                        sosAlert
                          ? "text-red-400 font-bold animate-pulse"
                          : "text-green-400 font-bold"
                      }
                    >
                      {sosAlert
                        ? "🚨 PRESSED"
                        : "NOT PRESSED"}
                    </span>

                  </div>

                </div>
              </div>

            </div>

            {/* =================================================
                EMERGENCY ANALYSIS
            ================================================= */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">

              {/* FALL */}

              <div
                className={`
                  rounded-2xl
                  p-6
                  border
                  ${
                    fallDetected
                      ? "bg-red-500/5 border-red-500/30"
                      : "bg-slate-900 border-slate-800"
                  }
                `}
              >

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl">
                      🧍
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">
                        MPU6050 Analysis
                      </p>

                      <h2 className="text-lg font-bold">
                        Fall Detection
                      </h2>
                    </div>

                  </div>

                  <span
                    className={`
                      px-3
                      py-1
                      rounded-full
                      text-xs
                      font-bold
                      ${
                        fallDetected
                          ? "bg-red-500/10 text-red-400 animate-pulse"
                          : "bg-green-500/10 text-green-400"
                      }
                    `}
                  >
                    {fallDetected
                      ? "🚨 ALERT"
                      : "NORMAL"}
                  </span>

                </div>

                <p className="text-sm text-slate-500 mt-5">
                  {fallDetected
                    ? "A possible fall event has been detected. Immediate operator attention is required."
                    : "No fall event is currently detected from the MPU6050 motion monitoring system."}
                </p>

              </div>

              {/* SOS */}

              <div
                className={`
                  rounded-2xl
                  p-6
                  border
                  ${
                    sosAlert
                      ? "bg-red-500/5 border-red-500/30"
                      : "bg-slate-900 border-slate-800"
                  }
                `}
              >

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-4">

                    <div
                      className={`
                        w-12
                        h-12
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        text-2xl
                        ${
                          sosAlert
                            ? "bg-red-500/20 border border-red-500/40 animate-pulse"
                            : "bg-slate-800 border border-slate-700"
                        }
                      `}
                    >
                      🆘
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">
                        Emergency Control
                      </p>

                      <h2 className="text-lg font-bold">
                        SOS Push Button
                      </h2>
                    </div>

                  </div>

                  <span
                    className={`
                      px-3
                      py-1
                      rounded-full
                      text-xs
                      font-bold
                      ${
                        sosAlert
                          ? "bg-red-500/10 text-red-400 animate-pulse"
                          : "bg-green-500/10 text-green-400"
                      }
                    `}
                  >
                    {sosAlert
                      ? "ACTIVE"
                      : "STANDBY"}
                  </span>

                </div>

                <p className="text-sm text-slate-500 mt-5">
                  {sosAlert
                    ? "🚨 Emergency SOS signal received from the miner's jacket."
                    : "SOS button is ready for manual emergency activation."}
                </p>

              </div>

            </div>

            {/* =================================================
                MONITORING INFORMATION
            ================================================= */}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-5">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">

                <div>
                  <p className="text-xs uppercase text-slate-500 font-bold">
                    Monitoring Information
                  </p>

                  <h2 className="text-lg font-bold mt-1">
                    Current Motion & Emergency State
                  </h2>
                </div>

                <div className="text-left md:text-right">
                  <p className="text-[10px] text-slate-600 uppercase font-bold">
                    Last Sensor Update
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    {formattedLastUpdated}
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* MINER */}

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">

                  <p className="text-xs text-slate-600">
                    Miner
                  </p>

                  <p className="text-sm font-bold mt-1">
                    {selectedMiner?.fullName ||
                      "--"}
                  </p>

                </div>

                {/* PRESSURE */}

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">

                  <div className="flex justify-between items-center">

                    <p className="text-xs text-slate-600">
                      Pressure
                    </p>

                    <span
                      className={
                        pressureOnline
                          ? "text-[9px] text-green-400"
                          : "text-[9px] text-red-400"
                      }
                    >
                      {pressureOnline
                        ? "ONLINE"
                        : "OFFLINE"}
                    </span>

                  </div>

                  <p className="text-sm font-bold mt-1">
                    {formatValue(
                      pressure,
                      " hPa"
                    )}
                  </p>

                </div>

                {/* MOTION */}

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">

                  <div className="flex justify-between items-center">

                    <p className="text-xs text-slate-600">
                      Motion
                    </p>

                    <span
                      className={
                        motionOnline
                          ? "text-[9px] text-green-400"
                          : "text-[9px] text-red-400"
                      }
                    >
                      {motionOnline
                        ? "ONLINE"
                        : "OFFLINE"}
                    </span>

                  </div>

                  <p
                    className={`
                      text-sm
                      font-bold
                      mt-1
                      ${
                        motionOnline
                          ? motionSafety.color
                          : "text-red-400"
                      }
                    `}
                  >
                    {motion}
                  </p>

                </div>

                {/* EMERGENCY */}

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">

                  <p className="text-xs text-slate-600">
                    Emergency
                  </p>

                  <p
                    className={`
                      text-sm
                      font-bold
                      mt-1
                      ${
                        sosAlert ||
                        fallDetected
                          ? "text-red-400"
                          : "text-green-400"
                      }
                    `}
                  >
                    {sosAlert ||
                    fallDetected
                      ? "🚨 ATTENTION"
                      : "NORMAL"}
                  </p>

                </div>

              </div>
            </div>

            {/* =================================================
                SENSOR STATUS SUMMARY
            ================================================= */}

            {selectedMiner && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-5">

                <div className="mb-5">

                  <p className="text-xs uppercase text-slate-500 font-bold">
                    Sensor Connectivity
                  </p>

                  <h2 className="text-lg font-bold mt-1">
                    Motion & Emergency Devices
                  </h2>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* MPU */}

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-3">

                        <span className="text-xl">
                          🏃
                        </span>

                        <div>
                          <p className="text-sm font-bold">
                            MPU6050
                          </p>

                          <p className="text-[10px] text-slate-600">
                            Motion / Fall
                          </p>
                        </div>

                      </div>

                      <SensorBadge
                        online={
                          motionOnline
                        }
                      />

                    </div>

                  </div>

                  {/* BMP */}

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-3">

                        <span className="text-xl">
                          📊
                        </span>

                        <div>
                          <p className="text-sm font-bold">
                            BMP280
                          </p>

                          <p className="text-[10px] text-slate-600">
                            Pressure
                          </p>
                        </div>

                      </div>

                      <SensorBadge
                        online={
                          pressureOnline
                        }
                      />

                    </div>

                  </div>

                  {/* SOS */}

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-3">

                        <span className="text-xl">
                          🚨
                        </span>

                        <div>
                          <p className="text-sm font-bold">
                            SOS Button
                          </p>

                          <p className="text-[10px] text-slate-600">
                            Emergency
                          </p>
                        </div>

                      </div>

                      <SensorBadge
                        online={
                          sosOnline
                        }
                      />

                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* =================================================
                NO DATA
            ================================================= */}

            {!loading &&
              miners.length === 0 && (
                <div className="mt-5 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">

                  <div className="flex items-start gap-3">

                    <span className="text-xl">
                      ⚠️
                    </span>

                    <div>
                      <p className="text-sm font-bold text-yellow-400">
                        No miner data available
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Waiting for the
                        ESP32 / LoRa
                        receiver to send
                        motion and
                        emergency data.
                      </p>
                    </div>

                  </div>

                </div>
              )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default MotionEmergency;