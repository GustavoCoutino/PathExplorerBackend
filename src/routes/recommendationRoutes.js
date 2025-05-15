const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");
const auth = require("../middleware/auth");

router.get(
  "/development-recommendations",
  auth.authenticateJWT,
  recommendationController.getRecommendations
);

router.post(
  "/development-recommendations",
  auth.authenticateJWT,
  recommendationController.createEmployeeTrayectory
);

router.get(
  "/get-user-trayectorias",
  auth.authenticateJWT,
  recommendationController.getUserTrayectoria
);

module.exports = router;
