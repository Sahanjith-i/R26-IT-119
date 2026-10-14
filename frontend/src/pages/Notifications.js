import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Link, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";


// =====================================================
// CONFIG
// =====================================================

const API_URL = "http://localhost:5000";


// =====================================================
// SENSOR NAMES
// =====================================================

const SENSOR_NAMES = {
  heartRate: "Pulse Rate Sensor",
  spo2: "MAX30102",
  motion: "MPU6050",
  temperature: "GY-906 MLX90614",
  ammonia: "MQ135",
  methane: "MQ4",
  carbonMonoxide: "MQ7",
  pressure: "BMP280",
  gps: "GPS Module",
  sosButton: "SOS Push Button",
};


// =====================================================
// SENSOR ICONS
// =====================================================

const SENSOR_ICONS = {
  heartRate: "❤️",
  spo2: "🫁",
  motion: "🏃",
  temperature: "🌡️",
  ammonia: "🧪",
  methane: "🔥",
  carbonMonoxide: "☠️",
  pressure: "📊",
  gps: "📍",
  sosButton: "🆘",
};


// =====================================================
// NORMALIZE TYPE
// =====================================================

function normalizeType(type) {
  return String(type || "INFO").toUpperCase();
}


// =====================================================
// NOTIFICATIONS PAGE
// =====================================================

function Notifications() {
  const navigate = useNavigate();

  // ===================================================
  // STATE
  // ===================================================

  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [toast, setToast] = useState(null);

  // ===================================================
  // REFS
  // ===================================================

  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const eventCacheRef = useRef({});
  const soundEnabledRef = useRef(false);

  // ===================================================
  // SOUND STATE REF
  // ===================================================

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);


  // ===================================================
  // LOAD NOTIFICATIONS
  // ===================================================

  const loadNotifications = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/notifications`
      );

      let data = [];

      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (
        response.data &&
        Array.isArray(response.data.notifications)
      ) {
        data = response.data.notifications;
      } else if (
        response.data &&
        Array.isArray(response.data.data)
      ) {
        data = response.data.data;
      }

      setNotifications(data);
    } catch (error) {
      console.error(
        "Notification loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);


  // ===================================================
  // TOAST
  // ===================================================

  const showToast = useCallback((notification) => {
    setToast(notification);

    setTimeout(() => {
      setToast(null);
    }, 7000);
  }, []);


  // ===================================================
  // DUPLICATE EVENT CHECK
  // ===================================================

  const isDuplicateEvent = useCallback((key) => {
    const now = Date.now();
    const previous = eventCacheRef.current[key];

    if (previous && now - previous < 5000) {
      return true;
    }

    eventCacheRef.current[key] = now;

    return false;
  }, []);


  // ===================================================
  // ENABLE SOUND
  // ===================================================

  const enableSound = async () => {
    try {
      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) {
        alert(
          "Your browser does not support audio."
        );
        return;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      if (
        audioContextRef.current.state ===
        "suspended"
      ) {
        await audioContextRef.current.resume();
      }

      const oscillator =
        audioContextRef.current.createOscillator();

      const gain =
        audioContextRef.current.createGain();

      oscillator.frequency.value = 700;
      gain.gain.value = 0.02;

      oscillator.connect(gain);
      gain.connect(
        audioContextRef.current.destination
      );

      oscillator.start();

      oscillator.stop(
        audioContextRef.current.currentTime + 0.05
      );

      setSoundEnabled(true);
    } catch (error) {
      console.error(
        "Audio initialization error:",
        error
      );
    }
  };


  // ===================================================
  // BEEP
  // ===================================================

  const playBeep = (
    frequency = 1000,
    duration = 180,
    delay = 0,
    volume = 0.15
  ) => {
    if (!soundEnabledRef.current) {
      return;
    }

    if (!audioContextRef.current) {
      return;
    }

    setTimeout(() => {
      try {
        const context = audioContextRef.current;

        const oscillator =
          context.createOscillator();

        const gain =
          context.createGain();

        oscillator.type = "square";
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(
          volume,
          context.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
          0.001,
          context.currentTime +
            duration / 1000
        );

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start();

        oscillator.stop(
          context.currentTime +
            duration / 1000
        );
      } catch (error) {
        console.error(
          "Beep error:",
          error
        );
      }
    }, delay);
  };


  // ===================================================
  // ALERT SOUNDS
  // ===================================================

  const playSOSSound = () => {
    playBeep(3000, 180, 0, 0.25);
    playBeep(4000, 180, 250, 0.25);
    playBeep(3000, 180, 500, 0.25);
    playBeep(4000, 180, 750, 0.25);
  };


  const playDangerSound = () => {
    playBeep(2500, 180, 0, 0.20);
    playBeep(3500, 180, 300, 0.20);
    playBeep(2500, 180, 600, 0.20);
  };


  const playWarningSound = () => {
    playBeep(1800, 180, 0, 0.15);
    playBeep(1800, 180, 350, 0.15);
  };


  const playOfflineSound = () => {
    playBeep(1200, 200, 0, 0.18);
    playBeep(900, 200, 350, 0.18);
  };


  // ===================================================
  // ADD NOTIFICATION
  // ===================================================

  const addNotification = useCallback(
    (notification, soundFunction = null) => {
      if (!notification) {
        return;
      }

      setNotifications((current) => {
        const id =
          notification._id ||
          notification.id;

        if (id) {
          const exists = current.some(
            (item) =>
              item._id === id ||
              item.id === id
          );

          if (exists) {
            return current;
          }
        }

        return [
          notification,
          ...current,
        ];
      });

      showToast(notification);

      if (soundFunction) {
        soundFunction();
      }
    },
    [showToast]
  );


  // ===================================================
  // CREATE NOTIFICATION
  // ===================================================

  const createNotification = useCallback(
    ({
      type = "INFO",
      title = "SYSTEM INFORMATION",
      message = "",
      sensor = "",
      sensorValue = null,
      miner = {},
    }) => {
      return {
        _id:
          `live-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}`,

        type,
        title,
        message,
        sensor,
        sensorValue,

        minerId:
          miner.userId ||
          miner.minerId ||
          miner.id ||
          "UNKNOWN",

        minerName:
          miner.fullName ||
          miner.minerName ||
          "Unknown Miner",

        latitude:
          miner.latitude ??
          null,

        longitude:
          miner.longitude ??
          null,

        read: false,

        createdAt:
          new Date().toISOString(),
      };
    },
    []
  );


  // ===================================================
  // SOCKET.IO
  // ===================================================

  useEffect(() => {
    const socket = io(API_URL, {
      transports: [
        "websocket",
        "polling",
      ],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;


    // -------------------------------------------------
    // CONNECT
    // -------------------------------------------------

    socket.on("connect", () => {
      console.log(
        "Notification Socket Connected:",
        socket.id
      );

      setSocketConnected(true);

      socket.emit(
        "requestMonitoringData"
      );
    });


    // -------------------------------------------------
    // DISCONNECT
    // -------------------------------------------------

    socket.on("disconnect", (reason) => {
      console.log(
        "Notification Socket Disconnected:",
        reason
      );

      setSocketConnected(false);
    });


    // -------------------------------------------------
    // CONNECTION ERROR
    // -------------------------------------------------

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "Socket connection error:",
          error.message
        );

        setSocketConnected(false);
      }
    );


    // =================================================
    // GENERIC NOTIFICATION
    // =================================================

    socket.on("notification", (data) => {
      if (!data) {
        return;
      }

      addNotification(data);
    });


    // =================================================
    // SOS ALERT
    // =================================================

    socket.on("sosAlert", (data) => {
      if (!data) {
        return;
      }

      const miner =
        data.miner || data;

      const minerId =
        miner.userId ||
        data.minerId ||
        "UNKNOWN";

      const key =
        `SOS-${minerId}`;

      if (isDuplicateEvent(key)) {
        return;
      }

      const notification =
        createNotification({
          type: "SOS",

          title:
            "🚨 SOS EMERGENCY",

          message:
            data.message ||
            "SOS push button has been activated by the miner.",

          sensor:
            "SOS Push Button",

          sensorValue:
            true,

          miner,
        });

      addNotification(
        notification,
        playSOSSound
      );
    });


    // =================================================
    // FALL ALERT
    // =================================================

    socket.on("fallAlert", (data) => {
      if (!data) {
        return;
      }

      const miner =
        data.miner || data;

      const minerId =
        miner.userId ||
        data.minerId ||
        "UNKNOWN";

      const key =
        `FALL-${minerId}`;

      if (isDuplicateEvent(key)) {
        return;
      }

      const notification =
        createNotification({
          type: "DANGER",

          title:
            "🔴 FALL DETECTED",

          message:
            data.message ||
            "MPU6050 detected a possible miner fall.",

          sensor:
            "MPU6050",

          sensorValue:
            true,

          miner,
        });

      addNotification(
        notification,
        playDangerSound
      );
    });


    // =================================================
    // SENSOR OFFLINE
    // =================================================

    socket.on(
      "sensorOffline",
      (data) => {
        if (!data) {
          return;
        }

        const sensorKey =
          data.sensor ||
          data.sensorKey ||
          "";

        const sensorName =
          data.sensorName ||
          SENSOR_NAMES[sensorKey] ||
          sensorKey ||
          "Unknown Sensor";

        const icon =
          SENSOR_ICONS[sensorKey] ||
          "📡";

        const miner =
          data.miner || {
            userId:
              data.minerId ||
              data.userId ||
              "UNKNOWN",

            fullName:
              data.minerName ||
              "Unknown Miner",

            latitude:
              data.latitude ??
              null,

            longitude:
              data.longitude ??
              null,
          };

        const minerId =
          miner.userId ||
          "UNKNOWN";

        const key =
          `OFFLINE-${minerId}-${sensorKey}`;

        if (isDuplicateEvent(key)) {
          return;
        }

        const notification =
          createNotification({
            type: "WARNING",

            title:
              `${icon} SENSOR OFFLINE`,

            message:
              `${sensorName} is offline. Previous sensor data is being retained.`,

            sensor:
              sensorName,

            sensorValue:
              data.lastValue ??
              null,

            miner,
          });

        addNotification(
          notification,
          playOfflineSound
        );
      }
    );


    // =================================================
    // SENSOR ONLINE
    // =================================================

    socket.on(
      "sensorOnline",
      (data) => {
        if (!data) {
          return;
        }

        const sensorKey =
          data.sensor ||
          data.sensorKey ||
          "";

        const sensorName =
          data.sensorName ||
          SENSOR_NAMES[sensorKey] ||
          sensorKey ||
          "Sensor";

        const icon =
          SENSOR_ICONS[sensorKey] ||
          "📡";

        const miner =
          data.miner || {
            userId:
              data.minerId ||
              data.userId ||
              "UNKNOWN",

            fullName:
              data.minerName ||
              "Unknown Miner",
          };

        const minerId =
          miner.userId ||
          "UNKNOWN";

        const key =
          `ONLINE-${minerId}-${sensorKey}`;

        if (isDuplicateEvent(key)) {
          return;
        }

        const notification =
          createNotification({
            type: "INFO",

            title:
              `${icon} SENSOR ONLINE`,

            message:
              `${sensorName} has reconnected successfully.`,

            sensor:
              sensorName,

            sensorValue:
              data.value ??
              null,

            miner,
          });

        addNotification(
          notification
        );
      }
    );


    // =================================================
    // ALERT UPDATE
    // =================================================

    socket.on(
      "alertUpdate",
      (data) => {
        if (!data) {
          return;
        }

        const miner =
          data.miner || data;

        const minerId =
          miner.userId ||
          data.minerId ||
          "UNKNOWN";

        const status =
          normalizeType(
            data.alertType ||
            data.status
          );

        const reason =
          data.alertReason ||
          data.message ||
          "Safety condition detected.";

        const key =
          `ALERT-${minerId}-${status}-${reason}`;

        if (isDuplicateEvent(key)) {
          return;
        }


        if (status === "SOS") {
          const notification =
            createNotification({
              type: "SOS",

              title:
                "🚨 SOS EMERGENCY",

              message:
                reason,

              sensor:
                "SOS Push Button",

              sensorValue:
                true,

              miner,
            });

          addNotification(
            notification,
            playSOSSound
          );

          return;
        }


        if (status === "DANGER") {
          const notification =
            createNotification({
              type: "DANGER",

              title:
                "🔴 CRITICAL DANGER",

              message:
                reason,

              miner,
            });

          addNotification(
            notification,
            playDangerSound
          );

          return;
        }


        if (status === "WARNING") {
          const notification =
            createNotification({
              type: "WARNING",

              title:
                "⚠️ SAFETY WARNING",

              message:
                reason,

              miner,
            });

          addNotification(
            notification,
            playWarningSound
          );
        }
      }
    );


    // =================================================
    // DATA UPDATE
    // =================================================

    socket.on("dataUpdate", (data) => {
      if (!data) {
        return;
      }

      const miner =
        data.miner || data;

      const minerId =
        miner.userId ||
        data.minerId ||
        "UNKNOWN";


      // -----------------------------------------------
      // SOS
      // -----------------------------------------------

      if (data.sosAlert === true) {
        const key =
          `DATA-SOS-${minerId}`;

        if (!isDuplicateEvent(key)) {
          const notification =
            createNotification({
              type: "SOS",

              title:
                "🚨 SOS EMERGENCY",

              message:
                "SOS push button has been activated by the miner.",

              sensor:
                "SOS Push Button",

              sensorValue:
                true,

              miner,
            });

          addNotification(
            notification,
            playSOSSound
          );
        }
      }


      // -----------------------------------------------
      // FALL
      // -----------------------------------------------

      if (data.fallDetected === true) {
        const key =
          `DATA-FALL-${minerId}`;

        if (!isDuplicateEvent(key)) {
          const notification =
            createNotification({
              type: "DANGER",

              title:
                "🔴 FALL DETECTED",

              message:
                "MPU6050 detected a possible miner fall.",

              sensor:
                "MPU6050",

              sensorValue:
                true,

              miner,
            });

          addNotification(
            notification,
            playDangerSound
          );
        }
      }


      // -----------------------------------------------
      // DANGER
      // -----------------------------------------------

      if (data.status === "DANGER") {
        const reason =
          data.alertReason ||
          "Danger condition detected.";

        const key =
          `DATA-DANGER-${minerId}-${reason}`;

        if (!isDuplicateEvent(key)) {
          const notification =
            createNotification({
              type: "DANGER",

              title:
                "🔴 CRITICAL DANGER",

              message:
                reason,

              miner,
            });

          addNotification(
            notification,
            playDangerSound
          );
        }
      }


      // -----------------------------------------------
      // WARNING
      // -----------------------------------------------

      if (data.status === "WARNING") {
        const reason =
          data.alertReason ||
          "Safety warning detected.";

        const key =
          `DATA-WARNING-${minerId}-${reason}`;

        if (!isDuplicateEvent(key)) {
          const notification =
            createNotification({
              type: "WARNING",

              title:
                "⚠️ SAFETY WARNING",

              message:
                reason,

              miner,
            });

          addNotification(
            notification,
            playWarningSound
          );
        }
      }
    });


    // =================================================
    // CLEANUP
    // =================================================

    return () => {
      socket.removeAllListeners();
      socket.disconnect();

      socketRef.current = null;
    };
  }, [
    addNotification,
    createNotification,
    isDuplicateEvent,
  ]);


  // ===================================================
  // MARK AS READ
  // ===================================================

  const markAsRead = async (notification) => {
    const id =
      notification._id ||
      notification.id;

    setNotifications((current) =>
      current.map((item) => {
        const itemId =
          item._id ||
          item.id;

        if (itemId === id) {
          return {
            ...item,
            read: true,
          };
        }

        return item;
      })
    );

    if (
      !id ||
      String(id).startsWith("live-")
    ) {
      return;
    }

    try {
      await axios.put(
        `${API_URL}/api/notifications/${id}/read`
      );
    } catch (error) {
      console.warn(
        "Mark notification read error:",
        error.message
      );
    }
  };


  // ===================================================
  // MARK ALL READ
  // ===================================================

  const markAllRead = async () => {
    try {
      await axios.put(
        `${API_URL}/api/notifications/read-all`
      );
    } catch (error) {
      console.warn(
        "Mark all read backend error:",
        error.message
      );
    }

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        read: true,
      }))
    );
  };


  // ===================================================
  // CLEAR ALL
  // ===================================================

  const clearAll = async () => {
    const confirmed =
      window.confirm(
        "Are you sure you want to clear all notifications?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/api/notifications`
      );
    } catch (error) {
      console.warn(
        "Clear notifications backend error:",
        error.message
      );
    }

    setNotifications([]);
  };


  // ===================================================
  // COUNTS
  // ===================================================

  const totalCount =
    notifications.length;

  const unreadCount =
    notifications.filter(
      (item) => !item.read
    ).length;

  const sosCount =
    notifications.filter(
      (item) =>
        normalizeType(item.type) === "SOS"
    ).length;

  const dangerCount =
    notifications.filter(
      (item) =>
        normalizeType(item.type) === "DANGER"
    ).length;

  const warningCount =
    notifications.filter(
      (item) =>
        normalizeType(item.type) === "WARNING"
    ).length;

  const offlineCount =
    notifications.filter(
      (item) =>
        String(
          item.title || ""
        )
          .toUpperCase()
          .includes("OFFLINE")
    ).length;


  // ===================================================
  // FILTERED NOTIFICATIONS
  // ===================================================

  const filteredNotifications =
    useMemo(() => {
      if (filter === "ALL") {
        return notifications;
      }

      return notifications.filter(
        (item) =>
          normalizeType(item.type) ===
          filter
      );
    }, [
      notifications,
      filter,
    ]);


  // ===================================================
  // NOTIFICATION STYLE
  // ===================================================

  const getStyle = (type) => {
    const value =
      normalizeType(type);

    if (value === "SOS") {
      return {
        icon: "🚨",
        title: "text-red-400",
        border: "border-red-500/40",
        bg: "bg-red-500/5",
        badge:
          "bg-red-500/10 text-red-400 border-red-500/30",
      };
    }

    if (value === "DANGER") {
      return {
        icon: "🔴",
        title: "text-red-400",
        border: "border-red-500/30",
        bg: "bg-red-500/5",
        badge:
          "bg-red-500/10 text-red-400 border-red-500/30",
      };
    }

    if (value === "WARNING") {
      return {
        icon: "⚠️",
        title: "text-yellow-400",
        border:
          "border-yellow-500/30",
        bg: "bg-yellow-500/5",
        badge:
          "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
      };
    }

    return {
      icon: "🔵",
      title: "text-cyan-400",
      border:
        "border-cyan-500/30",
      bg: "bg-cyan-500/5",
      badge:
        "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    };
  };


  // ===================================================
  // TIME AGO
  // ===================================================

  const getTimeAgo = (dateValue) => {
    if (!dateValue) {
      return "Unknown time";
    }

    const timestamp =
      new Date(dateValue).getTime();

    if (Number.isNaN(timestamp)) {
      return "Unknown time";
    }

    const seconds = Math.floor(
      (Date.now() - timestamp) / 1000
    );

    if (seconds < 10) {
      return "Just now";
    }

    if (seconds < 60) {
      return `${seconds}s ago`;
    }

    const minutes = Math.floor(
      seconds / 60
    );

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    return `${days}d ago`;
  };


  // ===================================================
  // RENDER
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
                LIVE POPUP
            ================================================= */}

            {toast && (
              <div className="fixed top-24 right-6 z-[100] w-[360px] max-w-[calc(100vw-32px)]">

                <div
                  className={
                    `bg-slate-900 border rounded-2xl shadow-2xl p-4 ${
                      normalizeType(toast.type) === "SOS" ||
                      normalizeType(toast.type) === "DANGER"
                        ? "border-red-500/50"
                        : normalizeType(toast.type) === "WARNING"
                        ? "border-yellow-500/50"
                        : "border-cyan-500/40"
                    }`
                  }
                >

                  <div className="flex items-start gap-3">

                    <div className="w-11 h-11 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center text-xl">
                      {
                        getStyle(
                          toast.type
                        ).icon
                      }
                    </div>


                    <div className="flex-1 min-w-0">

                      <p className="text-sm font-bold">
                        {toast.title ||
                          "New Alert"}
                      </p>

                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {toast.message}
                      </p>

                      {toast.minerName && (
                        <p className="text-[11px] text-cyan-400 mt-2 font-semibold">
                          👷 {toast.minerName}
                        </p>
                      )}

                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        setToast(null)
                      }
                      className="text-slate-500 hover:text-white text-lg"
                    >
                      ×
                    </button>

                  </div>

                </div>

              </div>
            )}


            {/* =================================================
                BACK BUTTON
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                navigate("/")
              }
              className="inline-flex items-center gap-2 mb-6 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-semibold transition"
            >
              ← Back to Dashboard
            </button>


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">

              <div>

                <div className="flex items-center gap-3 mb-3">

                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold">
                    CENTRAL CONTROL
                  </span>


                  <span className="flex items-center gap-2 text-xs font-bold">

                    <span
                      className={
                        socketConnected
                          ? "w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"
                          : "w-2.5 h-2.5 rounded-full bg-red-500"
                      }
                    />

                    <span
                      className={
                        socketConnected
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {socketConnected
                        ? "LIVE"
                        : "OFFLINE"}
                    </span>

                  </span>

                </div>


                <h1 className="text-3xl lg:text-4xl font-bold">
                  Notifications
                </h1>


                <p className="text-slate-500 mt-2">
                  Real-time safety notifications from Smart Miner Safety Jackets.
                </p>

              </div>


              {/* =================================================
                  BUTTONS
              ================================================= */}

              <div className="flex flex-wrap gap-3">

                {!soundEnabled ? (
                  <button
                    type="button"
                    onClick={enableSound}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-sm font-bold transition"
                  >
                    🔊 Enable Alert Sound
                  </button>
                ) : (
                  <div className="px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold flex items-center">
                    🔊 Sound Enabled
                  </div>
                )}


                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-sm font-semibold"
                >
                  ✓ Mark all read
                </button>


                <button
                  type="button"
                  onClick={clearAll}
                  disabled={totalCount === 0}
                  className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 border border-red-500/20 text-red-400 text-sm font-semibold"
                >
                  Clear all
                </button>

              </div>

            </div>


            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-7">

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <p className="text-xs text-slate-500 uppercase font-bold">
                  Total
                </p>

                <p className="text-3xl font-bold mt-2">
                  {totalCount}
                </p>
              </div>


              <div className="bg-slate-900 border border-cyan-500/20 rounded-2xl p-5">
                <p className="text-xs text-cyan-400 uppercase font-bold">
                  Unread
                </p>

                <p className="text-3xl font-bold text-cyan-400 mt-2">
                  {unreadCount}
                </p>
              </div>


              <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-5">
                <p className="text-xs text-red-400 uppercase font-bold">
                  Emergency
                </p>

                <p className="text-3xl font-bold text-red-400 mt-2">
                  {sosCount + dangerCount}
                </p>
              </div>


              <div className="bg-slate-900 border border-yellow-500/20 rounded-2xl p-5">
                <p className="text-xs text-yellow-400 uppercase font-bold">
                  Warnings
                </p>

                <p className="text-3xl font-bold text-yellow-400 mt-2">
                  {warningCount}
                </p>
              </div>


              <div className="bg-slate-900 border border-orange-500/20 rounded-2xl p-5">
                <p className="text-xs text-orange-400 uppercase font-bold">
                  Sensor Offline
                </p>

                <p className="text-3xl font-bold text-orange-400 mt-2">
                  {offlineCount}
                </p>
              </div>

            </div>


            {/* =================================================
                FILTER
            ================================================= */}

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">

              <div className="flex flex-wrap gap-2">

                {[
                  "ALL",
                  "SOS",
                  "DANGER",
                  "WARNING",
                  "INFO",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setFilter(item)
                    }
                    className={
                      filter === item
                        ? "px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold"
                        : "px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-xs font-bold"
                    }
                  >
                    {item === "ALL"
                      ? "All Notifications"
                      : item}
                  </button>
                ))}

              </div>

            </div>


            {/* =================================================
                LOADING
            ================================================= */}

            {loading && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">

                <div className="w-10 h-10 mx-auto border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin mb-4" />

                <p className="text-slate-400">
                  Loading notifications...
                </p>

              </div>
            )}


            {/* =================================================
                EMPTY
            ================================================= */}

            {!loading &&
              filteredNotifications.length === 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">

                  <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-3xl mb-5">
                    🔔
                  </div>


                  <h2 className="text-xl font-bold">
                    No Notifications
                  </h2>


                  <p className="text-slate-500 mt-2">
                    New safety alerts will appear here automatically.
                  </p>


                  <div className="flex justify-center items-center gap-2 mt-5 text-xs">

                    <span
                      className={
                        socketConnected
                          ? "w-2 h-2 rounded-full bg-green-500 animate-pulse"
                          : "w-2 h-2 rounded-full bg-red-500"
                      }
                    />

                    <span className="text-slate-500">
                      {socketConnected
                        ? "Waiting for live alerts..."
                        : "Notification service offline"}
                    </span>

                  </div>

                </div>
              )}


            {/* =================================================
                NOTIFICATION LIST
            ================================================= */}

            {!loading &&
              filteredNotifications.length > 0 && (
                <div className="space-y-4">

                  {filteredNotifications.map(
                    (notification, index) => {
                      const type =
                        normalizeType(
                          notification.type
                        );

                      const style =
                        getStyle(type);

                      const id =
                        notification._id ||
                        notification.id ||
                        index;

                      const minerId =
                        notification.minerId ||
                        notification.userId ||
                        (
                          notification.miner &&
                          notification.miner.userId
                        );

                      const isOffline =
                        String(
                          notification.title ||
                            ""
                        )
                          .toUpperCase()
                          .includes(
                            "OFFLINE"
                          );

                      return (
                        <div
                          key={id}
                          className={`relative overflow-hidden rounded-2xl border ${style.border} ${style.bg} ${
                            !notification.read
                              ? "shadow-lg"
                              : "opacity-80"
                          }`}
                        >

                          {!notification.read && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400" />
                          )}


                          <div className="p-5">

                            {/* ---------------------------------
                                TOP
                            --------------------------------- */}

                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

                              <div className="flex items-start gap-4">

                                <div className="w-14 h-14 shrink-0 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl">
                                  {isOffline
                                    ? "📡"
                                    : style.icon}
                                </div>


                                <div className="min-w-0">

                                  <div className="flex flex-wrap items-center gap-2">

                                    <h2
                                      className={`text-lg font-bold ${style.title}`}
                                    >
                                      {notification.title ||
                                        "System Notification"}
                                    </h2>


                                    <span
                                      className={`px-3 py-1 rounded-full border text-[10px] font-bold ${style.badge}`}
                                    >
                                      {type}
                                    </span>


                                    {!notification.read && (
                                      <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                                        NEW
                                      </span>
                                    )}

                                  </div>


                                  <p className="text-sm text-white font-semibold mt-2">
                                    👷{" "}
                                    {notification.minerName ||
                                      "Unknown Miner"}
                                  </p>


                                  {minerId && (
                                    <p className="text-xs text-slate-600 mt-1">
                                      Miner ID:{" "}
                                      {minerId}
                                    </p>
                                  )}

                                </div>

                              </div>


                              {/* TIME */}

                              <div className="flex flex-col lg:items-end">

                                <span className="text-xs text-slate-500">
                                  {getTimeAgo(
                                    notification.createdAt
                                  )}
                                </span>


                                {!notification.read && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      markAsRead(
                                        notification
                                      )
                                    }
                                    className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                                  >
                                    Mark as read
                                  </button>
                                )}

                              </div>

                            </div>


                            {/* ---------------------------------
                                MESSAGE
                            --------------------------------- */}

                            <p className="text-sm text-slate-300 mt-5 leading-relaxed">
                              {notification.message ||
                                "Safety notification received from the monitoring system."}
                            </p>


                            {/* ---------------------------------
                                SENSOR
                            --------------------------------- */}

                            {notification.sensor && (
                              <div className="mt-4 inline-flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800">

                                <span className="text-xs text-slate-500">
                                  Sensor
                                </span>

                                <span className="text-sm font-semibold text-slate-200">
                                  {notification.sensor}
                                </span>


                                {notification.sensorValue !==
                                  null &&
                                  notification.sensorValue !==
                                    undefined && (
                                    <span className="text-xs font-bold text-cyan-400">
                                      Value:{" "}
                                      {
                                        notification.sensorValue
                                      }
                                    </span>
                                  )}

                              </div>
                            )}


                            {/* ---------------------------------
                                LOCATION
                            --------------------------------- */}

                            {notification.latitude !==
                              null &&
                              notification.latitude !==
                                undefined &&
                              notification.longitude !==
                                null &&
                              notification.longitude !==
                                undefined && (
                                <div className="mt-4 text-xs text-slate-500">
                                  📍 GPS location available
                                </div>
                              )}


                            {/* ---------------------------------
                                ACTIONS
                            --------------------------------- */}

                            <div className="flex flex-wrap gap-3 mt-5">

                              {minerId && (
                                <Link
                                  to={`/miner/${minerId}`}
                                  onClick={() =>
                                    markAsRead(
                                      notification
                                    )
                                  }
                                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold transition"
                                >
                                  👷 View Miner
                                </Link>
                              )}


                              <Link
                                to="/map"
                                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold transition"
                              >
                                📍 View Location
                              </Link>

                            </div>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}


            {/* =================================================
                FOOTER STATUS
            ================================================= */}

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


                <div className="flex items-center gap-2 text-xs font-bold">

                  <span
                    className={
                      socketConnected
                        ? "w-2 h-2 rounded-full bg-green-500 animate-pulse"
                        : "w-2 h-2 rounded-full bg-red-500"
                    }
                  />

                  <span
                    className={
                      socketConnected
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {socketConnected
                      ? "REAL-TIME MONITORING ACTIVE"
                      : "REAL-TIME SERVICE OFFLINE"}
                  </span>

                </div>

              </div>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}


// =====================================================
// EXPORT
// =====================================================

export default Notifications;