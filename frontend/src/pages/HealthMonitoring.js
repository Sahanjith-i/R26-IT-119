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

const SENSOR_CONFIG = [
  {
    key: "temperature",
    statusKey: "temperature",
    title: "Body Temperature",
    sensor: "GY-906 MLX90614",
    icon: "🌡️",
    unit: "°C",
    decimals: 1,
    color: "orange",
    description: "Infrared body temperature monitoring",
  },
  {
    key: "heartRate",
    statusKey: "heartRate",
    title: "Heart Rate",
    sensor: "Pulse Rate Sensor",
    icon: "❤️",
    unit: "BPM",
    decimals: 0,
    color: "pink",
    description: "Real-time pulse rate monitoring",
  },
  {
    key: "spo2",
    statusKey: "spo2",
    title: "Blood Oxygen",
    sensor: "MAX30102",
    icon: "🫁",
    unit: "%",
    decimals: 1,
    color: "cyan",
    description: "Optical blood oxygen monitoring",
  },
  {
    key: "motion",
    statusKey: "motion",
    title: "Motion / Activity",
    sensor: "MPU6050",
    icon: "🏃",
    unit: "",
    decimals: 0,
    color: "violet",
    description: "Motion and fall detection",
  },
];


// =====================================================
// SMALL HELPERS
// =====================================================

function isValidValue(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    !Number.isNaN(Number(value))
  );
}


function formatValue(value, unit = "", decimals = 1) {
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

  return `${number.toFixed(decimals)}${unit}`;
}


function mergeSensorData(previous, incoming) {
  if (!previous) {
    return incoming;
  }

  const merged = {
    ...previous,
    ...incoming,
  };

  // ---------------------------------------------------
  // KEEP LAST VALID SENSOR VALUES
  // ---------------------------------------------------

  const valueFields = [
    "temperature",
    "heartRate",
    "bpm",
    "spo2",
    "mq135",
    "mq4",
    "mq7",
    "pressure",
    "latitude",
    "longitude",
  ];

  valueFields.forEach((field) => {
    if (
      incoming[field] === null ||
      incoming[field] === undefined ||
      incoming[field] === ""
    ) {
      merged[field] = previous[field];
    }
  });

  return merged;
}


// =====================================================
// HEALTH MONITORING PAGE
// =====================================================

function HealthMonitoring() {
  const [miners, setMiners] = useState([]);
  const [selectedMiner, setSelectedMiner] = useState(null);

  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const [notification, setNotification] = useState(null);

  const previousSensorStatus = useRef({});
  const notificationTimer = useRef(null);


  // ===================================================
  // SHOW NOTIFICATION
  // ===================================================

  const showNotification = useCallback(
    (type, title, message) => {
      setNotification({
        id: Date.now(),
        type,
        title,
        message,
      });

      if (notificationTimer.current) {
        clearTimeout(notificationTimer.current);
      }

      notificationTimer.current = setTimeout(() => {
        setNotification(null);
      }, 5000);
    },
    []
  );


  // ===================================================
  // FETCH MINERS
  // ===================================================

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
        "Failed to load health data:",
        error
      );

      showNotification(
        "error",
        "Connection Error",
        "Unable to load miner monitoring data."
      );
    } finally {
      setLoading(false);
    }
  }, [showNotification]);


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchMiners();
  }, [fetchMiners]);


  // ===================================================
  // SOCKET.IO
  // ===================================================

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });


    // -------------------------------------------------
    // CONNECT
    // -------------------------------------------------

    socket.on("connect", () => {
      console.log(
        "Health monitoring connected 🔌"
      );

      setConnected(true);

      socket.emit(
        "requestMonitoringData"
      );
    });


    // -------------------------------------------------
    // DISCONNECT
    // -------------------------------------------------

    socket.on("disconnect", () => {
      console.log(
        "Health monitoring disconnected ❌"
      );

      setConnected(false);
    });


    // -------------------------------------------------
    // CONNECTION ERROR
    // -------------------------------------------------

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


    // -------------------------------------------------
    // LIVE SENSOR DATA
    // -------------------------------------------------

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

          return current.map((miner) => {
            if (
              miner.userId !==
              updatedMiner.userId
            ) {
              return miner;
            }

            return mergeSensorData(
              miner,
              updatedMiner
            );
          });
        });


        setSelectedMiner((current) => {
          if (!current) {
            return updatedMiner;
          }

          if (
            current.userId !==
            updatedMiner.userId
          ) {
            return current;
          }

          return mergeSensorData(
            current,
            updatedMiner
          );
        });


        // ---------------------------------------------
        // ALERT CHECK
        // ---------------------------------------------

        if (
          updatedMiner.sosAlert === true
        ) {
          showNotification(
            "danger",
            "🚨 SOS EMERGENCY",
            `SOS button activated by ${
              updatedMiner.fullName ||
              updatedMiner.userId ||
              "miner"
            }.`
          );
        } else if (
          updatedMiner.fallDetected === true
        ) {
          showNotification(
            "danger",
            "🚨 FALL DETECTED",
            `Possible fall detected for ${
              updatedMiner.fullName ||
              updatedMiner.userId ||
              "miner"
            }.`
          );
        } else if (
          updatedMiner.status === "DANGER"
        ) {
          showNotification(
            "danger",
            "🚨 DANGER ALERT",
            updatedMiner.alertReason ||
              "Dangerous sensor condition detected."
          );
        } else if (
          updatedMiner.status === "WARNING"
        ) {
          showNotification(
            "warning",
            "⚠️ WARNING",
            updatedMiner.alertReason ||
              "Abnormal sensor reading detected."
          );
        }
      }
    );


    // -------------------------------------------------
    // SOS EVENT
    // -------------------------------------------------

    socket.on(
      "sosAlert",
      (sosData) => {
        showNotification(
          "danger",
          "🚨🚨 SOS EMERGENCY",
          `Emergency SOS activated by ${
            sosData?.fullName ||
            sosData?.userId ||
            "miner"
          }.`
        );
      }
    );


    // -------------------------------------------------
    // ALERT EVENT
    // -------------------------------------------------

    socket.on(
      "alertUpdate",
      (alertData) => {
        if (!alertData) return;

        if (
          alertData.alertType === "SOS" ||
          alertData.sosAlert === true
        ) {
          showNotification(
            "danger",
            "🚨 SOS ALERT",
            alertData.alertReason ||
              "SOS emergency activated."
          );

          return;
        }

        if (
          alertData.status === "DANGER"
        ) {
          showNotification(
            "danger",
            "🚨 DANGER ALERT",
            alertData.alertReason ||
              "Dangerous condition detected."
          );

          return;
        }

        if (
          alertData.status === "WARNING"
        ) {
          showNotification(
            "warning",
            "⚠️ WARNING ALERT",
            alertData.alertReason ||
              "Warning condition detected."
          );
        }
      }
    );


    // -------------------------------------------------
    // CLEANUP
    // -------------------------------------------------

    return () => {
      socket.disconnect();

      if (notificationTimer.current) {
        clearTimeout(
          notificationTimer.current
        );
      }
    };
  }, [showNotification]);


  // ===================================================
  // SENSOR STATUS
  // ===================================================

  const getSensorStatus = useCallback(
    (sensorKey) => {
      if (!selectedMiner) {
        return false;
      }

      const sensorStatus =
        selectedMiner.sensorStatus || {};

      // -----------------------------------------------
      // BACKEND SENSOR STATUS
      // -----------------------------------------------

      if (
        typeof sensorStatus[sensorKey] ===
        "boolean"
      ) {
        return sensorStatus[sensorKey];
      }


      // -----------------------------------------------
      // FALLBACK
      // -----------------------------------------------

      if (sensorKey === "motion") {
        return (
          selectedMiner.motionStatus !==
          undefined &&
          selectedMiner.motionStatus !== null
        );
      }

      if (sensorKey === "heartRate") {
        return (
          isValidValue(
            selectedMiner.heartRate
          ) ||
          isValidValue(
            selectedMiner.bpm
          )
        );
      }

      if (sensorKey === "spo2") {
        return isValidValue(
          selectedMiner.spo2
        );
      }

      if (sensorKey === "temperature") {
        return isValidValue(
          selectedMiner.temperature
        );
      }

      return false;
    },
    [selectedMiner]
  );


  // ===================================================
  // SENSOR OFFLINE NOTIFICATIONS
  // ===================================================

  useEffect(() => {
    if (!selectedMiner) return;

    const currentStatus = {
      temperature: getSensorStatus(
        "temperature"
      ),

      heartRate: getSensorStatus(
        "heartRate"
      ),

      spo2: getSensorStatus(
        "spo2"
      ),

      motion: getSensorStatus(
        "motion"
      ),
    };


    const sensorNames = {
      temperature:
        "GY-906 MLX90614",

      heartRate:
        "Pulse Rate Sensor",

      spo2:
        "MAX30102",

      motion:
        "MPU6050",
    };


    Object.keys(currentStatus).forEach(
      (key) => {
        const previous =
          previousSensorStatus.current[
            key
          ];

        const current =
          currentStatus[key];


        // -------------------------------------------
        // ONLINE → OFFLINE
        // -------------------------------------------

        if (
          previous === true &&
          current === false
        ) {
          showNotification(
            "offline",
            "📡 SENSOR OFFLINE",
            `${sensorNames[key]} is offline. Last received data is being displayed.`
          );
        }


        // -------------------------------------------
        // OFFLINE → ONLINE
        // -------------------------------------------

        if (
          previous === false &&
          current === true
        ) {
          showNotification(
            "success",
            "✅ SENSOR ONLINE",
            `${sensorNames[key]} is connected again.`
          );
        }
      }
    );


    previousSensorStatus.current =
      currentStatus;
  }, [
    selectedMiner,
    getSensorStatus,
    showNotification,
  ]);


  // ===================================================
  // HEALTH STATUS
  // ===================================================

  const healthStatus = useMemo(() => {
    if (!selectedMiner) {
      return {
        label: "NO DATA",
        color: "text-slate-400",
        bg: "bg-slate-500/10",
        border: "border-slate-500/20",
        dot: "bg-slate-500",
      };
    }


    if (selectedMiner.sosAlert) {
      return {
        label: "SOS EMERGENCY",
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        dot: "bg-red-500",
      };
    }


    if (
      selectedMiner.fallDetected
    ) {
      return {
        label: "FALL DETECTED",
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        dot: "bg-red-500",
      };
    }


    if (
      selectedMiner.status ===
      "DANGER"
    ) {
      return {
        label: "CRITICAL",
        color: "text-red-400",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        dot: "bg-red-500",
      };
    }


    if (
      selectedMiner.status ===
      "WARNING"
    ) {
      return {
        label: "WARNING",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        dot: "bg-yellow-500",
      };
    }


    return {
      label: "NORMAL",
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      dot: "bg-green-500",
    };
  }, [selectedMiner]);


  // ===================================================
  // SENSOR OFFLINE COUNT
  // ===================================================

  const offlineSensors = useMemo(() => {
    if (!selectedMiner) return [];

    return SENSOR_CONFIG.filter(
      (sensor) =>
        !getSensorStatus(
          sensor.statusKey
        )
    );
  }, [
    selectedMiner,
    getSensorStatus,
  ]);


  // ===================================================
  // LAST UPDATE
  // ===================================================

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


  // ===================================================
  // SELECT MINER
  // ===================================================

  const handleSelectMiner = (miner) => {
    setSelectedMiner(miner);
  };


  // ===================================================
  // SENSOR CARD
  // ===================================================

  const renderSensorCard = (
    config
  ) => {
    const online =
      getSensorStatus(
        config.statusKey
      );

    let value = "--";


    // -----------------------------------------------
    // VALUES
    // -----------------------------------------------

    if (
      config.key ===
      "temperature"
    ) {
      value = formatValue(
        selectedMiner?.temperature,
        config.unit,
        config.decimals
      );
    }


    if (
      config.key ===
      "heartRate"
    ) {
      value = formatValue(
        selectedMiner?.heartRate ??
          selectedMiner?.bpm,
        "",
        config.decimals
      );
    }


    if (
      config.key === "spo2"
    ) {
      value = formatValue(
        selectedMiner?.spo2,
        config.unit,
        config.decimals
      );
    }


    if (
      config.key === "motion"
    ) {
      value =
        selectedMiner?.fallDetected
          ? "FALL DETECTED"
          : selectedMiner
              ?.motionStatus ||
            "NORMAL";
    }


    return (
      <div
        key={config.key}
        className={`
          bg-slate-900
          border
          ${
            online
              ? "border-slate-800"
              : "border-red-500/30"
          }
          rounded-2xl
          p-6
          transition-all
          hover:border-cyan-500/30
          ${
            !online
              ? "shadow-lg shadow-red-950/20"
              : ""
          }
        `}
      >

        {/* -----------------------------------------
            HEADER
        ----------------------------------------- */}

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
                  online
                    ? "bg-cyan-500/10 border border-cyan-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }
              `}
            >
              {config.icon}
            </div>


            <div>

              <p className="text-xs text-slate-500 uppercase font-bold">
                {config.sensor}
              </p>

              <h2 className="text-lg font-bold mt-1">
                {config.title}
              </h2>

            </div>

          </div>


          {/* STATUS */}

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
              ? "ONLINE"
              : "OFFLINE"}
          </span>

        </div>


        {/* -----------------------------------------
            VALUE
        ----------------------------------------- */}

        <div className="mt-8">

          <p className="text-xs text-slate-500">
            {config.title}
          </p>


          <div className="flex items-end gap-2 mt-2">

            <span
              className={`
                text-4xl
                font-bold
                tracking-tight
                ${
                  online
                    ? "text-white"
                    : "text-slate-400"
                }
              `}
            >
              {value}
            </span>

            {config.key ===
              "heartRate" && (
              <span className="text-sm text-slate-500 mb-1">
                BPM
              </span>
            )}

          </div>


          {/* OFFLINE MESSAGE */}

          {!online && (
            <div className="mt-4 flex items-center gap-2">

              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />

              <span className="text-xs text-red-400">
                Sensor offline — showing last received data
              </span>

            </div>
          )}

          {online && (
            <div className="mt-4 flex items-center gap-2">

              <span className="w-2 h-2 rounded-full bg-green-500" />

              <span className="text-xs text-green-400">
                Monitoring active
              </span>

            </div>
          )}

        </div>


        {/* -----------------------------------------
            FOOTER
        ----------------------------------------- */}

        <div className="mt-6 pt-4 border-t border-slate-800">

          <div className="flex justify-between gap-4 text-xs">

            <span className="text-slate-500">
              Status
            </span>

            <span
              className={
                online
                  ? "text-green-400 font-semibold"
                  : "text-red-400 font-semibold"
              }
            >
              {online
                ? "Connected"
                : "Disconnected"}
            </span>

          </div>


          <div className="flex justify-between gap-4 text-xs mt-2">

            <span className="text-slate-500">
              Function
            </span>

            <span className="text-slate-300 text-right">
              {config.description}
            </span>

          </div>

        </div>

      </div>
    );
  };


  // ===================================================
  // MAIN UI
  // ===================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <Sidebar />


      {/* =================================================
          MAIN
      ================================================= */}

      <div className="ml-60">

        <Navbar />


        <main className="p-6 lg:p-8">

          <div className="max-w-7xl mx-auto">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">

              <div>

                <div className="flex items-center gap-3 mb-3">

                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold tracking-wide">
                    HEALTH MONITORING
                  </span>


                  <span className="flex items-center gap-2 text-xs font-semibold">

                    <span
                      className={`
                        w-2.5
                        h-2.5
                        rounded-full
                        ${
                          connected
                            ? "bg-green-500 animate-pulse"
                            : "bg-red-500"
                        }
                      `}
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
                  Miner Health Monitoring
                </h1>


                <p className="text-slate-500 mt-2 max-w-2xl">
                  Real-time health monitoring from the smart wearable jacket.
                </p>

              </div>


              {/* HEALTH STATUS */}

              <div
                className={`
                  flex
                  items-center
                  gap-3
                  px-5
                  py-3
                  rounded-xl
                  border
                  ${healthStatus.border}
                  ${healthStatus.bg}
                `}
              >

                <span
                  className={`
                    w-3
                    h-3
                    rounded-full
                    ${healthStatus.dot}
                    ${
                      healthStatus.label !==
                      "NORMAL"
                        ? "animate-pulse"
                        : ""
                    }
                  `}
                />

                <div>

                  <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                    Health Status
                  </p>

                  <p
                    className={`
                      text-sm
                      font-bold
                      ${healthStatus.color}
                    `}
                  >
                    {healthStatus.label}
                  </p>

                </div>

              </div>

            </div>


            {/* =================================================
                OFFLINE SUMMARY
            ================================================= */}

            {offlineSensors.length > 0 && (
              <div className="mb-6 bg-red-500/5 border border-red-500/20 rounded-2xl p-5">

                <div className="flex items-start gap-4">

                  <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl">
                    📡
                  </div>


                  <div className="flex-1">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">

                      <div>

                        <h3 className="text-sm font-bold text-red-400">
                          Sensor Connection Warning
                        </h3>

                        <p className="text-xs text-slate-500 mt-1">
                          One or more monitoring sensors are currently offline.
                        </p>

                      </div>


                      <span className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                        {offlineSensors.length} OFFLINE
                      </span>

                    </div>


                    <div className="flex flex-wrap gap-2 mt-4">

                      {offlineSensors.map(
                        (sensor) => (
                          <span
                            key={
                              sensor.key
                            }
                            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-red-500/20 text-xs text-red-300"
                          >
                            🔴{" "}
                            {
                              sensor.sensor
                            }
                          </span>
                        )
                      )}

                    </div>

                  </div>

                </div>

              </div>
            )}


            {/* =================================================
                MINER SELECTOR
            ================================================= */}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                <div>

                  <p className="text-xs uppercase text-slate-500 font-bold tracking-wider">
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
                    onChange={(event) => {

                      const miner =
                        miners.find(
                          (item) =>
                            item.userId ===
                            event.target.value
                        );

                      if (miner) {
                        handleSelectMiner(
                          miner
                        );
                      }

                    }}
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
                      focus:border-cyan-500
                      transition
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
                HEALTH SENSOR CARDS
            ================================================= */}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

              {SENSOR_CONFIG.map(
                (sensor) =>
                  renderSensorCard(
                    sensor
                  )
              )}

            </div>


            {/* =================================================
                LIVE HEALTH SUMMARY
            ================================================= */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">


              {/* HEART RATE */}

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs uppercase text-slate-500 font-bold">
                      Heart Rate
                    </p>

                    <p className="text-2xl font-bold mt-2">

                      {formatValue(
                        selectedMiner?.heartRate ??
                          selectedMiner?.bpm,
                        "",
                        0
                      )}

                      <span className="text-sm text-slate-500 ml-1">
                        BPM
                      </span>

                    </p>

                  </div>


                  <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                    ❤️
                  </div>

                </div>


                <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-pink-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          Number(
                            selectedMiner?.heartRate ??
                              selectedMiner?.bpm
                          ) || 0,
                          0
                        ),
                        200
                      ) / 2}%`,
                    }}
                  />

                </div>


                <p className="text-[11px] text-slate-600 mt-2">
                  Normal monitoring range: 40–100 BPM
                </p>

              </div>


              {/* TEMPERATURE */}

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs uppercase text-slate-500 font-bold">
                      Body Temperature
                    </p>

                    <p className="text-2xl font-bold mt-2">
                      {formatValue(
                        selectedMiner?.temperature,
                        "°C",
                        1
                      )}
                    </p>

                  </div>


                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    🌡️
                  </div>

                </div>


                <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          Number(
                            selectedMiner?.temperature
                          ) || 0,
                          0
                        ),
                        45
                      ) / 45 * 100}%`,
                    }}
                  />

                </div>


                <p className="text-[11px] text-slate-600 mt-2">
                  Warning above 37.5°C
                </p>

              </div>


              {/* SPO2 */}

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs uppercase text-slate-500 font-bold">
                      Blood Oxygen
                    </p>

                    <p className="text-2xl font-bold mt-2">
                      {formatValue(
                        selectedMiner?.spo2,
                        "%",
                        1
                      )}
                    </p>

                  </div>


                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    🫁
                  </div>

                </div>


                <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          Number(
                            selectedMiner?.spo2
                          ) || 0,
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />

                </div>


                <p className="text-[11px] text-slate-600 mt-2">
                  Warning below 92%
                </p>

              </div>

            </div>


            {/* =================================================
                MOTION / SOS STATUS
            ================================================= */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">


              {/* MOTION */}

              <div
                className={`
                  bg-slate-900
                  border
                  ${
                    selectedMiner?.fallDetected
                      ? "border-red-500/30"
                      : "border-slate-800"
                  }
                  rounded-2xl
                  p-6
                `}
              >

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs uppercase text-slate-500 font-bold">
                      Motion Monitoring
                    </p>

                    <h2 className="text-lg font-bold mt-1">
                      MPU6050
                    </h2>

                  </div>


                  <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center text-xl">
                    🏃
                  </div>

                </div>


                <div className="mt-6 flex items-center justify-between">

                  <div>

                    <p className="text-3xl font-bold">
                      {selectedMiner?.fallDetected
                        ? "FALL"
                        : selectedMiner?.motionStatus ||
                          "NORMAL"}
                    </p>

                    <p
                      className={`
                        text-xs
                        mt-2
                        ${
                          selectedMiner?.fallDetected
                            ? "text-red-400"
                            : "text-green-400"
                        }
                      `}
                    >
                      {selectedMiner?.fallDetected
                        ? "⚠️ Fall detected"
                        : "✓ Motion normal"}
                    </p>

                  </div>


                  <span
                    className={`
                      px-3
                      py-1.5
                      rounded-lg
                      text-xs
                      font-bold
                      ${
                        getSensorStatus(
                          "motion"
                        )
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }
                    `}
                  >
                    {getSensorStatus(
                      "motion"
                    )
                      ? "ONLINE"
                      : "OFFLINE"}
                  </span>

                </div>

              </div>


              {/* SOS */}

              <div
                className={`
                  bg-slate-900
                  border
                  ${
                    selectedMiner?.sosAlert
                      ? "border-red-500/50 bg-red-500/5"
                      : "border-slate-800"
                  }
                  rounded-2xl
                  p-6
                `}
              >

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs uppercase text-slate-500 font-bold">
                      Emergency System
                    </p>

                    <h2 className="text-lg font-bold mt-1">
                      SOS Push Button
                    </h2>

                  </div>


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
                        selectedMiner?.sosAlert
                          ? "bg-red-500/20"
                          : "bg-slate-800"
                      }
                    `}
                  >
                    🚨
                  </div>

                </div>


                <div className="mt-6 flex items-center justify-between">

                  <div>

                    <p
                      className={`
                        text-2xl
                        font-bold
                        ${
                          selectedMiner?.sosAlert
                            ? "text-red-400"
                            : "text-green-400"
                        }
                      `}
                    >
                      {selectedMiner?.sosAlert
                        ? "SOS ACTIVE"
                        : "SYSTEM READY"}
                    </p>


                    <p className="text-xs text-slate-500 mt-2">
                      {selectedMiner?.sosAlert
                        ? "Emergency button has been activated."
                        : "Emergency button monitoring active."}
                    </p>

                  </div>


                  <span
                    className={`
                      px-3
                      py-1.5
                      rounded-lg
                      text-xs
                      font-bold
                      ${
                        selectedMiner?.sosAlert
                          ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                          : "bg-green-500/10 text-green-400 border border-green-500/20"
                      }
                    `}
                  >
                    {selectedMiner?.sosAlert
                      ? "EMERGENCY"
                      : "READY"}
                  </span>

                </div>

              </div>

            </div>


            {/* =================================================
                MONITORING INFORMATION
            ================================================= */}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-5">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">

                <div>

                  <p className="text-xs uppercase text-slate-500 font-bold">
                    Monitoring Information
                  </p>

                  <h2 className="text-lg font-bold mt-1">
                    Current Jacket Status
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


                {/* MINER ID */}

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">

                  <p className="text-xs text-slate-600">
                    Miner ID
                  </p>

                  <p className="text-sm font-bold mt-1">
                    {selectedMiner?.userId ||
                      "--"}
                  </p>

                </div>


                {/* HEALTH STATUS */}

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">

                  <p className="text-xs text-slate-600">
                    Health Status
                  </p>

                  <p
                    className={`
                      text-sm
                      font-bold
                      mt-1
                      ${healthStatus.color}
                    `}
                  >
                    {healthStatus.label}
                  </p>

                </div>


                {/* CONNECTION */}

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">

                  <p className="text-xs text-slate-600">
                    Data Connection
                  </p>

                  <div className="flex items-center gap-2 mt-1">

                    <span
                      className={`
                        w-2
                        h-2
                        rounded-full
                        ${
                          connected
                            ? "bg-green-500 animate-pulse"
                            : "bg-red-500"
                        }
                      `}
                    />

                    <p
                      className={`
                        text-sm
                        font-bold
                        ${
                          connected
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      `}
                    >
                      {connected
                        ? "LIVE"
                        : "OFFLINE"}
                    </p>

                  </div>

                </div>

              </div>

            </div>


            {/* =================================================
                SENSOR STATUS GRID
            ================================================= */}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-5">

              <div className="mb-5">

                <p className="text-xs uppercase text-slate-500 font-bold">
                  Sensor Network
                </p>

                <h2 className="text-lg font-bold mt-1">
                  Individual Sensor Status
                </h2>

              </div>


              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                {SENSOR_CONFIG.map(
                  (sensor) => {

                    const online =
                      getSensorStatus(
                        sensor.statusKey
                      );

                    return (
                      <div
                        key={
                          sensor.key
                        }
                        className={`
                          rounded-xl
                          p-4
                          border
                          ${
                            online
                              ? "bg-green-500/5 border-green-500/20"
                              : "bg-red-500/5 border-red-500/20"
                          }
                        `}
                      >

                        <div className="flex items-center justify-between">

                          <span className="text-lg">
                            {sensor.icon}
                          </span>

                          <span
                            className={`
                              w-2.5
                              h-2.5
                              rounded-full
                              ${
                                online
                                  ? "bg-green-500"
                                  : "bg-red-500 animate-pulse"
                              }
                            `}
                          />

                        </div>


                        <p className="text-xs font-bold mt-3">
                          {sensor.sensor}
                        </p>


                        <p
                          className={`
                            text-[10px]
                            font-bold
                            mt-1
                            ${
                              online
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          `}
                        >
                          {online
                            ? "ONLINE"
                            : "OFFLINE"}
                        </p>

                      </div>
                    );
                  }
                )}

              </div>

            </div>


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
                        Waiting for the ESP32 / LoRa receiver to send health monitoring data.
                      </p>

                    </div>

                  </div>

                </div>
              )}

          </div>

        </main>

      </div>


      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-40">

          <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 shadow-xl">

            <div className="flex items-center gap-3">

              <div className="w-5 h-5 border-2 border-slate-700 border-t-cyan-400 rounded-full animate-spin" />

              <span className="text-sm text-slate-400">
                Loading health data...
              </span>

            </div>

          </div>

        </div>
      )}


      {/* =====================================================
          NOTIFICATION POPUP
      ===================================================== */}

      {notification && (
        <div className="fixed top-6 right-6 z-[100] w-[360px] max-w-[calc(100vw-32px)]">

          <div
            className={`
              rounded-2xl
              border
              shadow-2xl
              backdrop-blur-xl
              p-5
              ${
                notification.type ===
                "danger"
                  ? "bg-red-950/95 border-red-500/40"
                  : notification.type ===
                    "warning"
                  ? "bg-yellow-950/95 border-yellow-500/40"
                  : notification.type ===
                    "offline"
                  ? "bg-orange-950/95 border-orange-500/40"
                  : notification.type ===
                    "error"
                  ? "bg-slate-900 border-red-500/40"
                  : "bg-green-950/95 border-green-500/40"
              }
            `}
          >

            <div className="flex items-start gap-4">

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
                    notification.type ===
                    "danger"
                      ? "bg-red-500/20"
                      : notification.type ===
                        "warning"
                      ? "bg-yellow-500/20"
                      : notification.type ===
                        "offline"
                      ? "bg-orange-500/20"
                      : "bg-green-500/20"
                  }
                `}
              >
                {notification.type ===
                "danger"
                  ? "🚨"
                  : notification.type ===
                    "warning"
                  ? "⚠️"
                  : notification.type ===
                    "offline"
                  ? "📡"
                  : notification.type ===
                    "error"
                  ? "❌"
                  : "✅"}
              </div>


              <div className="flex-1">

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <p className="text-sm font-bold text-white">
                      {notification.title}
                    </p>

                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
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


            {/* PROGRESS */}

            <div className="mt-4 h-1 bg-slate-800/80 rounded-full overflow-hidden">

              <div
                className={`
                  h-full
                  rounded-full
                  animate-[shrink_5s_linear_forwards]
                  ${
                    notification.type ===
                    "danger"
                      ? "bg-red-500"
                      : notification.type ===
                        "warning"
                      ? "bg-yellow-500"
                      : notification.type ===
                        "offline"
                      ? "bg-orange-500"
                      : "bg-green-500"
                  }
                `}
                style={{
                  width: "100%",
                  animation:
                    "notificationProgress 5s linear forwards",
                }}
              />

            </div>

          </div>

        </div>
      )}


      {/* =====================================================
          POPUP ANIMATION
      ===================================================== */}

      <style>
        {`
          @keyframes notificationProgress {
            from {
              width: 100%;
            }

            to {
              width: 0%;
            }
          }
        `}
      </style>

    </div>
  );
}


export default HealthMonitoring;