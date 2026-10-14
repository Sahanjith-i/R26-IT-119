const express = require("express");

const router = express.Router();

const controller = require("../controllers/minerController");


// =====================================================
// 📡 SENSOR DATA
// ESP32 / LoRa Receiver → Backend
// =====================================================

router.post(
  "/data",
  controller.receiveData
);


// =====================================================
// 🚨 ACTIVE ALERTS
// IMPORTANT:
// Keep this BEFORE /:id
// =====================================================

router.get(
  "/alerts",
  controller.getAlerts
);


// =====================================================
// 👷 GET ALL MINERS
// GET /api/miners
// =====================================================

router.get(
  "/",
  controller.getAllMiners
);


// =====================================================
// 👷 GET SINGLE MINER
// GET /api/miners/MINER001
// =====================================================

router.get(
  "/:id",
  controller.getMinerById
);


// =====================================================
// ✏️ UPDATE MINER
// PUT /api/miners/MINER001
// =====================================================

router.put(
  "/:id",
  controller.updateMiner
);


// =====================================================
// 🗑 DELETE MINER
// DELETE /api/miners/MINER001
// =====================================================

router.delete(
  "/:id",
  controller.deleteMiner
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;