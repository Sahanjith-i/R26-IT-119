import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function MinerMap() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [miner, setMiner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // MAP RECEIVER POSITIONS
  // These are VISUAL positions inside the mine map.
  //
  // Change these according to your actual mine layout.
  // =====================================================

  const RECEIVERS = {
    R1: {
      id: "R1",
      name: "Receiver 1",
      zone: "Mine Zone A",
      x: 20,
      y: 25,
    },

    R2: {
      id: "R2",
      name: "Receiver 2",
      zone: "Mine Zone B",
      x: 80,
      y: 30,
    },

    R3: {
      id: "R3",
      name: "Receiver 3",
      zone: "Mine Zone C",
      x: 50,
      y: 78,
    },
  };

  // =====================================================
  // FETCH MINER
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const fetchMiner = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/miners/${id}`
        );

        if (!mounted) return;

        setMiner(response.data);
        setError("");
        setLoading(false);
      } catch (err) {
        console.error("Failed to load miner:", err);

        if (mounted) {
          setError("Unable to load miner location.");
          setLoading(false);
        }
      }
    };

    fetchMiner();

    const interval = setInterval(fetchMiner, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [id]);

  // =====================================================
  // HELPERS
  // =====================================================

  const isNumber = (value) => {
    return (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      Number.isFinite(Number(value))
    );
  };

  const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
  };

  // =====================================================
  // RSSI → SIGNAL QUALITY
  // =====================================================

  const getSignalQuality = (rssi) => {
    if (!isNumber(rssi)) {
      return "NO SIGNAL";
    }

    const value = Number(rssi);

    if (value >= -60) return "EXCELLENT";
    if (value >= -70) return "GOOD";
    if (value >= -80) return "FAIR";
    if (value >= -90) return "WEAK";

    return "VERY WEAK";
  };

  const getSignalColor = (rssi) => {
    if (!isNumber(rssi)) {
      return "text-slate-600";
    }

    const value = Number(rssi);

    if (value >= -60) return "text-green-400";
    if (value >= -70) return "text-cyan-400";
    if (value >= -80) return "text-yellow-400";
    return "text-red-400";
  };

  // =====================================================
  // RSSI → WEIGHT
  //
  // Stronger RSSI gets higher weight.
  //
  // Example:
  //
  // R1 = -54
  // R2 = -68
  // R3 = -80
  //
  // R1 has highest influence.
  // =====================================================

  const getRSSIWeight = (rssi, strongestRSSI) => {
    if (!isNumber(rssi)) {
      return 0;
    }

    const value = Number(rssi);
    const strongest = Number(strongestRSSI);

    if (!Number.isFinite(strongest)) {
      return 0;
    }

    // Difference from strongest signal.
    const difference = strongest - value;

    // Exponential weighting.
    // Prevents a weak receiver from pulling the
    // miner too far toward itself.
    const weight = Math.pow(
      10,
      -Math.max(difference, 0) / 18
    );

    return weight;
  };

  // =====================================================
  // LOCATION CALCULATION
  // =====================================================

  const locationData = useMemo(() => {
    if (!miner) {
      return null;
    }

    const receiverRSSI = miner.receiverRSSI || {};

    const validReceivers = Object.values(RECEIVERS)
      .map((receiver) => ({
        ...receiver,
        rssi: isNumber(receiverRSSI[receiver.id])
          ? Number(receiverRSSI[receiver.id])
          : null,
      }))
      .filter((receiver) => receiver.rssi !== null);

    // ===================================================
    // NO RECEIVER SIGNAL
    // ===================================================

    if (validReceivers.length === 0) {
      return {
        available: false,
        x: 50,
        y: 50,
        strongest: null,
        direction: "Unknown",
        distance: null,
        confidence: 0,
        receivers: [],
      };
    }

    // ===================================================
    // SORT STRONGEST FIRST
    // ===================================================

    const sorted = [...validReceivers].sort(
      (a, b) => b.rssi - a.rssi
    );

    const strongest = sorted[0];

    // ===================================================
    // SINGLE RECEIVER
    // ===================================================

    if (sorted.length === 1) {
      return {
        available: true,
        x: strongest.x,
        y: strongest.y,
        strongest,
        direction: "Near " + strongest.id,
        distance: estimateDistance(strongest.rssi),
        confidence: 45,
        receivers: sorted,
      };
    }

    // ===================================================
    // MULTI RECEIVER WEIGHTED POSITION
    // ===================================================

    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;

    sorted.forEach((receiver) => {
      const weight = getRSSIWeight(
        receiver.rssi,
        strongest.rssi
      );

      totalWeight += weight;

      weightedX += receiver.x * weight;
      weightedY += receiver.y * weight;
    });

    let x =
      totalWeight > 0
        ? weightedX / totalWeight
        : strongest.x;

    let y =
      totalWeight > 0
        ? weightedY / totalWeight
        : strongest.y;

    // ===================================================
    // KEEP MINER INSIDE MAP
    // ===================================================

    x = clamp(x, 10, 90);
    y = clamp(y, 12, 88);

    // ===================================================
    // DIRECTION FROM STRONGEST RECEIVER
    // ===================================================

    const dx = x - strongest.x;
    const dy = strongest.y - y;

    let direction = "Near Receiver";

    if (Math.abs(dx) < 7 && Math.abs(dy) < 7) {
      direction = `Near ${strongest.id}`;
    } else {
      const horizontal =
        dx > 7
          ? "East"
          : dx < -7
          ? "West"
          : "";

      const vertical =
        dy > 7
          ? "North"
          : dy < -7
          ? "South"
          : "";

      if (vertical && horizontal) {
        direction = `${vertical}-${horizontal}`;
      } else if (vertical) {
        direction = vertical;
      } else if (horizontal) {
        direction = horizontal;
      }
    }

    // ===================================================
    // DISTANCE
    // ===================================================

    const distance = estimateDistance(
      strongest.rssi
    );

    // ===================================================
    // CONFIDENCE
    // ===================================================

    let confidence = 45;

    if (sorted.length === 2) {
      confidence = 65;
    }

    if (sorted.length === 3) {
      confidence = 85;
    }

    const signalDifference =
      Math.abs(
        sorted[0].rssi -
          sorted[sorted.length - 1].rssi
      );

    if (signalDifference < 8) {
      confidence += 5;
    }

    confidence = clamp(
      confidence,
      40,
      95
    );

    return {
      available: true,
      x,
      y,
      strongest,
      direction,
      distance,
      confidence,
      receivers: sorted,
    };
  }, [miner]);

  // =====================================================
  // APPROXIMATE RSSI DISTANCE
  // =====================================================

  function estimateDistance(rssi) {
    if (!isNumber(rssi)) {
      return null;
    }

    const value = Number(rssi);

    /*
      Approximate only.

      Real mine calibration is required for
      accurate physical distance.
    */

    const referenceRSSI = -45;
    const pathLossExponent = 2.7;

    const distance = Math.pow(
      10,
      (referenceRSSI - value) /
        (10 * pathLossExponent)
    );

    return clamp(
      Number(distance.toFixed(1)),
      1,
      500
    );
  }

  // =====================================================
  // LOCATION
  // =====================================================

  const locationAvailable =
    locationData?.available === true;

  const minerX =
    locationData?.x ?? 50;

  const minerY =
    locationData?.y ?? 50;

  const minerTop =
    `${minerY}%`;

  const minerLeft =
    `${minerX}%`;

  const strongestReceiver =
    locationData?.strongest;

  const strongestRSSI =
    strongestReceiver?.rssi ?? null;

  // =====================================================
  // LOCATION NAME
  // =====================================================

  const getLocationName = () => {
    if (!locationData?.available) {
      return "Location Unavailable";
    }

    if (!strongestReceiver) {
      return "Unknown Area";
    }

    const direction =
      locationData.direction;

    if (
      direction ===
      `Near ${strongestReceiver.id}`
    ) {
      return strongestReceiver.zone;
    }

    return `${strongestReceiver.zone} • ${direction}`;
  };

  const estimatedLocation =
    miner?.estimatedLocation ||
    getLocationName();

  // =====================================================
  // STATUS
  // =====================================================

  const status =
    miner?.status || "SAFE";

  const statusStyle =
    status === "DANGER"
      ? "bg-red-500/15 border-red-500/40 text-red-400"
      : status === "WARNING"
      ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400"
      : "bg-green-500/15 border-green-500/40 text-green-400";

  const statusIcon =
    status === "DANGER"
      ? "🔴"
      : status === "WARNING"
      ? "🟡"
      : "🟢";

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin mx-auto mb-5" />

          <h2 className="text-xl font-bold">
            Loading Miner Location...
          </h2>

          <p className="text-slate-400 mt-2">
            Connecting to Central Control System
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !miner) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">
            ⚠️
          </div>

          <h2 className="text-2xl font-bold">
            Unable to Load Miner
          </h2>

          <p className="text-slate-400 mt-3">
            {error ||
              "Miner data is not available."}
          </p>

          <button
            onClick={() => navigate(-1)}
            className="mt-6 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold transition"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">

        <div>
          <p className="text-cyan-400 text-sm font-semibold uppercase tracking-wider">
            Central Control System
          </p>

          <h1 className="text-3xl md:text-4xl font-bold mt-1">
            📡 Miner Location Tracking
          </h1>

          <p className="text-slate-400 mt-2">
            Real-time LoRa RSSI based miner location
            estimation
          </p>
        </div>

        <div
          className={`
            px-5
            py-3
            rounded-xl
            border
            font-bold
            flex
            items-center
            gap-2
            ${statusStyle}
          `}
        >
          <span>{statusIcon}</span>
          <span>{status}</span>
        </div>

      </div>

      {/* =================================================
          MINER HEADER
      ================================================= */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider">
              Monitoring Miner
            </p>

            <h2 className="text-2xl font-bold text-cyan-400 mt-1">
              {miner.userId}
            </h2>

            {miner.fullName && (
              <p className="text-slate-400 mt-1">
                {miner.fullName}
              </p>
            )}
          </div>

          <div
            className={`
              px-5
              py-3
              rounded-xl
              border
              ${
                locationAvailable
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }
            `}
          >
            <p className="text-xs text-slate-500 uppercase">
              Location Status
            </p>

            <p
              className={`
                font-bold
                mt-1
                ${
                  locationAvailable
                    ? "text-green-400"
                    : "text-red-400"
                }
              `}
            >
              {locationAvailable
                ? "● LORA TRACKING ONLINE"
                : "● LOCATION OFFLINE"}
            </p>
          </div>

        </div>
      </div>

      {/* =================================================
          MAP
      ================================================= */}

      {locationAvailable ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">

          {/* MAP HEADER */}

          <div className="px-6 py-5 border-b border-slate-800">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>
                <h2 className="text-xl font-bold">
                  🗺️ Live Underground Miner Position
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Position estimated from R1, R2 and R3
                  LoRa RSSI signals
                </p>
              </div>

              <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">

                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                </span>

                LORA LIVE

              </div>

            </div>
          </div>

          {/* =================================================
              MAP AREA
          ================================================= */}

          <div className="relative w-full h-[600px] bg-slate-950 overflow-hidden">

            {/* GRID */}

            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)",
                backgroundSize:
                  "40px 40px",
              }}
            />

            {/* MINE BORDER */}

            <div className="absolute inset-8 border border-slate-700 rounded-3xl">

              {/* TITLE */}

              <div className="absolute top-4 left-5 text-xs text-slate-500 uppercase tracking-widest">
                Underground Mine Monitoring Area
              </div>

              {/* =================================================
                  CONNECTION LINES
              ================================================= */}

              {locationData.receivers.map(
                (receiver) => {

                  const dx =
                    minerX -
                    receiver.x;

                  const dy =
                    minerY -
                    receiver.y;

                  const length =
                    Math.sqrt(
                      dx * dx +
                        dy * dy
                    );

                  const angle =
                    Math.atan2(
                      dy,
                      dx
                    ) *
                    (180 / Math.PI);

                  return (
                    <div
                      key={`line-${receiver.id}`}
                      className="
                        absolute
                        h-[2px]
                        bg-cyan-400/20
                        origin-left
                        pointer-events-none
                      "
                      style={{
                        left:
                          `${receiver.x}%`,
                        top:
                          `${receiver.y}%`,
                        width:
                          `${length}%`,
                        transform:
                          `rotate(${angle}deg)`,
                      }}
                    />
                  );
                }
              )}

              {/* =================================================
                  R1
              ================================================= */}

              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{
                  left: `${RECEIVERS.R1.x}%`,
                  top: `${RECEIVERS.R1.y}%`,
                }}
              >

                <div
                  className={`
                    w-16
                    h-16
                    rounded-full
                    flex
                    items-center
                    justify-center
                    border-4
                    ${
                      strongestReceiver?.id ===
                      "R1"
                        ? "bg-green-500/20 border-green-400 shadow-lg shadow-green-500/40"
                        : "bg-slate-800 border-slate-600"
                    }
                  `}
                >
                  <span className="text-2xl">
                    📡
                  </span>
                </div>

                <span className="mt-2 font-bold">
                  R1
                </span>

                <span className="text-xs text-slate-400">
                  Mine Zone A
                </span>

              </div>

              {/* =================================================
                  R2
              ================================================= */}

              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{
                  left: `${RECEIVERS.R2.x}%`,
                  top: `${RECEIVERS.R2.y}%`,
                }}
              >

                <div
                  className={`
                    w-16
                    h-16
                    rounded-full
                    flex
                    items-center
                    justify-center
                    border-4
                    ${
                      strongestReceiver?.id ===
                      "R2"
                        ? "bg-green-500/20 border-green-400 shadow-lg shadow-green-500/40"
                        : "bg-slate-800 border-slate-600"
                    }
                  `}
                >
                  <span className="text-2xl">
                    📡
                  </span>
                </div>

                <span className="mt-2 font-bold">
                  R2
                </span>

                <span className="text-xs text-slate-400">
                  Mine Zone B
                </span>

              </div>

              {/* =================================================
                  R3
              ================================================= */}

              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{
                  left: `${RECEIVERS.R3.x}%`,
                  top: `${RECEIVERS.R3.y}%`,
                }}
              >

                <div
                  className={`
                    w-16
                    h-16
                    rounded-full
                    flex
                    items-center
                    justify-center
                    border-4
                    ${
                      strongestReceiver?.id ===
                      "R3"
                        ? "bg-green-500/20 border-green-400 shadow-lg shadow-green-500/40"
                        : "bg-slate-800 border-slate-600"
                    }
                  `}
                >
                  <span className="text-2xl">
                    📡
                  </span>
                </div>

                <span className="mt-2 font-bold">
                  R3
                </span>

                <span className="text-xs text-slate-400">
                  Mine Zone C
                </span>

              </div>

              {/* =================================================
                  MINER SIGNAL RADIUS
              ================================================= */}

              <div
                className="
                  absolute
                  -translate-x-1/2
                  -translate-y-1/2
                  rounded-full
                  border
                  border-cyan-400/20
                  bg-cyan-400/[0.04]
                  pointer-events-none
                "
                style={{
                  left: minerLeft,
                  top: minerTop,
                  width:
                    `${Math.max(
                      100 -
                        locationData.confidence,
                      12
                    ) * 2}px`,
                  height:
                    `${Math.max(
                      100 -
                        locationData.confidence,
                      12
                    ) * 2}px`,
                }}
              />

              {/* =================================================
                  MINER
              ================================================= */}

              <div
                className="
                  absolute
                  -translate-x-1/2
                  -translate-y-1/2
                  flex
                  flex-col
                  items-center
                  z-30
                  transition-all
                  duration-1000
                  ease-out
                "
                style={{
                  top: minerTop,
                  left: minerLeft,
                }}
              >

                {/* PULSE */}

                <div className="relative">

                  <div className="
                    absolute
                    inset-0
                    -m-3
                    rounded-full
                    bg-cyan-400/20
                    animate-ping
                  " />

                  <div className="
                    relative
                    w-[74px]
                    h-[74px]
                    rounded-full
                    bg-cyan-500
                    border-4
                    border-white
                    shadow-xl
                    shadow-cyan-500/40
                    flex
                    items-center
                    justify-center
                  ">
                    <span className="text-3xl">
                      👷
                    </span>
                  </div>

                </div>

                {/* LABEL */}

                <div className="
                  mt-3
                  bg-slate-900/95
                  border
                  border-cyan-500/40
                  rounded-xl
                  px-4
                  py-3
                  text-center
                  shadow-2xl
                  min-w-[180px]
                ">

                  <p className="text-cyan-400 font-bold">
                    {miner.userId}
                  </p>

                  <p className="text-white text-sm font-semibold mt-1">
                    📍 {estimatedLocation}
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    📡 Nearest:{" "}
                    {strongestReceiver?.id}
                  </p>

                  <p className="text-xs text-purple-300 mt-1">
                    🧭{" "}
                    {locationData.direction}
                  </p>

                  <p className="text-xs text-yellow-300 mt-1">
                    📏{" "}
                    {locationData.distance !== null
                      ? `${locationData.distance} m`
                      : "N/A"}
                  </p>

                </div>

              </div>

            </div>

            {/* =================================================
                CURRENT LOCATION
            ================================================= */}

            <div className="
              absolute
              top-5
              right-5
              bg-slate-900/95
              border
              border-green-500/30
              rounded-xl
              px-5
              py-4
              shadow-xl
            ">

              <p className="text-xs text-slate-500 uppercase">
                Current Estimated Location
              </p>

              <p className="text-lg font-bold text-green-400 mt-1">
                📍 {estimatedLocation}
              </p>

              <p className="text-sm text-slate-400 mt-1">
                Nearest Receiver:{" "}
                {strongestReceiver?.id || "N/A"}
              </p>

              <p className="text-xs text-purple-400 mt-1">
                🧭 {locationData.direction}
              </p>

            </div>

            {/* =================================================
                RSSI
            ================================================= */}

            <div className="
              absolute
              bottom-5
              left-5
              bg-slate-900/95
              border
              border-slate-700
              rounded-xl
              px-5
              py-4
              shadow-xl
            ">

              <p className="text-xs text-slate-500 uppercase">
                Strongest LoRa Signal
              </p>

              <p
                className={`
                  text-xl
                  font-bold
                  mt-1
                  ${getSignalColor(
                    strongestRSSI
                  )}
                `}
              >
                {strongestRSSI !== null
                  ? `${strongestRSSI} dBm`
                  : "N/A"}
              </p>

              <p className="text-xs text-slate-400 mt-1">
                {getSignalQuality(
                  strongestRSSI
                )}
              </p>

            </div>

            {/* =================================================
                CONFIDENCE
            ================================================= */}

            <div className="
              absolute
              bottom-5
              right-5
              bg-slate-900/95
              border
              border-cyan-500/30
              rounded-xl
              px-5
              py-4
              shadow-xl
            ">

              <p className="text-xs text-slate-500 uppercase">
                Location Confidence
              </p>

              <p className="text-xl font-bold text-cyan-400 mt-1">
                {locationData.confidence}%
              </p>

              <div className="w-32 h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">

                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-700"
                  style={{
                    width:
                      `${locationData.confidence}%`,
                  }}
                />

              </div>

            </div>

          </div>

          {/* =================================================
              RECEIVER SIGNAL SUMMARY
          ================================================= */}

          <div className="p-6">

            <h2 className="text-xl font-bold mb-4">
              📡 Receiver Signal Analysis
            </h2>

            <div className="
              grid
              grid-cols-1
              md:grid-cols-3
              gap-4
            ">

              {Object.values(RECEIVERS).map(
                (receiver) => {

                  const rssi =
                    miner.receiverRSSI?.[
                      receiver.id
                    ];

                  const isStrongest =
                    strongestReceiver?.id ===
                    receiver.id;

                  return (
                    <div
                      key={receiver.id}
                      className={`
                        bg-slate-950
                        border
                        rounded-xl
                        p-5
                        transition
                        ${
                          isStrongest
                            ? "border-green-500/50 shadow-lg shadow-green-500/10"
                            : "border-slate-800"
                        }
                      `}
                    >

                      <div className="flex items-center justify-between">

                        <div>
                          <p className="font-bold">
                            📡{" "}
                            {receiver.id}
                          </p>

                          <p className="text-xs text-slate-500 mt-1">
                            {receiver.zone}
                          </p>
                        </div>

                        {isStrongest && (
                          <span className="
                            text-[10px]
                            font-bold
                            text-green-400
                            bg-green-500/10
                            border
                            border-green-500/20
                            px-2
                            py-1
                            rounded
                          ">
                            STRONGEST
                          </span>
                        )}

                      </div>

                      <p
                        className={`
                          text-2xl
                          font-bold
                          mt-4
                          ${getSignalColor(
                            isNumber(rssi)
                              ? Number(rssi)
                              : null
                          )}
                        `}
                      >
                        {isNumber(rssi)
                          ? `${Number(rssi)} dBm`
                          : "NO SIGNAL"}
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        {getSignalQuality(
                          isNumber(rssi)
                            ? Number(rssi)
                            : null
                        )}
                      </p>

                    </div>
                  );
                }
              )}

            </div>

            {/* =================================================
                LOCATION DETAILS
            ================================================= */}

            <div className="
              mt-6
              bg-cyan-500/5
              border
              border-cyan-500/20
              rounded-xl
              p-5
            ">

              <div className="flex gap-3">

                <div className="text-xl">
                  📡
                </div>

                <div className="flex-1">

                  <p className="font-semibold text-cyan-400">
                    LoRa RSSI Location Tracking
                  </p>

                  <p className="text-sm text-slate-400 mt-1">
                    Miner position is estimated by
                    comparing the signal strengths received
                    by R1, R2 and R3.
                  </p>

                  <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-4
                    gap-4
                    mt-4
                  ">

                    <div>
                      <p className="text-xs text-slate-500">
                        Strongest RSSI
                      </p>

                      <p className="font-bold mt-1">
                        {strongestRSSI !== null
                          ? `${strongestRSSI} dBm`
                          : "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Nearest Receiver
                      </p>

                      <p className="font-bold text-green-400 mt-1">
                        {strongestReceiver?.id ||
                          "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Direction
                      </p>

                      <p className="font-bold text-purple-400 mt-1">
                        🧭{" "}
                        {locationData.direction}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Distance
                      </p>

                      <p className="font-bold text-yellow-400 mt-1">
                        📏{" "}
                        {locationData.distance !== null
                          ? `${locationData.distance} m`
                          : "N/A"}
                      </p>
                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                BUTTONS
            ================================================= */}

            <div className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-3
              mt-5
            ">

              <button
                onClick={() => {
                  alert(
                    `Miner: ${miner.userId}\n\n` +
                    `Location: ${estimatedLocation}\n` +
                    `Nearest Receiver: ${
                      strongestReceiver?.id ||
                      "N/A"
                    }\n` +
                    `Direction: ${
                      locationData.direction
                    }\n` +
                    `Distance: ${
                      locationData.distance !== null
                        ? `${locationData.distance} m`
                        : "N/A"
                    }\n` +
                    `RSSI: ${
                      strongestRSSI !== null
                        ? `${strongestRSSI} dBm`
                        : "N/A"
                    }\n` +
                    `Confidence: ${
                      locationData.confidence
                    }%`
                  );
                }}
                className="
                  bg-cyan-600
                  hover:bg-cyan-500
                  px-5
                  py-3
                  rounded-xl
                  font-bold
                  transition
                "
              >
                📍 View Location Details
              </button>

              <button
                onClick={() => navigate(-1)}
                className="
                  bg-slate-700
                  hover:bg-slate-600
                  px-5
                  py-3
                  rounded-xl
                  font-bold
                  transition
                "
              >
                ← Back to Miner
              </button>

            </div>

          </div>

        </div>
      ) : (

        /* =================================================
           LOCATION OFFLINE
        ================================================= */

        <div className="
          bg-slate-900
          border
          border-red-500/30
          rounded-2xl
          p-12
          text-center
        ">

          <div className="text-6xl mb-5">
            📡
          </div>

          <h2 className="text-2xl font-bold">
            LoRa Location Unavailable
          </h2>

          <p className="text-slate-400 max-w-lg mx-auto mt-3">
            No valid LoRa receiver signal is currently
            available for this miner.
          </p>

          <button
            onClick={() => navigate(-1)}
            className="
              mt-6
              bg-slate-700
              hover:bg-slate-600
              px-6
              py-3
              rounded-xl
              font-bold
              transition
            "
          >
            ← Back to Miner
          </button>

        </div>
      )}

    </div>
  );
}

export default MinerMap;