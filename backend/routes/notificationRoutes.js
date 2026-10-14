const express = require("express");

const router = express.Router();

const controller =
  require("../controllers/notificationController");


// =====================================================
// 🔔 GET ALL NOTIFICATIONS
// GET /api/notifications
// =====================================================

router.get(
  "/",
  controller.getNotifications
);


// =====================================================
// 🚨 GET CRITICAL / ACTIVE NOTIFICATIONS
// GET /api/notifications/critical
//
// IMPORTANT:
// Must be BEFORE /:id routes.
// =====================================================

router.get(
  "/critical",
  controller.getCriticalNotifications
);


// =====================================================
// 👷 GET NOTIFICATIONS FOR ONE MINER
// GET /api/notifications/miner/MINER001
// =====================================================

router.get(
  "/miner/:minerId",
  controller.getMinerNotifications
);


// =====================================================
// 🔢 GET UNREAD COUNT
// GET /api/notifications/unread-count
// =====================================================

router.get(
  "/unread-count",
  controller.getUnreadCount
);


// =====================================================
// ➕ CREATE NOTIFICATION
// POST /api/notifications
// =====================================================

router.post(
  "/",
  controller.createNotification
);


// =====================================================
// ✅ MARK ALL AS READ
// PUT /api/notifications/read-all
// =====================================================

router.put(
  "/read-all",
  controller.markAllAsRead
);


// =====================================================
// 🗑 DELETE ALL NOTIFICATIONS
// DELETE /api/notifications
// =====================================================

router.delete(
  "/",
  controller.deleteAll
);


// =====================================================
// 🗑 DELETE ONE NOTIFICATION
// DELETE /api/notifications/:id
// =====================================================

router.delete(
  "/:id",
  controller.deleteNotification
);


// =====================================================
// ✅ MARK ONE NOTIFICATION AS READ
// PUT /api/notifications/:id/read
// =====================================================

router.put(
  "/:id/read",
  controller.markAsRead
);


// =====================================================
// 📦 EXPORT ROUTER
// =====================================================

module.exports = router;