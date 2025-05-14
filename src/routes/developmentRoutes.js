const express = require("express");
const router = express.Router();
const developmentController = require("../controllers/developmentController");
const auth = require("../middleware/auth");

router.get(
  "/all-courses",
  auth.authenticateJWT,
  auth.authorize("empleado"),
  developmentController.getAllCourses
);

router.get(
  "/all-certifications",
  auth.authenticateJWT,
  auth.authorize("empleado"),
  developmentController.getAllCertifications
);

router.post(
  "/create-course",
  auth.authenticateJWT,
  auth.authorize("empleado"),
  developmentController.addUserCourse
);

router.post(
  "/create-certification",
  auth.authenticateJWT,
  auth.authorize("empleado"),
  developmentController.addUserCertification
);
// In your developmentRoutes.js file
router.patch(
  "/edit-certification",
  auth.authenticateJWT,
  (req, res, next) => {
    console.log("Edit certification route hit, body:", req.body);
    next();
  },
  developmentController.editUserCertification
);

router.patch(
  "/edit-course",
  auth.authenticateJWT,
  developmentController.editUserCourse
);


// Log all routes on server startup


module.exports = router;
