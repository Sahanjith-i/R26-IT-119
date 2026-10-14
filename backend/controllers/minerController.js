const Miner = require("../models/Miner");

// =====================================================
// 🧠 CENTRAL CONTROL — SMART MINER SAFETY JACKET
// =====================================================


// =====================================================
// 🔧 NUMBER HELPER
// =====================================================

const toNumber = (value, fallback = null) => {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};


// =====================================================
// 🔧 BOOLEAN HELPER
// =====================================================

const toBoolean = (
  value,
  fallback = false
) => {

  if (typeof value === "boolean") {
    return value;
  }

  if (
    value === 1 ||
    value === "1" ||
    value === "true" ||
    value === "TRUE"
  ) {
    return true;
  }

  if (
    value === 0 ||
    value === "0" ||
    value === "false" ||
    value === "FALSE"
  ) {
    return false;
  }

  return fallback;
};


// =====================================================
// ❤️ HEART RATE
// =====================================================

const getHeartRate = (data) => {

  if (
    data.heartRate !== undefined &&
    data.heartRate !== null
  ) {
    return toNumber(
      data.heartRate,
      null
    );
  }

  if (
    data.bpm !== undefined &&
    data.bpm !== null
  ) {
    return toNumber(
      data.bpm,
      null
    );
  }

  if (
    data.PLS !== undefined &&
    data.PLS !== null
  ) {
    return toNumber(
      data.PLS,
      null
    );
  }

  if (
    data.pls !== undefined &&
    data.pls !== null
  ) {
    return toNumber(
      data.pls,
      null
    );
  }

  return null;
};


// =====================================================
// 🚦 STATUS LOGIC
// =====================================================

const getStatus = (data) => {

  const temperature =
    toNumber(
      data.temperature,
      0
    );

  const heartRate =
    getHeartRate(data) || 0;

  const spo2 =
    toNumber(
      data.spo2,
      0
    );

  const co2 =
    toNumber(
      data.co2 ??
      data.estimatedCO2 ??
      data.CO2,
      0
    );

  const ammonia =
    toNumber(
      data.ammonia ??
      data.mq135Ammonia,
      0
    );

  const mq4 =
    toNumber(
      data.mq4 ??
      data.methane ??
      data.M4,
      0
    );

  const mq7 =
    toNumber(
      data.mq7 ??
      data.carbonMonoxide ??
      data.M7,
      0
    );

  const fallDetected =
    toBoolean(
      data.fallDetected ??
      data.FALL,
      false
    );

  const sosAlert =
    toBoolean(
      data.sosAlert ??
      data.sos ??
      data.SOS,
      false
    );


  // ===================================================
  // 🚨 DANGER
  // ===================================================

  if (sosAlert) {
    return "DANGER";
  }

  if (fallDetected) {
    return "DANGER";
  }

  if (
    heartRate > 150 ||
    (
      heartRate > 0 &&
      heartRate < 40
    )
  ) {
    return "DANGER";
  }

  if (
    spo2 > 0 &&
    spo2 < 90
  ) {
    return "DANGER";
  }

  if (temperature > 39) {
    return "DANGER";
  }

  if (co2 > 1500) {
    return "DANGER";
  }

  if (ammonia > 3000) {
    return "DANGER";
  }

  if (mq4 > 2500) {
    return "DANGER";
  }

  if (mq7 > 3800) {
    return "DANGER";
  }


  // ===================================================
  // ⚠️ WARNING
  // ===================================================

  if (
    heartRate > 100 &&
    heartRate <= 150
  ) {
    return "WARNING";
  }

  if (
    spo2 >= 90 &&
    spo2 < 92
  ) {
    return "WARNING";
  }

  if (temperature > 37.5) {
    return "WARNING";
  }

  if (co2 > 1000) {
    return "WARNING";
  }

  if (ammonia > 1500) {
    return "WARNING";
  }

  if (mq4 > 1500) {
    return "WARNING";
  }

  if (mq7 > 2000) {
    return "WARNING";
  }

  return "SAFE";
};


// =====================================================
// 🚨 ALERT REASON
// =====================================================

const getAlertReason = (data) => {

  const temperature =
    toNumber(
      data.temperature,
      0
    );

  const heartRate =
    getHeartRate(data) || 0;

  const spo2 =
    toNumber(
      data.spo2,
      0
    );

  const co2 =
    toNumber(
      data.co2 ??
      data.estimatedCO2 ??
      data.CO2,
      0
    );

  const ammonia =
    toNumber(
      data.ammonia ??
      data.mq135Ammonia,
      0
    );

  const mq4 =
    toNumber(
      data.mq4 ??
      data.methane ??
      data.M4,
      0
    );

  const mq7 =
    toNumber(
      data.mq7 ??
      data.carbonMonoxide ??
      data.M7,
      0
    );

  const fallDetected =
    toBoolean(
      data.fallDetected ??
      data.FALL,
      false
    );

  const sosAlert =
    toBoolean(
      data.sosAlert ??
      data.sos ??
      data.SOS,
      false
    );


  if (sosAlert) {
    return "SOS emergency button activated";
  }

  if (fallDetected) {
    return "Fall detected by MPU6050";
  }

  if (
    heartRate > 150 ||
    (
      heartRate > 0 &&
      heartRate < 40
    )
  ) {
    return "Abnormal heart rate detected";
  }

  if (
    heartRate > 100 &&
    heartRate <= 150
  ) {
    return "High heart rate detected";
  }

  if (
    spo2 > 0 &&
    spo2 < 90
  ) {
    return "Critically low SpO2 level";
  }

  if (
    spo2 >= 90 &&
    spo2 < 92
  ) {
    return "Low SpO2 level detected";
  }

  if (temperature > 39) {
    return "Critical body temperature detected";
  }

  if (temperature > 37.5) {
    return "High body temperature detected";
  }

  if (co2 > 1500) {
    return "Critical CO2 level detected";
  }

  if (co2 > 1000) {
    return "High CO2 level detected";
  }

  if (ammonia > 3000) {
    return "Critical ammonia level detected";
  }

  if (ammonia > 1500) {
    return "High ammonia level detected";
  }

  if (mq4 > 2500) {
    return "Critical methane level detected";
  }

  if (mq4 > 1500) {
    return "High methane level detected";
  }

  if (mq7 > 3800) {
    return "Critical carbon monoxide level detected";
  }

  if (mq7 > 2000) {
    return "High carbon monoxide level detected";
  }

  return "";
};


// =====================================================
// 💡 JACKET ALERT OUTPUTS
// =====================================================

const getAlertOutputs = (status) => {

  if (status === "DANGER") {

    return {
      ledAlert: true,
      buzzerAlert: true,
      vibrationAlert: true,
    };
  }

  if (status === "WARNING") {

    return {
      ledAlert: true,
      buzzerAlert: false,
      vibrationAlert: true,
    };
  }

  return {
    ledAlert: false,
    buzzerAlert: false,
    vibrationAlert: false,
  };
};


// =====================================================
// 📡 SENSOR NAMES
// =====================================================

const SENSOR_NAMES = {

  heartRate:
    "Pulse Rate Sensor",

  spo2:
    "MAX30102 SpO2 Sensor",

  motion:
    "MPU6050 Motion Sensor",

  temperature:
    "GY-906 MLX90614 Temperature Sensor",

  co2:
    "MQ135 CO2 Sensor",

  ammonia:
    "MQ135 Ammonia Sensor",

  methane:
    "MQ4 Methane Sensor",

  carbonMonoxide:
    "MQ7 Carbon Monoxide Sensor",

  pressure:
    "BMP280 Pressure Sensor",

  sosButton:
    "SOS Push Button",
};


// =====================================================
// 📡 SENSOR KEY LIST
// =====================================================

const SENSOR_KEYS = [

  "heartRate",
  "spo2",
  "motion",
  "temperature",
  "co2",
  "ammonia",
  "methane",
  "carbonMonoxide",
  "pressure",

];


// =====================================================
// 📡 SENSOR STATUS
// =====================================================

const getSensorStatus = (data) => {

  const incoming =
    data.sensorStatus || {};

  const hasExplicitStatus =
    Object.keys(incoming).length > 0;


  if (hasExplicitStatus) {

    return {

      heartRate:
        incoming.heartRate === true,

      spo2:
        incoming.spo2 === true,

      motion:
        incoming.motion === true,

      temperature:
        incoming.temperature === true,

      co2:
        incoming.co2 === true,

      ammonia:
        incoming.ammonia === true,

      methane:
        incoming.methane === true,

      carbonMonoxide:
        incoming.carbonMonoxide === true,

      pressure:
        incoming.pressure === true,

      sosButton:
        incoming.sosButton !== false,

    };
  }


  return {

    heartRate:
      data.heartRate !== undefined ||
      data.bpm !== undefined ||
      data.PLS !== undefined ||
      data.pls !== undefined,

    spo2:
      data.spo2 !== undefined ||
      data.SPO !== undefined ||
      data.spo !== undefined,

    motion:
      data.motionStatus !== undefined ||
      data.fallDetected !== undefined ||
      data.FALL !== undefined,

    temperature:
      data.temperature !== undefined ||
      data.bodyTemp !== undefined ||
      data.BTMP !== undefined,

    co2:
      data.co2 !== undefined ||
      data.estimatedCO2 !== undefined ||
      data.CO2 !== undefined,

    ammonia:
      data.ammonia !== undefined ||
      data.mq135Ammonia !== undefined,

    methane:
      data.mq4 !== undefined ||
      data.methane !== undefined ||
      data.M4 !== undefined,

    carbonMonoxide:
      data.mq7 !== undefined ||
      data.carbonMonoxide !== undefined ||
      data.M7 !== undefined,

    pressure:
      data.pressure !== undefined ||
      data.PRS !== undefined ||
      data.prs !== undefined,

    sosButton:
      data.sosButton !== false,

  };
};


// =====================================================
// 📊 GET LAST VALID VALUE
// =====================================================

const getLastValue = (
  miner,
  sensor
) => {

  if (!miner) {
    return null;
  }

  const values = {

    heartRate:
      miner.heartRate ??
      miner.bpm,

    spo2:
      miner.spo2,

    motion:
      miner.motionStatus,

    temperature:
      miner.temperature,

    co2:
      miner.co2,

    ammonia:
      miner.ammonia,

    methane:
      miner.mq4,

    carbonMonoxide:
      miner.mq7,

    pressure:
      miner.pressure,

    sosButton:
      miner.sosAlert,

  };

  return values[sensor] ?? null;
};


// =====================================================
// 🔴 GET OFFLINE SENSOR LIST
// =====================================================

const getOfflineSensors = (
  sensorStatus
) => {

  return SENSOR_KEYS
    .filter(
      (sensor) =>
        sensorStatus[sensor] !== true
    )
    .map(
      (sensor) =>
        SENSOR_NAMES[sensor]
    );
};


// =====================================================
// 📊 SENSOR STATUS SUMMARY
// =====================================================

const getSensorSummary = (
  sensorStatus
) => {

  const offlineSensors =
    getOfflineSensors(
      sensorStatus
    );

  return {

    offlineSensorCount:
      offlineSensors.length,

    offlineSensors,

    allSensorsOffline:
      offlineSensors.length ===
      SENSOR_KEYS.length,

  };
};


// =====================================================
// 🚨 SENSOR STATUS EVENTS
// =====================================================

const emitSensorStatusChanges = (
  io,
  previousStatus,
  currentStatus,
  miner
) => {

  if (!io || !miner) {
    return;
  }

  SENSOR_KEYS.forEach(
    (sensorKey) => {

      const oldValue =
        previousStatus?.[sensorKey];

      const newValue =
        currentStatus?.[sensorKey];


      if (
        oldValue === true &&
        newValue === false
      ) {

        const eventData = {

          minerId:
            miner.userId,

          sensor:
            sensorKey,

          sensorName:
            SENSOR_NAMES[sensorKey],

          status:
            "OFFLINE",

          lastValue:
            getLastValue(
              miner,
              sensorKey
            ),

          message:
            `${SENSOR_NAMES[sensorKey]} is offline. Showing last received value.`,

          timestamp:
            new Date(),

        };


        io.emit(
          "sensorOffline",
          eventData
        );

        io.emit(
          "notification",
          {
            type:
              "SENSOR_OFFLINE",

            severity:
              "WARNING",

            ...eventData,
          }
        );

        console.log(
          `🔴 ${SENSOR_NAMES[sensorKey]} OFFLINE - ${miner.userId}`
        );
      }


      if (
        oldValue === false &&
        newValue === true
      ) {

        const eventData = {

          minerId:
            miner.userId,

          sensor:
            sensorKey,

          sensorName:
            SENSOR_NAMES[sensorKey],

          status:
            "ONLINE",

          message:
            `${SENSOR_NAMES[sensorKey]} is back online.`,

          timestamp:
            new Date(),

        };


        io.emit(
          "sensorOnline",
          eventData
        );

        io.emit(
          "notification",
          {
            type:
              "SENSOR_ONLINE",

            severity:
              "SUCCESS",

            ...eventData,
          }
        );

        console.log(
          `🟢 ${SENSOR_NAMES[sensorKey]} ONLINE - ${miner.userId}`
        );
      }

    }
  );
};


// =====================================================
// 🚨 ALL SENSORS OFFLINE
// =====================================================

const emitAllSensorsOfflineAlert = (
  io,
  miner,
  allSensorsOffline
) => {

  if (!io || !miner) {
    return;
  }

  if (!allSensorsOffline) {
    return;
  }

  const eventData = {

    minerId:
      miner.userId,

    type:
      "ALL_SENSORS_OFFLINE",

    severity:
      "CRITICAL",

    message:
      "All jacket sensors are offline. No new sensor data is being received.",

    timestamp:
      new Date(),

  };


  io.emit(
    "allSensorsOffline",
    eventData
  );

  io.emit(
    "notification",
    eventData
  );

  console.log(
    `🚨 ALL SENSORS OFFLINE - ${miner.userId}`
  );
};


// =====================================================
// 📡 LORA RSSI LOCATION TRACKING
// =====================================================
//
// GPS is NOT used.
//
// R1 / R2 / R3 are fixed LoRa receivers.
//
// Stronger RSSI = closer to receiver.
//
// Change x/y according to your actual mine map.
//
// =====================================================

const RECEIVER_POSITIONS = {

  R1: {

    x: 0,
    y: 0,

    zone:
      "Mine Zone A",

  },

  R2: {

    x: 100,
    y: 0,

    zone:
      "Mine Zone B",

  },

  R3: {

    x: 50,
    y: 100,

    zone:
      "Mine Zone C",

  },

};


// =====================================================
// 📏 CALIBRATED RSSI → DISTANCE
// =====================================================
//
// REAL TEST:
//
// R1 RSSI         = -67 dBm
// Actual distance = 2.0 m
//
// Therefore:
//
// -67 dBm = approximately 2.0 m
//
// =====================================================

const estimateDistanceFromRSSI = (
  rssi
) => {

  const value =
    Number(rssi);

  if (
    !Number.isFinite(value)
  ) {
    return null;
  }


  // ===================================================
  // 🎯 REAL CALIBRATION POINT
  // ===================================================

  const referenceRSSI =
    -67;

  const referenceDistance =
    2.0;


  // ===================================================
  // 📡 PATH LOSS EXPONENT
  // ===================================================

  const pathLossExponent =
    2.7;


  // ===================================================
  // 📐 DISTANCE FORMULA
  // ===================================================
  //
  // d =
  // referenceDistance *
  // 10 ^ (
  //   (referenceRSSI - currentRSSI)
  //   /
  //   (10 * pathLossExponent)
  // )
  //
  // -67 dBm → 2.0 m
  //
  // ===================================================

  let distance =
    referenceDistance *
    Math.pow(
      10,
      (
        referenceRSSI -
        value
      ) /
      (
        10 *
        pathLossExponent
      )
    );


  // ===================================================
  // 🛡️ SAFE LIMIT
  // ===================================================

  distance =
    Math.max(
      0.5,
      distance
    );

  distance =
    Math.min(
      100,
      distance
    );


  return Number(
    distance.toFixed(1)
  );
};


// =====================================================
// 🧭 DIRECTION
// =====================================================

const getDirection = (
  x,
  y
) => {

  if (
    Math.abs(x) < 15 &&
    Math.abs(y) < 15
  ) {
    return "Near Center";
  }

  if (
    x >= 15 &&
    y >= 15
  ) {
    return "North-East";
  }

  if (
    x <= -15 &&
    y >= 15
  ) {
    return "North-West";
  }

  if (
    x >= 15 &&
    y <= -15
  ) {
    return "South-East";
  }

  if (
    x <= -15 &&
    y <= -15
  ) {
    return "South-West";
  }

  if (y >= 15) {
    return "North";
  }

  if (y <= -15) {
    return "South";
  }

  if (x >= 15) {
    return "East";
  }

  if (x <= -15) {
    return "West";
  }

  return "Near Center";
};


// =====================================================
// 📍 CALCULATE LORA LOCATION
// =====================================================

const calculateLoRaLocation = (
  receiverRSSI = {},
  directRSSI = null,
  directSNR = null,
  receiverId = null
) => {

  const currentRSSI =
    toNumber(
      directRSSI,
      null
    );

  const currentSNR =
    toNumber(
      directSNR,
      null
    );


  // ===================================================
  // 📡 VALID RECEIVERS
  // ===================================================

  let receivers = [

    {
      id:
        "R1",

      rssi:
        toNumber(
          receiverRSSI?.R1,
          null
        ),

      ...RECEIVER_POSITIONS.R1,
    },

    {
      id:
        "R2",

      rssi:
        toNumber(
          receiverRSSI?.R2,
          null
        ),

      ...RECEIVER_POSITIONS.R2,
    },

    {
      id:
        "R3",

      rssi:
        toNumber(
          receiverRSSI?.R3,
          null
        ),

      ...RECEIVER_POSITIONS.R3,
    },

  ].filter(
    (receiver) =>
      receiver.rssi !== null
  );


  // ===================================================
  // 📡 SINGLE RECEIVER
  // ===================================================

  if (
    receivers.length === 0 &&
    currentRSSI !== null
  ) {

    const activeReceiver =
      receiverId ||
      "R1";

    const receiver =
      RECEIVER_POSITIONS[
        activeReceiver
      ] ||
      RECEIVER_POSITIONS.R1;


    const distance =
      estimateDistanceFromRSSI(
        currentRSSI
      );


    let area;


    if (
      currentRSSI >= -60
    ) {

      area =
        "Near Receiver";

    } else if (
      currentRSSI >= -75
    ) {

      area =
        "Middle Area";

    } else if (
      currentRSSI >= -90
    ) {

      area =
        "Far Area";

    } else {

      area =
        "Weak Signal Area";
    }


    return {

      nearestReceiver:
        activeReceiver,

      estimatedLocation:
        `${receiver.zone} - ${area}`,

      strongestRSSI:
        currentRSSI,

      loraRssi:
        currentRSSI,

      loraSnr:
        currentSNR,

      distance,

      direction:
        "Unknown",

      estimatedX:
        receiver.x,

      estimatedY:
        receiver.y,

      receiverRSSI: {

        R1:
          receiverRSSI?.R1 ??
          null,

        R2:
          receiverRSSI?.R2 ??
          null,

        R3:
          receiverRSSI?.R3 ??
          null,

      },

      receiverDistances: {

        [activeReceiver]:
          distance,

      },

      receiverPositions:
        RECEIVER_POSITIONS,

      locationTracking:
        true,

      locationSource:
        "LORA_RSSI",

    };
  }


  // ===================================================
  // 📡 MULTIPLE RECEIVERS
  // ===================================================

  if (
    receivers.length > 0
  ) {

    // Strongest RSSI first

    receivers.sort(
      (a, b) =>
        b.rssi -
        a.rssi
    );


    const strongest =
      receivers[0];


    // =================================================
    // 📏 DISTANCES
    // =================================================

    receivers =
      receivers.map(
        (receiver) => ({

          ...receiver,

          distance:
            estimateDistanceFromRSSI(
              receiver.rssi
            ),

        })
      );


    // =================================================
    // 📍 WEIGHTED X / Y
    // =================================================

    let totalWeight =
      0;

    let weightedX =
      0;

    let weightedY =
      0;


    receivers.forEach(
      (receiver) => {

        const distance =
          Math.max(
            receiver.distance ||
            1,
            1
          );

        const weight =
          1 /
          distance;

        totalWeight +=
          weight;

        weightedX +=
          receiver.x *
          weight;

        weightedY +=
          receiver.y *
          weight;
      }
    );


    let estimatedX =
      strongest.x;

    let estimatedY =
      strongest.y;


    if (
      totalWeight > 0
    ) {

      estimatedX =
        weightedX /
        totalWeight;

      estimatedY =
        weightedY /
        totalWeight;
    }


    estimatedX =
      Number(
        estimatedX.toFixed(1)
      );

    estimatedY =
      Number(
        estimatedY.toFixed(1)
      );


    // =================================================
    // 🧭 DIRECTION
    // =================================================

    const direction =
      getDirection(

        estimatedX -
          strongest.x,

        estimatedY -
          strongest.y

      );


    // =================================================
    // 📏 STRONGEST DISTANCE
    // =================================================

    const distance =
      estimateDistanceFromRSSI(
        strongest.rssi
      );


    // =================================================
    // 🗺️ LOCATION NAME
    // =================================================

    let estimatedLocation =
      strongest.zone;


    if (
      direction !==
      "Near Center"
    ) {

      estimatedLocation =
        `${strongest.zone} - ${direction}`;
    }


    // =================================================
    // 📊 RECEIVER DISTANCES
    // =================================================

    const receiverDistances =
      receivers.reduce(
        (
          result,
          receiver
        ) => {

          result[
            receiver.id
          ] =
            receiver.distance;

          return result;

        },
        {}
      );


    return {

      nearestReceiver:
        strongest.id,

      estimatedLocation,

      strongestRSSI:
        strongest.rssi,

      loraRssi:
        strongest.rssi,

      loraSnr:
        currentSNR,

      distance,

      direction,

      estimatedX,

      estimatedY,

      receiverRSSI: {

        R1:
          toNumber(
            receiverRSSI?.R1,
            null
          ),

        R2:
          toNumber(
            receiverRSSI?.R2,
            null
          ),

        R3:
          toNumber(
            receiverRSSI?.R3,
            null
          ),

      },

      receiverDistances,

      receiverPositions:
        RECEIVER_POSITIONS,

      locationTracking:
        true,

      locationSource:
        "LORA_RSSI",

    };
  }


  // ===================================================
  // ❌ NO LOCATION
  // ===================================================

  return {

    nearestReceiver:
      "",

    estimatedLocation:
      "",

    strongestRSSI:
      null,

    loraRssi:
      null,

    loraSnr:
      null,

    distance:
      null,

    direction:
      "Unknown",

    estimatedX:
      null,

    estimatedY:
      null,

    receiverRSSI:
      {},

    receiverDistances:
      {},

    receiverPositions:
      RECEIVER_POSITIONS,

    locationTracking:
      false,

    locationSource:
      "NONE",

  };
};


// =====================================================
// 📡 RECEIVE DATA
// ESP32 RECEIVER → BACKEND
// =====================================================

exports.receiveData = async (
  req,
  res
) => {

  try {

    const data =
      req.body ||
      {};


    console.log(
      "📡 Incoming jacket data:",
      data
    );


    // =================================================
    // VALIDATION
    // =================================================

    if (!data.userId) {

      return res.status(400).json({

        success:
          false,

        error:
          "userId is required",

      });
    }


    // =================================================
    // FIND MINER
    // =================================================

    let miner =
      await Miner.findOne({
        userId:
          data.userId,
      });


    // =================================================
    // PREVIOUS SENSOR STATUS
    // =================================================

    const previousSensorStatus =
      miner?.sensorStatus
        ? (
          miner.sensorStatus.toObject
            ? miner.sensorStatus.toObject()
            : miner.sensorStatus
        )
        : {};


    // =================================================
    // SENSOR STATUS
    // =================================================

    const sensorStatus =
      getSensorStatus(data);


    // =================================================
    // SENSOR SUMMARY
    // =================================================

    const sensorSummary =
      getSensorSummary(
        sensorStatus
      );


    // =================================================
    // 📡 DIRECT RSSI
    // =================================================

    const directRSSI =
      data.loraRssi ??
      data.rssi ??
      data.RSSI ??
      null;


    const directSNR =
      data.loraSnr ??
      data.snr ??
      data.SNR ??
      null;


    const packetReceiverId =
      data.receiverId ??
      data.receiver ??
      data.receiverName ??
      null;


    // =================================================
    // 📡 RECEIVER RSSI
    // =================================================
    //
    // Preserve R2/R3 previous values.
    //
    // But ALWAYS replace the active R1 value with
    // the newest packet RSSI when receiver ID is not
    // supplied.
    //
    // This prevents old RSSI values from being used.
    //
    // =================================================

    const receiverRSSI = {

      ...(miner?.receiverRSSI?.toObject
        ? miner.receiverRSSI.toObject()
        : miner?.receiverRSSI || {}),

      ...(data.receiverRSSI || {}),

    };


    // =================================================
    // 📡 UPDATE RECEIVER RSSI
    // =================================================

    if (
      packetReceiverId &&
      directRSSI !== null &&
      directRSSI !== undefined &&
      Object.prototype.hasOwnProperty.call(
        RECEIVER_POSITIONS,
        packetReceiverId
      )
    ) {

      receiverRSSI[
        packetReceiverId
      ] =
        toNumber(
          directRSSI,
          null
        );
    }


    // =================================================
    // 📡 DEFAULT TEST RECEIVER = R1
    // =================================================
    //
    // Your current test is using R1.
    //
    // Receiver.ino may not send receiverId.
    //
    // Therefore direct RSSI is treated as R1 RSSI.
    //
    // =================================================

    if (
      !packetReceiverId &&
      directRSSI !== null &&
      directRSSI !== undefined
    ) {

      receiverRSSI.R1 =
        toNumber(
          directRSSI,
          null
        );
    }


    // =================================================
    // 📍 RECEIVER ID
    // =================================================

    const receiverId =
      packetReceiverId ||
      null;


    // =================================================
    // 📍 CALCULATE LOCATION
    // =================================================

    const locationData =
      calculateLoRaLocation(

        receiverRSSI,

        directRSSI,

        directSNR,

        receiverId

      );


    // =================================================
    // ❤️ TEMPERATURE
    // =================================================

    const temperature =

      data.temperature !== undefined

        ? toNumber(
            data.temperature,
            miner?.temperature ??
            null
          )

        : data.bodyTemp !== undefined

          ? toNumber(
              data.bodyTemp,
              miner?.temperature ??
              null
            )

          : data.BTMP !== undefined

            ? toNumber(
                data.BTMP,
                miner?.temperature ??
                null
              )

            : miner?.temperature ??
              null;


    // =================================================
    // ❤️ HEART RATE
    // =================================================

    const heartRate =

      data.heartRate !== undefined

        ? toNumber(
            data.heartRate,
            miner?.heartRate ??
            null
          )

        : data.bpm !== undefined

          ? toNumber(
              data.bpm,
              miner?.heartRate ??
              null
            )

          : data.PLS !== undefined

            ? toNumber(
                data.PLS,
                miner?.heartRate ??
                null
              )

            : data.pls !== undefined

              ? toNumber(
                  data.pls,
                  miner?.heartRate ??
                  null
                )

              : miner?.heartRate ??
                null;


    // =================================================
    // 🫁 SpO2
    // =================================================

    const spo2 =

      data.spo2 !== undefined

        ? toNumber(
            data.spo2,
            miner?.spo2 ??
            null
          )

        : data.SPO !== undefined

          ? toNumber(
              data.SPO,
              miner?.spo2 ??
              null
            )

          : data.spo !== undefined

            ? toNumber(
                data.spo,
                miner?.spo2 ??
                null
              )

            : miner?.spo2 ??
              null;


    // =================================================
    // 🌫 MQ135 — CO2
    // =================================================

    const co2 =

      data.co2 !== undefined

        ? toNumber(
            data.co2,
            miner?.co2 ??
            null
          )

        : data.estimatedCO2 !== undefined

          ? toNumber(
              data.estimatedCO2,
              miner?.co2 ??
              null
            )

          : data.CO2 !== undefined

            ? toNumber(
                data.CO2,
                miner?.co2 ??
                null
              )

            : miner?.co2 ??
              null;


    // =================================================
    // 🌫 MQ135 — AMMONIA
    // =================================================

    const ammonia =

      data.ammonia !== undefined

        ? toNumber(
            data.ammonia,
            miner?.ammonia ??
            null
          )

        : data.mq135Ammonia !== undefined

          ? toNumber(
              data.mq135Ammonia,
              miner?.ammonia ??
              null
            )

          : miner?.ammonia ??
            null;


    // =================================================
    // 🔥 MQ4 — METHANE
    // =================================================

    const mq4 =

      data.mq4 !== undefined

        ? toNumber(
            data.mq4,
            miner?.mq4 ??
            null
          )

        : data.methane !== undefined

          ? toNumber(
              data.methane,
              miner?.mq4 ??
              null
            )

          : data.M4 !== undefined

            ? toNumber(
                data.M4,
                miner?.mq4 ??
                null
              )

            : miner?.mq4 ??
              null;


    // =================================================
    // ☠️ MQ7 — CARBON MONOXIDE
    // =================================================

    const mq7 =

      data.mq7 !== undefined

        ? toNumber(
            data.mq7,
            miner?.mq7 ??
            null
          )

        : data.carbonMonoxide !== undefined

          ? toNumber(
              data.carbonMonoxide,
              miner?.mq7 ??
              null
            )

          : data.M7 !== undefined

            ? toNumber(
                data.M7,
                miner?.mq7 ??
                null
              )

            : miner?.mq7 ??
              null;


    // =================================================
    // 📊 BMP280 PRESSURE
    // =================================================

    const pressure =

      data.pressure !== undefined

        ? toNumber(
            data.pressure,
            miner?.pressure ??
            null
          )

        : data.PRS !== undefined

          ? toNumber(
              data.PRS,
              miner?.pressure ??
              null
            )

          : data.prs !== undefined

            ? toNumber(
                data.prs,
                miner?.pressure ??
                null
              )

            : miner?.pressure ??
              null;


    // =================================================
    // 🏃 MOTION
    // =================================================

    const fallDetected =

      data.fallDetected !== undefined

        ? toBoolean(
            data.fallDetected,
            miner?.fallDetected ??
            false
          )

        : data.FALL !== undefined

          ? toBoolean(
              data.FALL,
              miner?.fallDetected ??
              false
            )

          : miner?.fallDetected ??
            false;


    const motionStatus =
      data.motionStatus ??
      miner?.motionStatus ??
      (
        fallDetected
          ? "FALL DETECTED"
          : "NORMAL"
      );


    // =================================================
    // 🚨 SOS
    // =================================================

    let sosAlert =
      miner?.sosAlert ??
      false;


    if (
      data.sosAlert !== undefined
    ) {

      sosAlert =
        toBoolean(
          data.sosAlert,
          false
        );

    } else if (
      data.sos !== undefined
    ) {

      sosAlert =
        String(data.sos) === "0" ||
        data.sos === 0;

    } else if (
      data.SOS !== undefined
    ) {

      sosAlert =
        String(data.SOS) === "0" ||
        data.SOS === 0;
    }


    // =================================================
    // 📡 COMMUNICATION
    // =================================================

    const loraConnected =

      data.loraConnected !== undefined

        ? toBoolean(
            data.loraConnected,
            true
          )

        : true;


    const esp32Connected =

      data.esp32Connected !== undefined

        ? toBoolean(
            data.esp32Connected,
            true
          )

        : true;


    // =================================================
    // 👷 PAYLOAD
    // =================================================

    const payload = {

      // =================================================
      // 👷 IDENTIFICATION
      // =================================================

      userId:
        data.userId,

      fullName:
        data.fullName ??
        miner?.fullName ??
        "",

      age:
        data.age ??
        miner?.age ??
        null,

      nic:
        data.nic ??
        miner?.nic ??
        "",

      minerPhone:
        data.minerPhone ??
        miner?.minerPhone ??
        "",

      emergencyPhone:
        data.emergencyPhone ??
        miner?.emergencyPhone ??
        "",

      address:
        data.address ??
        miner?.address ??
        "",


      // =================================================
      // ❤️ HEALTH
      // =================================================

      temperature,

      heartRate,

      bpm:
        heartRate,

      spo2,


      // =================================================
      // 🏃 MOTION
      // =================================================

      motionStatus,

      fallDetected,


      // =================================================
      // 🌫 ENVIRONMENT
      // =================================================

      co2,

      ammonia,

      mq135:
        data.mq135 !== undefined

          ? toNumber(
              data.mq135,
              miner?.mq135 ??
              null
            )

          : co2,

      mq4,

      mq7,


      // =================================================
      // 📊 PRESSURE
      // =================================================

      pressure,


      // =================================================
      // 🚨 SOS
      // =================================================

      sosAlert,


      // =================================================
      // 📡 COMMUNICATION
      // =================================================

      loraConnected,

      esp32Connected,


      // =================================================
      // 📡 SENSOR STATUS
      // =================================================

      sensorStatus,


      // =================================================
      // 📊 SENSOR SUMMARY
      // =================================================

      offlineSensorCount:
        sensorSummary.offlineSensorCount,

      offlineSensors:
        sensorSummary.offlineSensors,

      allSensorsOffline:
        sensorSummary.allSensorsOffline,


      // =================================================
      // 📍 LORA LOCATION
      // =================================================

      locationMethod:
        locationData.locationTracking
          ? "LORA_RSSI"
          : "NONE",

      locationSource:
        locationData.locationSource ||
        "NONE",

      locationTracking:
        locationData.locationTracking,

      nearestReceiver:
        locationData.nearestReceiver,

      estimatedLocation:
        locationData.estimatedLocation,

      strongestRSSI:
        locationData.strongestRSSI,

      loraRssi:
        locationData.loraRssi,

      loraSnr:
        locationData.loraSnr,

      currentReceiver:
        locationData.nearestReceiver,

      receiverRSSI,


      // =================================================
      // 📍 LOCATION DETAILS
      // =================================================

      locationDirection:
        locationData.direction ||
        "Unknown",

      locationDistance:
        locationData.distance ??
        null,

      estimatedX:
        locationData.estimatedX ??
        null,

      estimatedY:
        locationData.estimatedY ??
        null,

      receiverDistances:
        locationData.receiverDistances ||
        {},

      receiverPositions:
        locationData.receiverPositions ||
        {},


      lastLocationUpdate:
        locationData.locationTracking
          ? new Date()
          : miner?.lastLocationUpdate ??
            null,


      // =================================================
      // 🕐 TIMESTAMPS
      // =================================================

      lastSensorUpdate:
        new Date(),

      lastLoRaPacket:
        new Date(),

      lastReceiverUpdate:
        new Date(),

      updatedAt:
        new Date(),

    };


    // =================================================
    // 🚦 STATUS
    // =================================================

    const status =
      getStatus(payload);

    const alertReason =
      getAlertReason(payload);

    const outputs =
      getAlertOutputs(
        status
      );


    // =================================================
    // UPDATE / CREATE MINER
    // =================================================

    if (miner) {

      Object.assign(
        miner,
        payload
      );

      miner.status =
        status;

      miner.alertReason =
        alertReason;

      miner.ledAlert =
        outputs.ledAlert;

      miner.buzzerAlert =
        outputs.buzzerAlert;

      miner.vibrationAlert =
        outputs.vibrationAlert;

    } else {

      miner =
        new Miner({

          ...payload,

          status,

          alertReason,

          ...outputs,

        });
    }


    // =================================================
    // SAVE
    // =================================================

    await miner.save();


    // =================================================
    // SOCKET.IO
    // =================================================

    const io =
      req.app.get("io");


    if (io) {

      // ===============================================
      // 📡 LIVE DATA
      // ===============================================

      io.emit(
        "dataUpdate",
        miner
      );


      // ===============================================
      // 📍 LIVE LOCATION
      // ===============================================

      if (
        locationData.locationTracking
      ) {

        io.emit(
          "locationUpdate",
          {

            minerId:
              miner.userId,

            locationMethod:
              miner.locationMethod,

            locationSource:
              miner.locationSource,

            locationTracking:
              miner.locationTracking,

            nearestReceiver:
              miner.nearestReceiver,

            estimatedLocation:
              miner.estimatedLocation,

            strongestRSSI:
              miner.strongestRSSI,

            loraRssi:
              miner.loraRssi,

            loraSnr:
              miner.loraSnr,

            receiverRSSI:
              miner.receiverRSSI,

            direction:
              miner.locationDirection ||
              "Unknown",

            distance:
              miner.locationDistance ??
              null,

            estimatedX:
              miner.estimatedX ??
              null,

            estimatedY:
              miner.estimatedY ??
              null,

            receiverDistances:
              miner.receiverDistances ||
              {},

            receiverPositions:
              miner.receiverPositions ||
              {},

            lastLocationUpdate:
              miner.lastLocationUpdate,

            miner,

          }
        );
      }


      // ===============================================
      // 🔄 SENSOR STATUS
      // ===============================================

      emitSensorStatusChanges(
        io,
        previousSensorStatus,
        sensorStatus,
        miner
      );


      // ===============================================
      // 🚨 ALL SENSORS OFFLINE
      // ===============================================

      if (
        sensorSummary.allSensorsOffline
      ) {

        emitAllSensorsOfflineAlert(
          io,
          miner,
          true
        );
      }


      // ===============================================
      // 🚨 SAFETY ALERT
      // ===============================================

      if (
        status !== "SAFE"
      ) {

        io.emit(
          "alertUpdate",
          {

            minerId:
              miner.userId,

            alertType:
              status === "DANGER" &&
              miner.sosAlert
                ? "SOS"
                : status,

            alertReason,

            timestamp:
              new Date(),

            miner,

          }
        );
      }


      // ===============================================
      // 🚨 SOS EVENT
      // ===============================================

      if (
        miner.sosAlert === true
      ) {

        io.emit(
          "sosAlert",
          {

            minerId:
              miner.userId,

            alertType:
              "SOS",

            alertReason:
              "SOS emergency button activated",

            timestamp:
              new Date(),

            miner,

          }
        );
      }


      // ===============================================
      // 🏃 FALL EVENT
      // ===============================================

      if (
        miner.fallDetected === true
      ) {

        io.emit(
          "fallAlert",
          {

            minerId:
              miner.userId,

            alertType:
              "FALL",

            alertReason:
              "Fall detected by MPU6050",

            timestamp:
              new Date(),

            miner,

          }
        );
      }
    }


    // =================================================
    // RESPONSE
    // =================================================

    return res.json({

      success:
        true,

      message:
        "Sensor data saved successfully",

      status,

      alertReason,

      outputs,

      sensorStatus,

      offlineSensorCount:
        sensorSummary.offlineSensorCount,

      offlineSensors:
        sensorSummary.offlineSensors,

      allSensorsOffline:
        sensorSummary.allSensorsOffline,

      location:
        locationData,

      miner,

    });

  } catch (error) {

    console.error(
      "❌ Sensor data error:",
      error
    );

    return res.status(500).json({

      success:
        false,

      error:
        "Server error",

      details:
        error.message,

    });
  }
};


// =====================================================
// 👷 GET ALL MINERS
// =====================================================

exports.getAllMiners = async (
  req,
  res
) => {

  try {

    const miners =
      await Miner.find()
        .sort({
          updatedAt: -1,
        });

    return res.json(
      miners
    );

  } catch (error) {

    console.error(
      "Get miners error:",
      error
    );

    return res.status(500).json({

      success:
        false,

      error:
        error.message,

    });
  }
};


// =====================================================
// 👷 GET SINGLE MINER
// =====================================================

exports.getMinerById = async (
  req,
  res
) => {

  try {

    const miner =
      await Miner.findOne({
        userId:
          req.params.id,
      });


    if (!miner) {

      return res.status(404).json({

        success:
          false,

        error:
          "Miner not found",

      });
    }


    return res.json(
      miner
    );

  } catch (error) {

    console.error(
      "Get miner error:",
      error
    );

    return res.status(500).json({

      success:
        false,

      error:
        error.message,

    });
  }
};


// =====================================================
// 🚨 GET ACTIVE ALERTS
// =====================================================

exports.getAlerts = async (
  req,
  res
) => {

  try {

    const alerts =
      await Miner.find({

        $or: [

          {
            status: {
              $in: [
                "DANGER",
                "WARNING",
              ],
            },
          },

          {
            sosAlert:
              true,
          },

          {
            fallDetected:
              true,
          },

          {
            allSensorsOffline:
              true,
          },

          {
            offlineSensorCount:
              {
                $gt: 0,
              },
          },

        ],

      })
      .sort({
        updatedAt: -1,
      });


    return res.json(
      alerts
    );

  } catch (error) {

    console.error(
      "Get alerts error:",
      error
    );

    return res.status(500).json({

      success:
        false,

      error:
        error.message,

    });
  }
};


// =====================================================
// 🗑 DELETE MINER
// =====================================================

exports.deleteMiner = async (
  req,
  res
) => {

  try {

    const deleted =
      await Miner.findOneAndDelete({
        userId:
          req.params.id,
      });


    if (!deleted) {

      return res.status(404).json({

        success:
          false,

        error:
          "Miner not found",

      });
    }


    const io =
      req.app.get("io");


    if (io) {

      io.emit(
        "minerDeleted",
        {
          userId:
            req.params.id,
        }
      );
    }


    return res.json({

      success:
        true,

      message:
        "Miner deleted successfully",

    });

  } catch (error) {

    console.error(
      "Delete miner error:",
      error
    );

    return res.status(500).json({

      success:
        false,

      error:
        error.message,

    });
  }
};


// =====================================================
// ✏️ UPDATE MINER
// =====================================================

exports.updateMiner = async (
  req,
  res
) => {

  try {

    const miner =
      await Miner.findOne({
        userId:
          req.params.id,
      });


    if (!miner) {

      return res.status(404).json({

        success:
          false,

        error:
          "Miner not found",

      });
    }


    Object.assign(
      miner,
      req.body
    );


    // =================================================
    // 📍 UPDATE LOCATION
    // =================================================

    const updateReceiverRSSI = {

      ...(miner.receiverRSSI?.toObject
        ? miner.receiverRSSI.toObject()
        : miner.receiverRSSI || {}),

      ...(req.body.receiverRSSI || {}),

    };


    const updateDirectRSSI =
      req.body.loraRssi ??
      req.body.rssi ??
      req.body.RSSI ??
      null;


    const updateReceiverId =
      req.body.receiverId ??
      req.body.receiver ??
      req.body.receiverName ??
      null;


    // If receiver ID is supplied,
    // update that receiver.

    if (
      updateReceiverId &&
      updateDirectRSSI !== null &&
      Object.prototype.hasOwnProperty.call(
        RECEIVER_POSITIONS,
        updateReceiverId
      )
    ) {

      updateReceiverRSSI[
        updateReceiverId
      ] =
        toNumber(
          updateDirectRSSI,
          null
        );
    }


    // Otherwise current test packet = R1.

    if (
      !updateReceiverId &&
      updateDirectRSSI !== null
    ) {

      updateReceiverRSSI.R1 =
        toNumber(
          updateDirectRSSI,
          null
        );
    }


    const locationData =
      calculateLoRaLocation(

        updateReceiverRSSI,

        updateDirectRSSI ??
        miner.loraRssi,

        req.body.loraSnr ??
        req.body.snr ??
        req.body.SNR ??
        miner.loraSnr,

        updateReceiverId ||
        miner.currentReceiver ||
        "R1"

      );


    if (
      locationData.locationTracking
    ) {

      miner.locationMethod =
        "LORA_RSSI";

      miner.locationSource =
        "LORA_RSSI";

      miner.locationTracking =
        true;

      miner.nearestReceiver =
        locationData.nearestReceiver;

      miner.estimatedLocation =
        locationData.estimatedLocation;

      miner.strongestRSSI =
        locationData.strongestRSSI;

      miner.loraRssi =
        locationData.loraRssi;

      miner.loraSnr =
        locationData.loraSnr;

      miner.currentReceiver =
        locationData.nearestReceiver;


      miner.receiverRSSI =
        updateReceiverRSSI;


      miner.locationDirection =
        locationData.direction ||
        "Unknown";

      miner.locationDistance =
        locationData.distance ??
        null;

      miner.estimatedX =
        locationData.estimatedX ??
        null;

      miner.estimatedY =
        locationData.estimatedY ??
        null;

      miner.receiverDistances =
        locationData.receiverDistances ||
        {};

      miner.receiverPositions =
        locationData.receiverPositions ||
        {};

      miner.lastLocationUpdate =
        new Date();
    }


    // =================================================
    // 🚦 STATUS
    // =================================================

    const status =
      getStatus(miner);

    const alertReason =
      getAlertReason(miner);

    const outputs =
      getAlertOutputs(
        status
      );


    miner.status =
      status;

    miner.alertReason =
      alertReason;

    miner.ledAlert =
      outputs.ledAlert;

    miner.buzzerAlert =
      outputs.buzzerAlert;

    miner.vibrationAlert =
      outputs.vibrationAlert;

    miner.updatedAt =
      new Date();


    await miner.save();


    // =================================================
    // SOCKET.IO
    // =================================================

    const io =
      req.app.get("io");


    if (io) {

      io.emit(
        "dataUpdate",
        miner
      );


      if (
        locationData.locationTracking
      ) {

        io.emit(
          "locationUpdate",
          {

            minerId:
              miner.userId,

            locationMethod:
              miner.locationMethod,

            locationSource:
              miner.locationSource,

            locationTracking:
              miner.locationTracking,

            nearestReceiver:
              miner.nearestReceiver,

            estimatedLocation:
              miner.estimatedLocation,

            strongestRSSI:
              miner.strongestRSSI,

            loraRssi:
              miner.loraRssi,

            loraSnr:
              miner.loraSnr,

            receiverRSSI:
              miner.receiverRSSI,

            direction:
              miner.locationDirection ||
              "Unknown",

            distance:
              miner.locationDistance ??
              null,

            estimatedX:
              miner.estimatedX ??
              null,

            estimatedY:
              miner.estimatedY ??
              null,

            receiverDistances:
              miner.receiverDistances ||
              {},

            receiverPositions:
              miner.receiverPositions ||
              {},

            lastLocationUpdate:
              miner.lastLocationUpdate,

            miner,

          }
        );
      }


      if (
        status !== "SAFE"
      ) {

        io.emit(
          "alertUpdate",
          {

            minerId:
              miner.userId,

            alertType:
              status === "DANGER" &&
              miner.sosAlert
                ? "SOS"
                : status,

            alertReason,

            timestamp:
              new Date(),

            miner,

          }
        );
      }
    }


    return res.json(
      miner
    );

  } catch (error) {

    console.error(
      "Update miner error:",
      error
    );

    return res.status(500).json({

      success:
        false,

      error:
        error.message,

    });
  }
};


// =====================================================
// 📍 GET MINER LOCATION
// =====================================================

exports.getMinerLocation = async (
  req,
  res
) => {

  try {

    const miner =
      await Miner.findOne({
        userId:
          req.params.id,
      });


    if (!miner) {

      return res.status(404).json({

        success:
          false,

        error:
          "Miner not found",

      });
    }


    return res.json({

      success:
        true,

      minerId:
        miner.userId,

      minerName:
        miner.fullName,

      locationMethod:
        miner.locationMethod,

      locationSource:
        miner.locationSource,

      locationTracking:
        miner.locationTracking,

      nearestReceiver:
        miner.nearestReceiver,

      estimatedLocation:
        miner.estimatedLocation,

      strongestRSSI:
        miner.strongestRSSI,

      loraRssi:
        miner.loraRssi,

      loraSnr:
        miner.loraSnr,

      receiverRSSI:
        miner.receiverRSSI,


      // =================================================
      // 📍 LOCATION DETAILS
      // =================================================

      direction:
        miner.locationDirection ||
        "Unknown",

      distance:
        miner.locationDistance ??
        null,

      estimatedX:
        miner.estimatedX ??
        null,

      estimatedY:
        miner.estimatedY ??
        null,

      receiverDistances:
        miner.receiverDistances ||
        {},

      receiverPositions:
        miner.receiverPositions ||
        {},

      lastLocationUpdate:
        miner.lastLocationUpdate,

    });

  } catch (error) {

    console.error(
      "Get miner location error:",
      error
    );

    return res.status(500).json({

      success:
        false,

      error:
        error.message,

    });
  }
};