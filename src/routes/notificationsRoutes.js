const notificationsController = require("../controllers/notificationsController");
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

router.get(
  "/user-notifications",
  auth.authenticateJWT,
  notificationsController.getUserNotifications
);
router.patch(
  "/mark-notification-as-read",
  auth.authenticateJWT,
  notificationsController.markNotificationAsRead
);

module.exports = router;
