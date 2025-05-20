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
  "/get-user-trajectoria",
  auth.authenticateJWT,
  recommendationController.getUserTrayectoria
);

router.get(
  "/cursos-y-certificaciones-recomendados",
  auth.authenticateJWT,
  recommendationController.getCoursesAndCertificationsRecommendations
);

router.get(
  "/roles-recomendados",
  auth.authenticateJWT,
  recommendationController.getRecommendedEmployeeRoles
);
module.exports = router;
