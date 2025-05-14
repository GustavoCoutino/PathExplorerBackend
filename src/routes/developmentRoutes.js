const express = require("express");
const router = express.Router();
const developmentController = require("../controllers/developmentController");
const auth = require("../middleware/auth");
router.get(
  "/all-courses",
  auth.authenticateJWT,
  auth.authorize(["empleado", "manager"]),
  developmentController.getAllCourses
);

router.get(
  "/all-certifications",
  auth.authenticateJWT,
  auth.authorize(["empleado", "manager"]),
  developmentController.getAllCertifications
);

router.post(
  "/create-course",
  auth.authenticateJWT,
  auth.authorize(["empleado", "manager"]),
  developmentController.addUserCourse
);

router.post(
  "/create-certification",
  auth.authenticateJWT,
  auth.authorize(["empleado", "manager"]),
  developmentController.addUserCertification
);

router.patch(
  "/edit-certification",
  auth.authenticateJWT,
  auth.authorize(["empleado", "manager"]),
  developmentController.editUserCertification
);

router.patch(
  "/edit-course",
  auth.authenticateJWT,
  auth.authorize(["empleado", "manager"]),
  developmentController.editUserCourse
);

module.exports = router;
