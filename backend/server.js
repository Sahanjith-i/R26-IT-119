require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

// =====================================================
// APP SETUP
// =====================================================

const app = express();
const server = http.createServer(app);

// =====================================================
// SOCKET.IO
// =====================================================

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Make Socket.IO available inside controllers/routes
app.set("io", io);

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

// =====================================================
// BASIC API STATUS
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    system: "Smart Miner Safety Jacket",
    module: "Central Control & Alert Management",
    status: "ONLINE",
    message: "Central Control Backend is running",
  });
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/api/health", (req, res) => {
  const databaseConnected =
    mongoose.connection.readyState === 1;

  res.json({
    server: "ONLINE",
    database: databaseConnected
      ? "CONNECTED"
      : "DISCONNECTED",
    socket: "ACTIVE",
    timestamp: new Date(),
  });
});

// =====================================================
// ROUTES
// =====================================================

app.use(
  "/api/miners",
  require("./routes/minerRoutes")
);

app.use(
  "/api/notifications",
  require("./routes/notificationRoutes")
);


// =====================================================
// MONGODB
// =====================================================

const mongoUri =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/centralcontrol";

if (!process.env.MONGO_URI) {
  console.warn(
    "⚠️ MONGO_URI is not set."
  );

  console.warn(
    "Using local MongoDB:"
  );

  console.warn(
    "mongodb://127.0.0.1:27017/centralcontrol"
  );
}

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log(
      "MongoDB Connected ✅"
    );
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed ❌"
    );

    console.error(error.message);

    process.exit(1);
  });

// =====================================================
// SOCKET CONNECTION
// =====================================================

io.on("connection", (socket) => {

  console.log(
    `Client connected 🔌 ${socket.id}`
  );

  // ---------------------------------------------------
  // Client requests latest monitoring data
  // ---------------------------------------------------

  socket.on(
    "requestMonitoringData",
    () => {

      console.log(
        `Monitoring data requested by ${socket.id}`
      );

      socket.emit(
        "monitoringReady",
        {
          status: "ONLINE",
          timestamp: new Date(),
        }
      );
    }
  );

  // ---------------------------------------------------
  // Sensor data
  //
  // Future ESP32 / receiver can send:
  // sensorData
  // ---------------------------------------------------

  socket.on(
    "sensorData",
    (data) => {

      console.log(
        "Sensor data received:",
        data
      );

      // Send sensor information
      // to all connected dashboards
      io.emit(
        "dataUpdate",
        data
      );
    }
  );

  // ---------------------------------------------------
  // Alert event
  // ---------------------------------------------------

  socket.on(
    "alertTriggered",
    (alertData) => {

      console.log(
        "🚨 ALERT:",
        alertData
      );

      // Send alert to all monitoring clients
      io.emit(
        "alertUpdate",
        alertData
      );

      // Also update general dashboard data
      io.emit(
        "dataUpdate",
        alertData
      );
    }
  );

  // ---------------------------------------------------
  // SOS emergency
  // ---------------------------------------------------

  socket.on(
    "sosTriggered",
    (sosData) => {

      console.log(
        "🚨🚨 SOS EMERGENCY:",
        sosData
      );

      io.emit(
        "sosAlert",
        {
          ...sosData,
          alertType: "SOS",
          timestamp: new Date(),
        }
      );

      io.emit(
        "dataUpdate",
        {
          ...sosData,
          sosAlert: true,
          status: "DANGER",
        }
      );
    }
  );

  // ---------------------------------------------------
  // Miner status update
  // ---------------------------------------------------

  socket.on(
    "minerStatusUpdate",
    (statusData) => {

      console.log(
        "Miner status update:",
        statusData
      );

      io.emit(
        "minerStatusUpdate",
        statusData
      );

      io.emit(
        "dataUpdate",
        statusData
      );
    }
  );

  // ---------------------------------------------------
  // Disconnect
  // ---------------------------------------------------

  socket.on(
    "disconnect",
    () => {

      console.log(
        `Client disconnected ❌ ${socket.id}`
      );
    }
  );

});

// =====================================================
// SERVER ERROR HANDLER
// =====================================================

app.use(
  (err, req, res, next) => {

    console.error(
      "Server Error:",
      err
    );

    res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use(
  (req, res) => {

    res.status(404).json({
      success: false,
      message: "API route not found",
      path: req.originalUrl,
    });

  }
);

// =====================================================
// START SERVER
// =====================================================

const PORT =
  process.env.PORT || 5000;

server.listen(
  PORT,
  () => {

    console.log("");
    console.log(
      "======================================"
    );

    console.log(
      " SMART MINER SAFETY JACKET"
    );

    console.log(
      " CENTRAL CONTROL SYSTEM"
    );

    console.log(
      "======================================"
    );

    console.log(
      `Server running on port ${PORT} 🚀`
    );

    console.log(
      `API: http://localhost:${PORT}`
    );

    console.log(
      `Health: http://localhost:${PORT}/api/health`
    );

    console.log(
      "Socket.IO: ACTIVE 🔌"
    );

    console.log(
      "======================================"
    );

    console.log("");
  }
);

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

const shutdown = async () => {

  console.log(
    "\nShutting down server..."
  );

  try {

    await mongoose.connection.close();

    console.log(
      "MongoDB connection closed."
    );

    server.close(() => {

      console.log(
        "Server closed."
      );

      process.exit(0);

    });

  } catch (error) {

    console.error(
      "Shutdown error:",
      error
    );

    process.exit(1);
  }
};

process.on(
  "SIGINT",
  shutdown
);

process.on(
  "SIGTERM",
  shutdown
);