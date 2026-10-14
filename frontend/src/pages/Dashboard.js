import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import axios from "axios";
import io from "socket.io-client";
import { Link } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import AlertPopup from "../components/AlertPopup";


// =====================================================
// API
// =====================================================

const API_URL = "http://localhost:5000";


// =====================================================
// SENSOR INFORMATION
// =====================================================

const SENSOR_INFO = {
  heartRate: {
    name: "Pulse Rate Sensor",
    shortName: "Pulse Rate",
    icon: "❤️",
    unit: "BPM",
  },

  spo2: {
    name: "MAX30102 SpO₂ Sensor",
    shortName: "MAX30102",
    icon: "🩸",
    unit: "%",
  },

  motion: {
    name: "MPU6050 Motion Sensor",
    shortName: "MPU6050",
    icon: "🏃",
    unit: "",
  },

  temperature: {
    name: "GY-906 MLX90614",
    shortName: "GY-906",
    icon: "🌡️",
    unit: "°C",
  },

  ammonia: {
    name: "MQ135 Ammonia Sensor",
    shortName: "MQ135",
    icon: "🧪",
    unit: "",
  },

  methane: {
    name: "MQ4 Methane Sensor",
    shortName: "MQ4",
    icon: "🔥",
    unit: "",
  },

  carbonMonoxide: {
    name: "MQ7 Carbon Monoxide Sensor",
    shortName: "MQ7",
    icon: "☠️",
    unit: "",
  },

  pressure: {
    name: "BMP280 Pressure Sensor",
    shortName: "BMP280",
    icon: "📊",
    unit: "hPa",
  },

  gps: {
    name: "GPS Module",
    shortName: "GPS",
    icon: "📍",
    unit: "",
  },

  sosButton: {
    name: "SOS Push Button",
    shortName: "SOS",
    icon: "🆘",
    unit: "",
  },
};


// =====================================================
// DASHBOARD
// =====================================================

function Dashboard() {

  // ===================================================
  // STATE
  // ===================================================

  const [miners, setMiners] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [alert, setAlert] =
    useState("");

  const [alertType, setAlertType] =
    useState("DANGER");

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [soundEnabled, setSoundEnabled] =
    useState(false);

  const [socketConnected, setSocketConnected] =
    useState(false);


  // ===================================================
  // REFS
  // ===================================================

  const socketRef =
    useRef(null);

  const audioContextRef =
    useRef(null);

  const lastNotificationRef =
    useRef({});


  // ===================================================
  // FETCH MINERS
  // ===================================================

  const fetchMiners = useCallback(
    async (showLoader = false) => {

      try {

        if (showLoader) {
          setRefreshing(true);
        }

        const response =
          await axios.get(
            `${API_URL}/api/miners`
          );

        const data =
          Array.isArray(response.data)
            ? response.data
            : [];

        setMiners(data);

        setLastUpdated(
          new Date()
        );

      } catch (error) {

        console.error(
          "Failed to load miners:",
          error
        );

      } finally {

        setLoading(false);
        setRefreshing(false);

      }

    },
    []
  );


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {

    fetchMiners(true);

  }, [fetchMiners]);


  // ===================================================
  // AUDIO
  // ===================================================

  const enableSound = async () => {

    try {

      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) {
        return;
      }

      if (!audioContextRef.current) {

        audioContextRef.current =
          new AudioContext();

      }

      if (
        audioContextRef.current.state ===
        "suspended"
      ) {

        await audioContextRef.current.resume();

      }

      // Small silent sound to unlock browser audio
      const oscillator =
        audioContextRef.current.createOscillator();

      const gain =
        audioContextRef.current.createGain();

      gain.gain.value = 0.001;

      oscillator.connect(gain);

      gain.connect(
        audioContextRef.current.destination
      );

      oscillator.start();

      oscillator.stop(
        audioContextRef.current.currentTime +
        0.05
      );

      setSoundEnabled(true);

    } catch (error) {

      console.error(
        "Audio enable error:",
        error
      );

    }

  };


  // ===================================================
  // PLAY BEEP
  // ===================================================

  const playBeep = (
    frequency,
    duration,
    delay = 0,
    volume = 0.18
  ) => {

    if (!soundEnabled) {
      return;
    }

    const context =
      audioContextRef.current;

    if (!context) {
      return;
    }

    setTimeout(() => {

      try {

        const oscillator =
          context.createOscillator();

        const gain =
          context.createGain();

        oscillator.type =
          "square";

        oscillator.frequency.value =
          frequency;

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

        gain.connect(
          context.destination
        );

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
  // WARNING SOUND
  // ===================================================

  const playWarningSound = () => {

    playBeep(
      1800,
      180,
      0
    );

    playBeep(
      1800,
      180,
      350
    );

  };


  // ===================================================
  // DANGER SOUND
  // ===================================================

  const playDangerSound = () => {

    playBeep(
      2500,
      180,
      0,
      0.22
    );

    playBeep(
      3500,
      180,
      280,
      0.22
    );

    playBeep(
      2500,
      180,
      560,
      0.22
    );

    playBeep(
      3500,
      180,
      840,
      0.22
    );

  };


  // ===================================================
  // SOS SOUND
  // ===================================================

  const playSOSSound = () => {

    playBeep(
      3000,
      220,
      0,
      0.25
    );

    playBeep(
      4000,
      220,
      300,
      0.25
    );

    playBeep(
      3000,
      220,
      600,
      0.25
    );

    playBeep(
      4000,
      220,
      900,
      0.25
    );

    playBeep(
      3000,
      220,
      1200,
      0.25
    );

  };


  // ===================================================
  // SENSOR OFFLINE SOUND
  // ===================================================

  const playOfflineSound = () => {

    playBeep(
      1200,
      220,
      0,
      0.18
    );

    playBeep(
      900,
      220,
      350,
      0.18
    );

  };


  // ===================================================
  // STOP SOUND
  // ===================================================

  const stopAlarm = () => {

    // Web Audio beeps are short and naturally finish.
    // This function exists for popup compatibility.

  };


  // ===================================================
  // SHOW ALERT
  // ===================================================

  const showAlert = (
    message,
    type,
    soundFunction
  ) => {

    setAlertType(type);

    setAlert(message);

    if (soundFunction) {
      soundFunction();
    }

  };


  // ===================================================
  // PREVENT DUPLICATE NOTIFICATIONS
  // ===================================================

  const shouldNotify = (
    key
  ) => {

    const now =
      Date.now();

    const previous =
      lastNotificationRef.current[key];

    // Don't show same event repeatedly
    // within 5 seconds.

    if (
      previous &&
      now - previous < 5000
    ) {

      return false;

    }

    lastNotificationRef.current[key] =
      now;

    return true;

  };


  // ===================================================
  // SOCKET.IO
  // ===================================================

  useEffect(() => {

    const socket =
      io(API_URL, {
        transports: [
          "websocket",
          "polling",
        ],
      });

    socketRef.current =
      socket;


    // =================================================
    // CONNECT
    // =================================================

    socket.on(
      "connect",
      () => {

        console.log(
          "Central Control Socket connected"
        );

        setSocketConnected(true);

      }
    );


    // =================================================
    // DISCONNECT
    // =================================================

    socket.on(
      "disconnect",
      () => {

        console.log(
          "Central Control Socket disconnected"
        );

        setSocketConnected(false);

      }
    );


    // =================================================
    // LIVE DATA
    // =================================================

    socket.on(
      "dataUpdate",
      (updatedMiner) => {

        if (
          !updatedMiner ||
          !updatedMiner.userId
        ) {

          return;

        }


        setMiners(
          (previousMiners) => {

            const exists =
              previousMiners.some(
                (miner) =>
                  miner.userId ===
                  updatedMiner.userId
              );


            if (exists) {

              return previousMiners.map(
                (miner) => {

                  if (
                    miner.userId !==
                    updatedMiner.userId
                  ) {

                    return miner;

                  }

                  return {
                    ...miner,
                    ...updatedMiner,
                  };

                }
              );

            }


            return [
              ...previousMiners,
              updatedMiner,
            ];

          }
        );


        setLastUpdated(
          new Date()
        );

      }
    );


    // =================================================
    // SENSOR OFFLINE
    // =================================================

    socket.on(
      "sensorOffline",
      (sensorData) => {

        if (
          !sensorData
        ) {

          return;

        }


        const sensor =
          SENSOR_INFO[
            sensorData.sensor
          ];


        const sensorName =
          sensorData.sensorName ||
          sensor?.name ||
          "Unknown Sensor";


        const minerId =
          sensorData.minerId ||
          "Unknown Miner";


        const key =
          `offline-${minerId}-${sensorData.sensor}`;


        if (
          !shouldNotify(key)
        ) {

          return;

        }


        showAlert(
          `⚠️ ${sensorName} is OFFLINE - Miner ${minerId}`,
          "WARNING",
          playOfflineSound
        );

      }
    );


    // =================================================
    // SENSOR ONLINE
    // =================================================

    socket.on(
      "sensorOnline",
      (sensorData) => {

        if (
          !sensorData
        ) {

          return;

        }


        const sensor =
          SENSOR_INFO[
            sensorData.sensor
          ];


        const sensorName =
          sensorData.sensorName ||
          sensor?.name ||
          "Sensor";


        const minerId =
          sensorData.minerId ||
          "Unknown Miner";


        const key =
          `online-${minerId}-${sensorData.sensor}`;


        if (
          !shouldNotify(key)
        ) {

          return;

        }


        showAlert(
          `🟢 ${sensorName} is ONLINE - Miner ${minerId}`,
          "ONLINE",
          null
        );

      }
    );


    // =================================================
    // GENERAL ALERT
    // =================================================

    socket.on(
      "alertUpdate",
      (alertData) => {

        if (
          !alertData
        ) {

          return;

        }


        const minerId =
          alertData.minerId ||
          alertData.miner?.userId ||
          "Unknown Miner";


        const alertReason =
          alertData.alertReason ||
          alertData.miner?.alertReason ||
          "Safety condition detected";


        const type =
          alertData.alertType ||
          alertData.miner?.status ||
          "WARNING";


        const key =
          `alert-${minerId}-${type}-${alertReason}`;


        if (
          !shouldNotify(key)
        ) {

          return;

        }


        if (
          type === "DANGER"
        ) {

          showAlert(
            `🚨 DANGER - ${minerId}: ${alertReason}`,
            "DANGER",
            playDangerSound
          );

        } else if (
          type === "SOS"
        ) {

          showAlert(
            `🚨 SOS EMERGENCY - ${minerId}`,
            "SOS",
            playSOSSound
          );

        } else {

          showAlert(
            `⚠️ WARNING - ${minerId}: ${alertReason}`,
            "WARNING",
            playWarningSound
          );

        }

      }
    );


    // =================================================
    // SOS
    // =================================================

    socket.on(
      "sosAlert",
      (sosData) => {

        if (
          !sosData
        ) {

          return;

        }


        const minerId =
          sosData.minerId ||
          sosData.miner?.userId ||
          "Unknown Miner";


        const key =
          `sos-${minerId}`;


        if (
          !shouldNotify(key)
        ) {

          return;

        }


        showAlert(
          `🚨🚨 SOS EMERGENCY ACTIVATED - Miner ${minerId}`,
          "SOS",
          playSOSSound
        );

      }
    );


    // =================================================
    // FALL
    // =================================================

    socket.on(
      "fallAlert",
      (fallData) => {

        if (
          !fallData
        ) {

          return;

        }


        const minerId =
          fallData.minerId ||
          fallData.miner?.userId ||
          "Unknown Miner";


        const key =
          `fall-${minerId}`;


        if (
          !shouldNotify(key)
        ) {

          return;

        }


        showAlert(
          `🚨 FALL DETECTED - Miner ${minerId}`,
          "DANGER",
          playDangerSound
        );

      }
    );


    // =================================================
    // CLEANUP
    // =================================================

    return () => {

      socket.off(
        "connect"
      );

      socket.off(
        "disconnect"
      );

      socket.off(
        "dataUpdate"
      );

      socket.off(
        "sensorOffline"
      );

      socket.off(
        "sensorOnline"
      );

      socket.off(
        "alertUpdate"
      );

      socket.off(
        "sosAlert"
      );

      socket.off(
        "fallAlert"
      );

      socket.disconnect();

    };

  }, [soundEnabled]);


  // ===================================================
  // COUNTS
  // ===================================================

  const totalMiners =
    miners.length;


  const safeMiners =
    miners.filter(
      (miner) =>
        miner.status === "SAFE"
    ).length;


  const warningMiners =
    miners.filter(
      (miner) =>
        miner.status === "WARNING"
    ).length;


  const dangerMiners =
    miners.filter(
      (miner) =>
        miner.status === "DANGER"
    ).length;


  const sosMiners =
    miners.filter(
      (miner) =>
        miner.sosAlert === true
    ).length;


  // ===================================================
  // OFFLINE SENSOR COUNT
  // ===================================================

  const offlineSensorCount =
    miners.reduce(
      (
        total,
        miner
      ) => {

        const status =
          miner.sensorStatus ||
          {};

        return (
          total +
          Object.keys(
            SENSOR_INFO
          ).filter(
            (sensor) =>
              status[sensor] === false
          ).length
        );

      },
      0
    );


  // ===================================================
  // SEARCH
  // ===================================================

  const filteredMiners =
    useMemo(() => {

      const searchValue =
        search
          .trim()
          .toLowerCase();


      if (!searchValue) {

        return miners;

      }


      return miners.filter(
        (miner) => {

          const userId =
            String(
              miner.userId || ""
            ).toLowerCase();


          const name =
            String(
              miner.fullName || ""
            ).toLowerCase();


          const nic =
            String(
              miner.nic || ""
            ).toLowerCase();


          return (
            userId.includes(
              searchValue
            ) ||
            name.includes(
              searchValue
            ) ||
            nic.includes(
              searchValue
            )
          );

        }
      );

    }, [
      miners,
      search,
    ]);


  // ===================================================
  // STATUS STYLE
  // ===================================================

  const getStatusStyle = (
    status
  ) => {

    if (
      status === "DANGER"
    ) {

      return {

        card:
          "border-red-500/40 bg-red-500/[0.04]",

        badge:
          "bg-red-500/15 text-red-400 border-red-500/30",

        icon:
          "🔴",

      };

    }


    if (
      status === "WARNING"
    ) {

      return {

        card:
          "border-yellow-500/40 bg-yellow-500/[0.04]",

        badge:
          "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",

        icon:
          "🟡",

      };

    }


    return {

      card:
        "border-green-500/30 bg-green-500/[0.02]",

      badge:
        "bg-green-500/15 text-green-400 border-green-500/30",

      icon:
        "🟢",

    };

  };


  // ===================================================
  // SENSOR STATUS
  // ===================================================

 const isSensorOnline = (
  miner,
  sensor
) => {

  if (!miner) {
    return false;
  }

  // =========================================
  // JACKET / LoRa CONNECTION
  // =========================================

  // Jacket OFF / LoRa disconnected
  // => ALL sensors OFFLINE
  if (miner.loraConnected === false) {
    return false;
  }

  // =========================================
  // INDIVIDUAL SENSOR STATUS
  // =========================================

  if (
    miner.sensorStatus &&
    miner.sensorStatus[sensor] === false
  ) {
    return false;
  }

  return true;
};

  // ===================================================
  // SENSOR STATUS BADGE
  // ===================================================

  const SensorStatus = ({
    online,
  }) => {

    if (online) {

      return (
        <span className="
          inline-flex
          items-center
          gap-1.5
          text-[10px]
          font-bold
          uppercase
          tracking-wider
          text-green-400
        ">

          <span className="
            w-1.5
            h-1.5
            rounded-full
            bg-green-500
            animate-pulse
          " />

          ONLINE

        </span>
      );

    }


    return (
      <span className="
        inline-flex
        items-center
        gap-1.5
        text-[10px]
        font-bold
        uppercase
        tracking-wider
        text-red-400
      ">

        <span className="
          w-1.5
          h-1.5
          rounded-full
          bg-red-500
          animate-pulse
        " />

        OFFLINE

      </span>
    );

  };


  // ===================================================
  // SENSOR VALUE
  // ===================================================

  const displayValue = (
    value,
    suffix = ""
  ) => {

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {

      return "--";

    }


    return `${value}${suffix}`;

  };


  // ===================================================
  // VALUE COLOR
  // ===================================================

  const getHeartRateColor =
    (value) => {

      const bpm =
        Number(value);


      if (!bpm) {

        return "text-slate-500";

      }


      if (
        bpm > 150 ||
        bpm < 40
      ) {

        return "text-red-400";

      }


      if (
        bpm > 130
      ) {

        return "text-yellow-400";

      }


      return "text-green-400";

    };


  const getSpO2Color =
    (value) => {

      const spo2 =
        Number(value);


      if (!spo2) {

        return "text-slate-500";

      }


      if (
        spo2 < 90
      ) {

        return "text-red-400";

      }


      if (
        spo2 < 95
      ) {

        return "text-yellow-400";

      }


      return "text-green-400";

    };


  const getTemperatureColor =
    (value) => {

      const temp =
        Number(value);


      if (!temp) {

        return "text-slate-500";

      }


      if (
        temp > 39
      ) {

        return "text-red-400";

      }


      if (
        temp > 37.5
      ) {

        return "text-yellow-400";

      }


      return "text-green-400";

    };


  // ===================================================
  // TIME
  // ===================================================

  const formatUpdatedTime =
    (date) => {

      if (!date) {

        return "--";

      }


      return date.toLocaleTimeString(
        [],
        {
          hour:
            "2-digit",

          minute:
            "2-digit",

          second:
            "2-digit",
        }
      );

    };


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {

    return (

      <div className="
        min-h-screen
        bg-slate-950
        text-white
        flex
      ">

        <Sidebar />

        <div className="
          ml-60
          flex-1
        ">

          <Navbar />

          <div className="
            min-h-[calc(100vh-80px)]
            flex
            items-center
            justify-center
          ">

            <div className="text-center">

              <div className="
                w-14
                h-14
                border-4
                border-slate-700
                border-t-cyan-400
                rounded-full
                animate-spin
                mx-auto
                mb-5
              " />

              <h2 className="
                text-xl
                font-bold
              ">

                Loading Central Control System

              </h2>

              <p className="
                text-slate-500
                mt-2
              ">

                Connecting to miner monitoring network...

              </p>

            </div>

          </div>

        </div>

      </div>

    );

  }


  // ===================================================
  // DASHBOARD
  // ===================================================

  return (

    <div className="
      min-h-screen
      bg-slate-950
      text-white
    ">

      <Sidebar />


      <div className="ml-60">

        <Navbar />


        <main className="
          p-5
          md:p-7
          lg:p-8
        ">


          {/* =================================================
              ALERT POPUP
          ================================================= */}

          <AlertPopup
            alert={alert}
            type={alertType}
            onClose={() => {

              setAlert("");

              stopAlarm();

            }}
          />


          {/* =================================================
              SOUND ENABLE
          ================================================= */}

          <div className="
            fixed
            bottom-5
            right-5
            z-[100]
          ">

            {!soundEnabled && (

              <button
                type="button"
                onClick={enableSound}
                className="
                  flex
                  items-center
                  gap-2
                  px-4
                  py-3
                  rounded-xl
                  bg-cyan-600
                  hover:bg-cyan-500
                  border
                  border-cyan-400/30
                  shadow-xl
                  shadow-cyan-900/30
                  font-bold
                  text-sm
                  transition
                "
              >

                🔊 Enable Alert Sound

              </button>

            )}

            {soundEnabled && (

              <div className="
                flex
                items-center
                gap-2
                px-3
                py-2
                rounded-xl
                bg-green-500/10
                border
                border-green-500/20
                text-green-400
                text-xs
                font-bold
              ">

                <span className="
                  w-2
                  h-2
                  bg-green-500
                  rounded-full
                  animate-pulse
                " />

                ALERT SOUND ON

              </div>

            )}

          </div>


          {/* =================================================
              HEADER
          ================================================= */}

          <div className="
            flex
            flex-col
            xl:flex-row
            xl:items-end
            xl:justify-between
            gap-6
            mb-8
          ">

            <div>

              <div className="
                flex
                items-center
                gap-3
                mb-2
              ">

                <span className="
                  px-3
                  py-1
                  rounded-full
                  bg-cyan-500/10
                  border
                  border-cyan-500/20
                  text-cyan-400
                  text-xs
                  font-bold
                  uppercase
                  tracking-wider
                ">

                  Central Monitoring

                </span>


                <span className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  text-green-400
                ">

                  <span className={`
                    w-2
                    h-2
                    rounded-full
                    ${
                      socketConnected
                        ? "bg-green-500 animate-pulse"
                        : "bg-red-500"
                    }
                  `} />

                  {socketConnected
                    ? "LIVE"
                    : "OFFLINE"}

                </span>

              </div>


              <h1 className="
                text-3xl
                md:text-4xl
                font-bold
              ">

                Miner Safety Dashboard

              </h1>


              <p className="
                text-slate-500
                mt-2
                max-w-2xl
              ">

                Real-time health, environmental,
                emergency and location monitoring
                for Smart Safety Jacket miners.

              </p>

            </div>


            {/* HEADER ACTIONS */}

            <div className="
              flex
              flex-wrap
              items-center
              gap-3
            ">

              <div className="
                bg-slate-900
                border
                border-slate-800
                rounded-xl
                px-4
                py-2
              ">

                <p className="
                  text-[10px]
                  text-slate-600
                  uppercase
                  font-bold
                ">

                  Last Update

                </p>


                <p className="
                  text-sm
                  font-semibold
                  text-slate-300
                ">

                  {formatUpdatedTime(
                    lastUpdated
                  )}

                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  fetchMiners(true)
                }
                disabled={refreshing}
                className="
                  px-4
                  py-3
                  rounded-xl
                  bg-slate-800
                  border
                  border-slate-700
                  hover:bg-slate-700
                  font-semibold
                  transition
                  disabled:opacity-50
                "
              >

                {refreshing
                  ? "⟳ Refreshing..."
                  : "↻ Refresh"}

              </button>

            </div>

          </div>


          {/* =================================================
              OFFLINE SENSOR BANNER
          ================================================= */}

          {offlineSensorCount > 0 && (

            <div className="
              mb-7
              rounded-2xl
              border
              border-orange-500/30
              bg-orange-500/[0.06]
              p-5
            ">

              <div className="
                flex
                items-center
                justify-between
                gap-4
              ">

                <div className="
                  flex
                  items-center
                  gap-4
                ">

                  <div className="
                    w-12
                    h-12
                    rounded-xl
                    bg-orange-500/10
                    flex
                    items-center
                    justify-center
                    text-2xl
                    animate-pulse
                  ">

                    📡

                  </div>


                  <div>

                    <h2 className="
                      text-lg
                      font-bold
                      text-orange-400
                    ">

                      Sensor Connection Issue

                    </h2>


                    <p className="
                      text-sm
                      text-slate-400
                      mt-1
                    ">

                      {offlineSensorCount} sensor(s)
                      currently offline.
                      Last received values remain
                      visible.

                    </p>

                  </div>

                </div>

              </div>

            </div>

          )}


          {/* =================================================
              CRITICAL ALERT
          ================================================= */}

          {(dangerMiners > 0 ||
            sosMiners > 0) && (

            <div className="
              mb-7
              rounded-2xl
              border
              border-red-500/40
              bg-red-500/[0.06]
              p-5
            ">

              <div className="
                flex
                flex-col
                md:flex-row
                md:items-center
                md:justify-between
                gap-4
              ">

                <div className="
                  flex
                  items-start
                  gap-4
                ">

                  <div className="
                    w-12
                    h-12
                    rounded-xl
                    bg-red-500/15
                    flex
                    items-center
                    justify-center
                    text-2xl
                    animate-pulse
                  ">

                    🚨

                  </div>


                  <div>

                    <h2 className="
                      text-lg
                      font-bold
                      text-red-400
                    ">

                      Active Emergency Conditions

                    </h2>


                    <p className="
                      text-sm
                      text-slate-400
                      mt-1
                    ">

                      {sosMiners > 0
                        ? `${sosMiners} miner(s) have active SOS alerts.`
                        : `${dangerMiners} miner(s) are currently in danger.`}

                    </p>

                  </div>

                </div>


                <Link
                  to="/miners"
                  className="
                    px-5
                    py-3
                    rounded-xl
                    bg-red-600
                    hover:bg-red-500
                    font-bold
                    text-center
                    transition
                  "
                >

                  View Affected Miners

                </Link>

              </div>

            </div>

          )}


          {/* =================================================
              STAT CARDS
          ================================================= */}

          <div className="
            grid
            grid-cols-1
            sm:grid-cols-2
            xl:grid-cols-6
            gap-4
            mb-8
          ">


            {/* TOTAL */}

            <div className="
              bg-slate-900
              border
              border-slate-800
              rounded-2xl
              p-5
            ">

              <p className="
                text-xs
                text-slate-500
                uppercase
                font-bold
              ">

                Total Miners

              </p>


              <p className="
                text-3xl
                font-bold
                mt-3
              ">

                {totalMiners}

              </p>


              <p className="
                text-xs
                text-slate-600
                mt-4
              ">

                Registered units

              </p>

            </div>


            {/* SAFE */}

            <div className="
              bg-slate-900
              border
              border-green-500/20
              rounded-2xl
              p-5
            ">

              <p className="
                text-xs
                text-green-500
                uppercase
                font-bold
              ">

                Safe

              </p>


              <p className="
                text-3xl
                font-bold
                text-green-400
                mt-3
              ">

                {safeMiners}

              </p>

            </div>


            {/* WARNING */}

            <div className="
              bg-slate-900
              border
              border-yellow-500/20
              rounded-2xl
              p-5
            ">

              <p className="
                text-xs
                text-yellow-500
                uppercase
                font-bold
              ">

                Warning

              </p>


              <p className="
                text-3xl
                font-bold
                text-yellow-400
                mt-3
              ">

                {warningMiners}

              </p>

            </div>


            {/* DANGER */}

            <div className="
              bg-slate-900
              border
              border-red-500/20
              rounded-2xl
              p-5
            ">

              <p className="
                text-xs
                text-red-500
                uppercase
                font-bold
              ">

                Danger

              </p>


              <p className="
                text-3xl
                font-bold
                text-red-400
                mt-3
              ">

                {dangerMiners}

              </p>

            </div>


            {/* SOS */}

            <div className="
              bg-slate-900
              border
              border-red-500/30
              rounded-2xl
              p-5
            ">

              <p className="
                text-xs
                text-red-400
                uppercase
                font-bold
              ">

                SOS Active

              </p>


              <p className="
                text-3xl
                font-bold
                text-red-400
                mt-3
              ">

                {sosMiners}

              </p>

            </div>


            {/* OFFLINE */}

            <div className="
              bg-slate-900
              border
              border-orange-500/30
              rounded-2xl
              p-5
            ">

              <p className="
                text-xs
                text-orange-400
                uppercase
                font-bold
              ">

                Sensors Offline

              </p>


              <p className="
                text-3xl
                font-bold
                text-orange-400
                mt-3
              ">

                {offlineSensorCount}

              </p>

            </div>

          </div>


          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            p-5
            mb-6
          ">

            <div className="
              flex
              flex-col
              lg:flex-row
              lg:items-center
              lg:justify-between
              gap-4
            ">

              <div>

                <h2 className="
                  text-xl
                  font-bold
                ">

                  Live Miner Monitoring

                </h2>


                <p className="
                  text-sm
                  text-slate-500
                  mt-1
                ">

                  {filteredMiners.length}
                  miner(s) displayed

                </p>

              </div>


              <div className="
                relative
                w-full
                lg:w-96
              ">

                <span className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-slate-500
                ">

                  🔍

                </span>


                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="
                    Search miner ID, name or NIC...
                  "
                  className="
                    w-full
                    bg-slate-800
                    border
                    border-slate-700
                    focus:border-cyan-500
                    rounded-xl
                    py-3
                    pl-11
                    pr-4
                    outline-none
                    text-white
                    placeholder-slate-500
                  "
                />

              </div>

            </div>

          </div>


          {/* =================================================
              EMPTY
          ================================================= */}

          {filteredMiners.length === 0 && (

            <div className="
              bg-slate-900
              border
              border-slate-800
              rounded-2xl
              p-14
              text-center
            ">

              <div className="
                text-5xl
                mb-5
              ">

                {search
                  ? "🔍"
                  : "👷"}

              </div>


              <h2 className="
                text-xl
                font-bold
              ">

                {search
                  ? "No miners found"
                  : "No miners connected"}

              </h2>


              <p className="
                text-slate-500
                mt-2
              ">

                {search
                  ? "Try another miner ID, name or NIC."
                  : "Waiting for data from the Smart Safety Jacket."}

              </p>

            </div>

          )}


          {/* =================================================
              MINER CARDS
          ================================================= */}

          <div className="
            grid
            grid-cols-1
            xl:grid-cols-2
            gap-5
          ">

            {filteredMiners.map(
              (miner) => {

                const style =
                  getStatusStyle(
                    miner.status
                  );


                const isSOS =
                  miner.sosAlert === true;


                const isFall =
                  miner.fallDetected === true;


                const heartRate =
                  miner.heartRate ??
                  miner.bpm;


                const spo2 =
                  miner.spo2;


                const temperature =
                  miner.temperature;


                const motion =
                  miner.motionStatus ||
                  (
                    isFall
                      ? "FALL DETECTED"
                      : "NORMAL"
                  );


                const pressure =
                  miner.pressure;


                const ammonia =
                  miner.mq135;


                const methane =
                  miner.mq4;


                const carbonMonoxide =
                  miner.mq7;


                const co2 =
                  miner.co2;


                return (

                  <div
                    key={
                      miner.userId
                    }
                    className={`
                      rounded-2xl
                      border
                      overflow-hidden
                      transition
                      hover:-translate-y-1
                      hover:shadow-2xl
                      ${style.card}

                      ${
                        isSOS ||
                        isFall
                          ? "ring-2 ring-red-500/60 animate-pulse"
                          : ""
                      }
                    `}
                  >


                    {/* =========================================
                        HEADER
                    ========================================= */}

                    <div className="
                      p-5
                      border-b
                      border-slate-800/80
                    ">

                      <div className="
                        flex
                        items-start
                        justify-between
                        gap-4
                      ">

                        <div className="
                          flex
                          items-center
                          gap-4
                        ">

                          <div className="
                            w-12
                            h-12
                            rounded-xl
                            bg-slate-800
                            border
                            border-slate-700
                            flex
                            items-center
                            justify-center
                            text-xl
                          ">

                            👷

                          </div>


                          <div>

                            <p className="
                              text-xs
                              text-slate-500
                              uppercase
                            ">

                              Miner ID

                            </p>


                            <h3 className="
                              text-lg
                              font-bold
                            ">

                              {miner.userId}

                            </h3>


                            {miner.fullName && (

                              <p className="
                                text-sm
                                text-slate-500
                                mt-0.5
                              ">

                                {miner.fullName}

                              </p>

                            )}

                          </div>

                        </div>


                        {/* STATUS */}

                        <div className={`
                          px-3
                          py-2
                          rounded-lg
                          border
                          text-xs
                          font-bold
                          whitespace-nowrap
                          ${style.badge}
                        `}>

                          {style.icon}{" "}
                          {miner.status ||
                            "SAFE"}

                        </div>

                      </div>


                      {/* SOS */}

                      {isSOS && (

                        <div className="
                          mt-4
                          bg-red-500/10
                          border
                          border-red-500/30
                          rounded-xl
                          px-4
                          py-3
                        ">

                          <div className="
                            flex
                            items-center
                            gap-3
                          ">

                            <span className="
                              text-xl
                              animate-pulse
                            ">

                              🚨

                            </span>


                            <div>

                              <p className="
                                text-sm
                                font-bold
                                text-red-400
                              ">

                                SOS EMERGENCY ACTIVE

                              </p>


                              <p className="
                                text-xs
                                text-red-300/60
                              ">

                                Manual emergency button activated

                              </p>

                            </div>

                          </div>

                        </div>

                      )}


                      {/* FALL */}

                      {isFall && (

                        <div className="
                          mt-3
                          bg-red-500/10
                          border
                          border-red-500/30
                          rounded-xl
                          px-4
                          py-3
                        ">

                          <div className="
                            flex
                            items-center
                            gap-3
                          ">

                            <span className="
                              text-xl
                              animate-pulse
                            ">

                              🏃

                            </span>


                            <div>

                              <p className="
                                text-sm
                                font-bold
                                text-red-400
                              ">

                                FALL DETECTED

                              </p>


                              <p className="
                                text-xs
                                text-red-300/60
                              ">

                                MPU6050 detected abnormal movement

                              </p>

                            </div>

                          </div>

                        </div>

                      )}

                    </div>


                    {/* =========================================
                        HEALTH
                    ========================================= */}

                    <div className="p-5">

                      <p className="
                        text-xs
                        font-bold
                        text-slate-600
                        uppercase
                        tracking-wider
                        mb-4
                      ">

                        Health Monitoring

                      </p>


                      <div className="
                        grid
                        grid-cols-2
                        md:grid-cols-4
                        gap-3
                      ">


                        {/* HEART RATE */}

                        <div className="
                          bg-slate-900/70
                          border
                          border-slate-800
                          rounded-xl
                          p-4
                        ">

                          <div className="
                            flex
                            items-center
                            justify-between
                            gap-2
                          ">

                            <p className="
                              text-xs
                              text-slate-500
                            ">

                              ❤️ Heart Rate

                            </p>

                            <SensorStatus
                              online={
                                isSensorOnline(
                                  miner,
                                  "heartRate"
                                )
                              }
                            />

                          </div>


                          <p className={`
                            text-xl
                            font-bold
                            mt-2
                            ${getHeartRateColor(
                              heartRate
                            )}
                          `}>

                            {displayValue(
                              heartRate,
                              " BPM"
                            )}

                          </p>


                          {!isSensorOnline(
                            miner,
                            "heartRate"
                          ) && (

                            <p className="
                              text-[10px]
                              text-red-400
                              mt-2
                            ">

                              Last reading

                            </p>

                          )}

                        </div>


                        {/* SPO2 */}

                        <div className="
                          bg-slate-900/70
                          border
                          border-slate-800
                          rounded-xl
                          p-4
                        ">

                          <div className="
                            flex
                            items-center
                            justify-between
                            gap-2
                          ">

                            <p className="
                              text-xs
                              text-slate-500
                            ">

                              🩸 SpO₂

                            </p>

                            <SensorStatus
                              online={
                                isSensorOnline(
                                  miner,
                                  "spo2"
                                )
                              }
                            />

                          </div>


                          <p className={`
                            text-xl
                            font-bold
                            mt-2
                            ${getSpO2Color(
                              spo2
                            )}
                          `}>

                            {displayValue(
                              spo2,
                              "%"
                            )}

                          </p>


                          <p className="
                            text-[10px]
                            text-slate-600
                            mt-2
                          ">

                            MAX30102

                          </p>

                        </div>


                        {/* TEMPERATURE */}

                        <div className="
                          bg-slate-900/70
                          border
                          border-slate-800
                          rounded-xl
                          p-4
                        ">

                          <div className="
                            flex
                            items-center
                            justify-between
                            gap-2
                          ">

                            <p className="
                              text-xs
                              text-slate-500
                            ">

                              🌡 Temperature

                            </p>

                            <SensorStatus
                              online={
                                isSensorOnline(
                                  miner,
                                  "temperature"
                                )
                              }
                            />

                          </div>


                          <p className={`
                            text-xl
                            font-bold
                            mt-2
                            ${getTemperatureColor(
                              temperature
                            )}
                          `}>

                            {displayValue(
                              temperature,
                              "°C"
                            )}

                          </p>


                          <p className="
                            text-[10px]
                            text-slate-600
                            mt-2
                          ">

                            GY-906

                          </p>

                        </div>


                        {/* MOTION */}

                        <div className="
                          bg-slate-900/70
                          border
                          border-slate-800
                          rounded-xl
                          p-4
                        ">

                          <div className="
                            flex
                            items-center
                            justify-between
                            gap-2
                          ">

                            <p className="
                              text-xs
                              text-slate-500
                            ">

                              🏃 Motion

                            </p>

                            <SensorStatus
                              online={
                                isSensorOnline(
                                  miner,
                                  "motion"
                                )
                              }
                            />

                          </div>


                          <p className={`
                            text-xl
                            font-bold
                            mt-2
                            ${
                              isFall
                                ? "text-red-400"
                                : "text-cyan-400"
                            }
                          `}>

                            {isFall
                              ? "FALL"
                              : motion}

                          </p>


                          <p className="
                            text-[10px]
                            text-slate-600
                            mt-2
                          ">

                            MPU6050

                          </p>

                        </div>

                      </div>

                    </div>


                    {/* =========================================
                        ENVIRONMENT
                    ========================================= */}

                    <div className="
                      px-5
                      pb-5
                    ">

                      <p className="
                        text-xs
                        font-bold
                        text-slate-600
                        uppercase
                        tracking-wider
                        mb-4
                      ">

                        Environmental Monitoring

                      </p>


                      <div className="
                        grid
                        grid-cols-2
                        md:grid-cols-4
                        gap-3
                      ">


                        {/* AMMONIA */}

                        <div className="
                          bg-slate-900/70
                          border
                          border-slate-800
                          rounded-xl
                          p-4
                        ">

                          <div className="
                            flex
                            items-center
                            justify-between
                          ">

                            <p className="
                              text-xs
                              text-slate-500
                            ">

                              🧪 Ammonia

                            </p>

                            <SensorStatus
                              online={
                                isSensorOnline(
                                  miner,
                                  "ammonia"
                                )
                              }
                            />

                          </div>


                          <p className="
                            text-[11px]
                            font-bold
                            text-slate-300
                            mt-1
                          ">

                            MQ135

                          </p>


                          <p className="
                            text-lg
                            font-bold
                            mt-2
                            text-slate-200
                          ">

                            {displayValue(
                              ammonia
                            )}

                          </p>

                        </div>


                        {/* METHANE */}

                        <div className="
                          bg-slate-900/70
                          border
                          border-slate-800
                          rounded-xl
                          p-4
                        ">

                          <div className="
                            flex
                            items-center
                            justify-between
                          ">

                            <p className="
                              text-xs
                              text-slate-500
                            ">

                              🔥 Methane

                            </p>

                            <SensorStatus
                              online={
                                isSensorOnline(
                                  miner,
                                  "methane"
                                )
                              }
                            />

                          </div>


                          <p className="
                            text-[11px]
                            font-bold
                            text-slate-300
                            mt-1
                          ">

                            MQ4

                          </p>


                          <p className="
                            text-lg
                            font-bold
                            mt-2
                            text-slate-200
                          ">

                            {displayValue(
                              methane
                            )}

                          </p>

                        </div>


                        {/* CARBON MONOXIDE */}

                        <div className="
                          bg-slate-900/70
                          border
                          border-slate-800
                          rounded-xl
                          p-4
                        ">

                          <div className="
                            flex
                            items-center
                            justify-between
                          ">

                            <p className="
                              text-xs
                              text-slate-500
                            ">

                              ☠️ Carbon Monoxide

                            </p>

                            <SensorStatus
                              online={
                                isSensorOnline(
                                  miner,
                                  "carbonMonoxide"
                                )
                              }
                            />

                          </div>


                          <p className="
                            text-[11px]
                            font-bold
                            text-slate-300
                            mt-1
                          ">

                            MQ7

                          </p>


                          <p className="
                            text-lg
                            font-bold
                            mt-2
                            text-slate-200
                          ">

                            {displayValue(
                              carbonMonoxide
                            )}

                          </p>

                        </div>


                        {/* PRESSURE */}

                        <div className="
                          bg-slate-900/70
                          border
                          border-slate-800
                          rounded-xl
                          p-4
                        ">

                          <div className="
                            flex
                            items-center
                            justify-between
                          ">

                            <p className="
                              text-xs
                              text-slate-500
                            ">

                              📊 Pressure

                            </p>

                            <SensorStatus
                              online={
                                isSensorOnline(
                                  miner,
                                  "pressure"
                                )
                              }
                            />

                          </div>


                          <p className="
                            text-[11px]
                            font-bold
                            text-slate-300
                            mt-1
                          ">

                            BMP280

                          </p>


                          <p className="
                            text-lg
                            font-bold
                            mt-2
                            text-slate-200
                          ">

                            {displayValue(
                              pressure,
                              " hPa"
                            )}

                          </p>

                        </div>

                      </div>

                    </div>


                    {/* =========================================
                        COMMUNICATION / GPS
                    ========================================= */}

                    <div className="
                      px-5
                      pb-5
                    ">

                      <div className="
                        grid
                        grid-cols-1
                        md:grid-cols-2
                        gap-3
                      ">


                        {/* COMMUNICATION */}

                        <div className="
                          bg-slate-900/70
                          border
                          border-slate-800
                          rounded-xl
                          p-4
                        ">

                          <div className="
                            flex
                            items-center
                            justify-between
                          ">

                            <div>

                              <p className="
                                text-xs
                                text-slate-500
                              ">

                                📡 Communication

                              </p>


                              <p className="
                                text-sm
                                font-bold
                                mt-1
                              ">

                                {miner.loraConnected === false
                                  ? "LoRa Offline"
                                  : "LoRa / ESP32 Online"}

                              </p>

                            </div>


                            <span className={`
                              w-2.5
                              h-2.5
                              rounded-full
                              ${
                                miner.loraConnected === false
                                  ? "bg-red-500"
                                  : "bg-green-500 animate-pulse"
                              }
                            `} />

                          </div>

                        </div>


                        {/* GPS */}

                        <div className="
                          bg-slate-900/70
                          border
                          border-slate-800
                          rounded-xl
                          p-4
                        ">

                          <div className="
                            flex
                            items-center
                            justify-between
                          ">

                            <div>

                              <p className="
                                text-xs
                                text-slate-500
                              ">

                                📍 GPS

                              </p>


                              <p className="
                                text-sm
                                font-bold
                                mt-1
                              ">

                                {Number(
                                  miner.latitude
                                ) !== 0 &&
                                Number(
                                  miner.longitude
                                ) !== 0
                                  ? "Location Available"
                                  : "Location Unavailable"}

                              </p>

                            </div>


                            <SensorStatus
                              online={
                                isSensorOnline(
                                  miner,
                                  "gps"
                                )
                              }
                            />

                          </div>

                        </div>

                      </div>

                    </div>


                    {/* =========================================
                        ACTIONS
                    ========================================= */}

                    <div className="
                      px-5
                      py-4
                      bg-slate-950/40
                      border-t
                      border-slate-800
                      flex
                      flex-wrap
                      gap-2
                    ">

                      <Link
                        to={`/miner/${miner.userId}`}
                        className="
                          flex-1
                          min-w-[130px]
                          text-center
                          bg-cyan-600
                          hover:bg-cyan-500
                          px-4
                          py-2.5
                          rounded-xl
                          text-sm
                          font-bold
                          transition
                        "
                      >

                        View Details

                      </Link>


                      <Link
                        to={`/map/${miner.userId}`}
                        className="
                          flex-1
                          min-w-[130px]
                          text-center
                          bg-blue-600
                          hover:bg-blue-500
                          px-4
                          py-2.5
                          rounded-xl
                          text-sm
                          font-bold
                          transition
                        "
                      >

                        📍 Location

                      </Link>

                    </div>

                  </div>

                );

              }
            )}

          </div>


          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="
            mt-8
            bg-slate-900
            border
            border-slate-800
            rounded-2xl
            p-5
          ">

            <div className="
              flex
              flex-col
              md:flex-row
              md:items-center
              md:justify-between
              gap-4
            ">

              <div>

                <p className="
                  text-sm
                  font-bold
                ">

                  Central Control & Alert Management

                </p>


                <p className="
                  text-xs
                  text-slate-600
                  mt-1
                ">

                  Smart Wearable Jacket monitoring network

                </p>

                <p className="
                  text-[11px]
                  text-slate-400
                  mt-2
                ">
                  Created by Nadun Hansika | IT22121424
                </p>

              </div>


              <div className="
                flex
                flex-wrap
                gap-4
                text-xs
              ">

                <span className="
                  flex
                  items-center
                  gap-2
                  text-green-400
                ">

                  <span className={`
                    w-2
                    h-2
                    rounded-full
                    ${
                      socketConnected
                        ? "bg-green-500"
                        : "bg-red-500"
                    }
                  `} />

                  {socketConnected
                    ? "Socket Connected"
                    : "Socket Disconnected"}

                </span>


                <span className="
                  flex
                  items-center
                  gap-2
                  text-cyan-400
                ">

                  <span className="
                    w-2
                    h-2
                    bg-cyan-500
                    rounded-full
                  " />

                  Real-Time Data

                </span>


                <span className="
                  flex
                  items-center
                  gap-2
                  text-slate-500
                ">

                  ESP32 + LoRa

                </span>

              </div>

            </div>

          </div>

        </main>

      </div>

    </div>

  );

}


export default Dashboard;