const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");
const auth = require("../middleware/auth");

router.get(
  "/development-recommendations",
  auth.authenticateJWT,
  recommendationController.getRecommendations
);

module.exports = router;
