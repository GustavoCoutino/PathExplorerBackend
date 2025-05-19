const dashboardController = require("../controllers/dashboardController");
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

router.get(
  "/",
  auth.authenticateJWT,
  auth.authorize(["empleado", "manager"]),
  dashboardController.getDashboardData
);

module.exports = router;
