const mongoose = require("mongoose");

// =====================================================
// 👷 MINER SCHEMA
// Smart Miner Safety Jacket
// Central Control & Alert Management
// =====================================================

const minerSchema = new mongoose.Schema(
  {
    // =====================================================
    // 👷 MINER IDENTIFICATION
    // =====================================================

    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    fullName: {
      type: String,
      default: "",
      trim: true,
    },

    age: {
      type: Number,
      default: null,
    },

    nic: {
      type: String,
      default: "",
      trim: true,
    },

    minerPhone: {
      type: String,
      default: "",
      trim: true,
    },

    emergencyPhone: {
      type: String,
      default: "",
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },


    // =====================================================
    // ❤️ HEALTH MONITORING
    // =====================================================

    // GY-906 MLX90614
    temperature: {
      type: Number,
      default: null,
    },

    // Pulse Rate Sensor
    heartRate: {
      type: Number,
      default: null,
    },

    // Backward compatibility
    bpm: {
      type: Number,
      default: null,
    },

    // MAX30102
    spo2: {
      type: Number,
      default: null,
    },


    // =====================================================
    // 🏃 MOTION / FALL
    // =====================================================

    // MPU6050
    motionStatus: {
      type: String,
      default: "NORMAL",
      trim: true,
    },

    fallDetected: {
      type: Boolean,
      default: false,
    },


    // =====================================================
    // 🌫 ENVIRONMENTAL MONITORING
    // =====================================================

    // MQ135
    // Same physical sensor can provide CO2 + Ammonia
    co2: {
      type: Number,
      default: null,
    },

    ammonia: {
      type: Number,
      default: null,
    },

    // Backward compatibility
    mq135: {
      type: Number,
      default: null,
    },

    // MQ4 - Methane
    mq4: {
      type: Number,
      default: null,
    },

    // MQ7 - Carbon Monoxide
    mq7: {
      type: Number,
      default: null,
    },


    // =====================================================
    // 📊 PRESSURE
    // =====================================================

    // BMP280
    // Used in Motion & Emergency Monitoring
    pressure: {
      type: Number,
      default: null,
    },


    // =====================================================
    // 🚨 SOS EMERGENCY
    // =====================================================

    sosAlert: {
      type: Boolean,
      default: false,
    },


    // =====================================================
    // 📍 LORA LOCATION TRACKING
    // =====================================================
    //
    // GPS is NOT required.
    // Miner location is estimated using
    // LoRa receiver RSSI.
    //

    locationMethod: {
      type: String,

      enum: [
        "LORA_RSSI",
        "GPS",
        "NONE",
      ],

      default: "LORA_RSSI",
    },

    locationTracking: {
      type: Boolean,
      default: false,
    },

    locationSource: {
      type: String,
      default: "LORA_RSSI",
      trim: true,
    },


    // =====================================================
    // 📡 CURRENT LORA SIGNAL
    // =====================================================

    // Current receiver RSSI
    loraRssi: {
      type: Number,
      default: null,
    },

    // Current receiver SNR
    loraSnr: {
      type: Number,
      default: null,
    },

    // Strongest RSSI
    strongestRSSI: {
      type: Number,
      default: null,
    },


    // =====================================================
    // 📡 RECEIVER INFORMATION
    // =====================================================

    // Receiver with strongest signal
    nearestReceiver: {
      type: String,
      default: "",
      trim: true,
    },

    // Estimated mine zone
    estimatedLocation: {
      type: String,
      default: "",
      trim: true,
    },

    // Current receiver
    currentReceiver: {
      type: String,
      default: "",
      trim: true,
    },


    // =====================================================
    // 📡 RECEIVER RSSI
    // =====================================================

    receiverRSSI: {

      R1: {
        type: Number,
        default: null,
      },

      R2: {
        type: Number,
        default: null,
      },

      R3: {
        type: Number,
        default: null,
      },
    },


    // =====================================================
    // 📍 ADVANCED LORA LOCATION
    // =====================================================

    // 🧭 Estimated direction
    //
    // Examples:
    // North
    // South
    // East
    // West
    // North-East
    // North-West
    // South-East
    // South-West
    // Near Center
    //

    locationDirection: {
      type: String,
      default: "Unknown",
      trim: true,
    },


    // =====================================================
    // 📏 APPROXIMATE DISTANCE
    // =====================================================

    // Approximate distance from strongest receiver
    //
    // This is estimated from RSSI.
    // It is NOT GPS distance.
    //

    locationDistance: {
      type: Number,
      default: null,
    },


    // =====================================================
    // 📍 ESTIMATED X / Y POSITION
    // =====================================================

    // Estimated X position inside mine
    estimatedX: {
      type: Number,
      default: null,
    },

    // Estimated Y position inside mine
    estimatedY: {
      type: Number,
      default: null,
    },


    // =====================================================
    // 📏 DISTANCE FROM EACH RECEIVER
    // =====================================================

    receiverDistances: {

      R1: {
        type: Number,
        default: null,
      },

      R2: {
        type: Number,
        default: null,
      },

      R3: {
        type: Number,
        default: null,
      },
    },


    // =====================================================
    // 🗺️ FIXED RECEIVER POSITIONS
    // =====================================================
    //
    // IMPORTANT:
    // These are example positions.
    //
    // Change these values according to
    // your actual mine receiver locations.
    //

    receiverPositions: {

      R1: {

        x: {
          type: Number,
          default: 0,
        },

        y: {
          type: Number,
          default: 0,
        },

        zone: {
          type: String,
          default: "Mine Zone A",
        },
      },


      R2: {

        x: {
          type: Number,
          default: 100,
        },

        y: {
          type: Number,
          default: 0,
        },

        zone: {
          type: String,
          default: "Mine Zone B",
        },
      },


      R3: {

        x: {
          type: Number,
          default: 50,
        },

        y: {
          type: Number,
          default: 100,
        },

        zone: {
          type: String,
          default: "Mine Zone C",
        },
      },
    },


    // =====================================================
    // 📡 RECEIVER STATUS
    // =====================================================

    receiverStatus: {

      R1: {
        type: Boolean,
        default: false,
      },

      R2: {
        type: Boolean,
        default: false,
      },

      R3: {
        type: Boolean,
        default: false,
      },
    },


    // =====================================================
    // 🚦 CENTRAL CONTROL STATUS
    // =====================================================

    status: {
      type: String,

      enum: [
        "SAFE",
        "WARNING",
        "DANGER",
      ],

      default: "SAFE",
    },

    alertReason: {
      type: String,
      default: "",
      trim: true,
    },


    // =====================================================
    // 💡 JACKET ALERT OUTPUTS
    // =====================================================

    ledAlert: {
      type: Boolean,
      default: false,
    },

    buzzerAlert: {
      type: Boolean,
      default: false,
    },

    vibrationAlert: {
      type: Boolean,
      default: false,
    },


    // =====================================================
    // 📡 COMMUNICATION STATUS
    // =====================================================

    // Jacket → LoRa → Receiver
    loraConnected: {
      type: Boolean,
      default: false,
    },

    // Receiver → WiFi → Backend
    esp32Connected: {
      type: Boolean,
      default: false,
    },


    // =====================================================
    // 📡 INDIVIDUAL SENSOR STATUS
    // =====================================================

    sensorStatus: {

      // ❤️ Pulse Rate Sensor
      heartRate: {
        type: Boolean,
        default: false,
      },

      // 🫁 MAX30102
      spo2: {
        type: Boolean,
        default: false,
      },

      // 🏃 MPU6050
      motion: {
        type: Boolean,
        default: false,
      },

      // 🌡 GY-906
      temperature: {
        type: Boolean,
        default: false,
      },

      // ☁️ MQ135 → CO2
      co2: {
        type: Boolean,
        default: false,
      },

      // ☁️ MQ135 → Ammonia
      ammonia: {
        type: Boolean,
        default: false,
      },

      // 🔥 MQ4
      methane: {
        type: Boolean,
        default: false,
      },

      // ☠️ MQ7
      carbonMonoxide: {
        type: Boolean,
        default: false,
      },

      // 📊 BMP280
      pressure: {
        type: Boolean,
        default: false,
      },

      // 🚨 SOS Button
      sosButton: {
        type: Boolean,
        default: true,
      },
    },


    // =====================================================
    // ⚠️ OFFLINE SENSOR INFORMATION
    // =====================================================

    // Number of currently offline sensors
    offlineSensorCount: {
      type: Number,
      default: 0,
    },

    // Names of offline sensors
    offlineSensors: {
      type: [String],
      default: [],
    },

    // True when all sensors are offline
    allSensorsOffline: {
      type: Boolean,
      default: false,
    },


    // =====================================================
    // 🕐 COMMUNICATION TIMESTAMPS
    // =====================================================

    // Last valid sensor packet
    lastSensorUpdate: {
      type: Date,
      default: null,
    },

    // Last LoRa packet
    lastLoRaPacket: {
      type: Date,
      default: null,
    },

    // Last receiver update
    lastReceiverUpdate: {
      type: Date,
      default: null,
    },

    // Last location update
    lastLocationUpdate: {
      type: Date,
      default: null,
    },


    // =====================================================
    // 🕐 DATABASE TIMESTAMPS
    // =====================================================

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },

  {
    timestamps: true,
  }
);


// =====================================================
// ❤️ HEART RATE / BPM SYNC
// =====================================================

minerSchema.pre(
  "save",
  async function () {

    // BPM → Heart Rate
    if (
      this.heartRate === null &&
      this.bpm !== null
    ) {

      this.heartRate =
        this.bpm;
    }


    // Heart Rate → BPM
    if (
      this.bpm === null &&
      this.heartRate !== null
    ) {

      this.bpm =
        this.heartRate;
    }


    // ===================================================
    // 📍 LOCATION STATUS
    // ===================================================

    if (
      this.loraRssi !== null ||
      this.strongestRSSI !== null ||
      this.nearestReceiver ||
      this.estimatedLocation
    ) {

      this.locationTracking =
        true;


      if (
        !this.locationMethod ||
        this.locationMethod ===
          "NONE"
      ) {

        this.locationMethod =
          "LORA_RSSI";
      }


      if (
        !this.locationSource
      ) {

        this.locationSource =
          "LORA_RSSI";
      }
    }
  }
);


// =====================================================
// 📦 EXPORT MODEL
// =====================================================

module.exports =
  mongoose.model(
    "Miner",
    minerSchema
  );