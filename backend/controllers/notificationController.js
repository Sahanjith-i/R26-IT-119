const Notification = require("../models/Notification");

// =====================================================
// 🔔 SMART MINER NOTIFICATION CONTROLLER
// Central Control & Alert Management
// =====================================================


// =====================================================
// 🔧 CREATE NOTIFICATION
// =====================================================

exports.createNotification = async (req, res) => {
  try {

    const data = req.body || {};

    // -------------------------------------------------
    // REQUIRED
    // -------------------------------------------------

    if (!data.minerId) {
      return res.status(400).json({
        success: false,
        error: "minerId is required",
      });
    }


    // -------------------------------------------------
    // CREATE
    // -------------------------------------------------

    const notification = await Notification.create({

      minerId: data.minerId,

      minerName:
        data.minerName ||
        "Unknown Miner",

      // Examples:
      // SOS
      // FALL
      // DANGER
      // WARNING
      // SENSOR_OFFLINE
      // SENSOR_ONLINE
      // ALL_SENSORS_OFFLINE
      // INFO

      type:
        data.type ||
        "INFO",

      title:
        data.title ||
        getDefaultTitle(data.type),

      message:
        data.message ||
        "New system notification",

      sensor:
        data.sensor ||
        "",

      sensorValue:
        data.sensorValue ??
        null,

      severity:
        data.severity ||
        getDefaultSeverity(data.type),

      status:
        data.status ||
        "",

      // GPS no longer used
      latitude:
        data.latitude ??
        null,

      longitude:
        data.longitude ??
        null,

      // LoRa RSSI location
      nearestReceiver:
        data.nearestReceiver ||
        "",

      estimatedLocation:
        data.estimatedLocation ||
        "",

      rssi:
        data.rssi ??
        null,

      read: false,
    });


    // =================================================
    // 🔥 LIVE SOCKET NOTIFICATION
    // =================================================

    const io =
      req.app.get("io");


    if (io) {

      io.emit(
        "notification",
        notification
      );

    }


    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({

      success:
        true,

      notification,

    });

  }

  catch (error) {

    console.error(
      "Create notification error:",
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
// 🔔 DEFAULT TITLES
// =====================================================

function getDefaultTitle(type) {

  switch (type) {

    case "SOS":
      return "SOS Emergency";

    case "FALL":
      return "Fall Detected";

    case "DANGER":
      return "Danger Alert";

    case "WARNING":
      return "Safety Warning";

    case "SENSOR_OFFLINE":
      return "Sensor Offline";

    case "SENSOR_ONLINE":
      return "Sensor Online";

    case "ALL_SENSORS_OFFLINE":
      return "All Sensors Offline";

    case "LOCATION_OFFLINE":
      return "Location Tracking Offline";

    default:
      return "System Notification";
  }
}


// =====================================================
// 🚦 DEFAULT SEVERITY
// =====================================================

function getDefaultSeverity(type) {

  switch (type) {

    case "SOS":
      return "CRITICAL";

    case "FALL":
      return "CRITICAL";

    case "DANGER":
      return "CRITICAL";

    case "ALL_SENSORS_OFFLINE":
      return "CRITICAL";

    case "SENSOR_OFFLINE":
      return "WARNING";

    case "WARNING":
      return "WARNING";

    case "SENSOR_ONLINE":
      return "SUCCESS";

    default:
      return "INFO";
  }
}


// =====================================================
// 🔔 GET NOTIFICATIONS
// =====================================================

exports.getNotifications = async (req, res) => {

  try {

    const notifications =
      await Notification.find()
        .sort({
          createdAt: -1,
        })
        .limit(100);


    return res.json(
      notifications
    );

  }

  catch (error) {

    console.error(
      "Get notifications error:",
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
// 🔔 GET NOTIFICATIONS FOR MINER
// =====================================================

exports.getMinerNotifications = async (
  req,
  res
) => {

  try {

    const notifications =
      await Notification.find({

        minerId:
          req.params.minerId,

      })
      .sort({
        createdAt: -1,
      })
      .limit(100);


    return res.json(
      notifications
    );

  }

  catch (error) {

    console.error(
      "Get miner notifications error:",
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
// 🔔 GET UNREAD COUNT
// =====================================================

exports.getUnreadCount = async (
  req,
  res
) => {

  try {

    const count =
      await Notification.countDocuments({

        read:
          false,

      });


    return res.json({

      success:
        true,

      count,

    });

  }

  catch (error) {

    return res.status(500).json({

      success:
        false,

      error:
        error.message,

    });

  }
};


// =====================================================
// 🚨 GET CRITICAL / ACTIVE NOTIFICATIONS
// =====================================================

exports.getCriticalNotifications =
  async (req, res) => {

    try {

      const notifications =
        await Notification.find({

          read:
            false,

          severity:
            {
              $in: [
                "CRITICAL",
                "WARNING",
              ],
            },

        })
        .sort({
          createdAt: -1,
        })
        .limit(100);


      return res.json(
        notifications
      );

    }

    catch (error) {

      return res.status(500).json({

        success:
          false,

        error:
          error.message,

      });

    }
  };


// =====================================================
// ✅ MARK ONE AS READ
// =====================================================

exports.markAsRead = async (
  req,
  res
) => {

  try {

    const notification =
      await Notification.findByIdAndUpdate(

        req.params.id,

        {
          read:
            true,
        },

        {
          new:
            true,
        }

      );


    if (!notification) {

      return res.status(404).json({

        success:
          false,

        error:
          "Notification not found",

      });

    }


    return res.json({

      success:
        true,

      notification,

    });

  }

  catch (error) {

    return res.status(500).json({

      success:
        false,

      error:
        error.message,

    });

  }
};


// =====================================================
// ✅ MARK ALL AS READ
// =====================================================

exports.markAllAsRead = async (
  req,
  res
) => {

  try {

    await Notification.updateMany(

      {
        read:
          false,
      },

      {
        $set: {
          read:
            true,
        },
      }

    );


    return res.json({

      success:
        true,

      message:
        "All notifications marked as read",

    });

  }

  catch (error) {

    return res.status(500).json({

      success:
        false,

      error:
        error.message,

    });

  }
};


// =====================================================
// 🗑 DELETE ONE NOTIFICATION
// =====================================================

exports.deleteNotification =
  async (req, res) => {

    try {

      const deleted =
        await Notification.findByIdAndDelete(
          req.params.id
        );


      if (!deleted) {

        return res.status(404).json({

          success:
            false,

          error:
            "Notification not found",

        });

      }


      return res.json({

        success:
          true,

        message:
          "Notification deleted",

      });

    }

    catch (error) {

      return res.status(500).json({

        success:
          false,

        error:
          error.message,

      });

    }
  };


// =====================================================
// 🗑 DELETE ALL NOTIFICATIONS
// =====================================================

exports.deleteAll =
  async (req, res) => {

    try {

      await Notification.deleteMany({});


      return res.json({

        success:
          true,

        message:
          "All notifications deleted",

      });

    }

    catch (error) {

      return res.status(500).json({

        success:
          false,

        error:
          error.message,

      });

    }
  };