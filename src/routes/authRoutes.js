const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");

router.post("/login", userController.login);
router.get("/me", auth.authenticateJWT, userController.getUserProfile);
router.patch("/update", auth.authenticateJWT, userController.updateUserProfile);
router.get(
  "/certifications",
  auth.authenticateJWT,
  userController.getUserCertifications
);
router.get("/courses", auth.authenticateJWT, userController.getUserCourses);
router.get(
  "/professional-history",
  auth.authenticateJWT,
  userController.getUserProfessionalHistory
);

module.exports = router;
