const mongoose = require("mongoose");

// =====================================================
// 🔔 NOTIFICATION SCHEMA
// Smart Miner Safety Jacket
// Central Control & Alert Management
// =====================================================

const notificationSchema = new mongoose.Schema(
  {
    // =====================================================
    // 👷 MINER
    // =====================================================

    minerId: {
      type: String,
      required: true,
      trim: true,
    },

    minerName: {
      type: String,
      default: "Unknown Miner",
      trim: true,
    },


    // =====================================================
    // 🚨 NOTIFICATION TYPE
    // =====================================================

    type: {
      type: String,

      enum: [
        "SOS",
        "FALL",
        "DANGER",
        "WARNING",

        "SENSOR_OFFLINE",
        "SENSOR_ONLINE",

        "ALL_SENSORS_OFFLINE",

        "LOCATION_OFFLINE",

        "INFO",
      ],

      default: "INFO",
      required: true,
    },


    // =====================================================
    // 🚦 SEVERITY
    // =====================================================

    severity: {
      type: String,

      enum: [
        "INFO",
        "SUCCESS",
        "WARNING",
        "CRITICAL",
      ],

      default: "INFO",
    },


    // =====================================================
    // 🚦 MINER STATUS
    // =====================================================

    status: {
      type: String,

      enum: [
        "",
        "SAFE",
        "WARNING",
        "DANGER",
      ],

      default: "",
    },


    // =====================================================
    // 📝 MESSAGE
    // =====================================================

    title: {
      type: String,

      required: true,

      trim: true,
    },

    message: {
      type: String,

      required: true,

      trim: true,
    },


    // =====================================================
    // 📊 SENSOR
    // =====================================================

    sensor: {
      type: String,

      default: "",

      trim: true,
    },

    sensorValue: {
      type: mongoose.Schema.Types.Mixed,

      default: null,
    },


    // =====================================================
    // 📡 SENSOR STATUS
    // =====================================================

    sensorStatus: {
      type: String,

      enum: [
        "",
        "ONLINE",
        "OFFLINE",
      ],

      default: "",
    },


    // =====================================================
    // 📡 LORA LOCATION
    // =====================================================

    locationMethod: {
      type: String,

      enum: [
        "",
        "LORA_RSSI",
        "NONE",
      ],

      default: "",
    },

    nearestReceiver: {
      type: String,

      default: "",

      trim: true,
    },

    estimatedLocation: {
      type: String,

      default: "",

      trim: true,
    },

    rssi: {
      type: Number,

      default: null,
    },


    // =====================================================
    // 📍 LEGACY LOCATION
    // =====================================================
    //
    // GPS is no longer used by the jacket.
    // These fields are kept only for old records /
    // backward compatibility.
    //

    latitude: {
      type: Number,

      default: null,
    },

    longitude: {
      type: Number,

      default: null,
    },


    // =====================================================
    // 🔔 READ STATUS
    // =====================================================

    read: {
      type: Boolean,

      default: false,
    },


    // =====================================================
    // 🕐 TIME
    // =====================================================

    createdAt: {
      type: Date,

      default: Date.now,
    },
  },

  {
    timestamps: true,
  }
);


// =====================================================
// 📦 EXPORT MODEL
// =====================================================

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);