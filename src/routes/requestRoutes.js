const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");
const auth = require("../middleware/auth");

router.get(
  "/assignment-requests",
  auth.authenticateJWT,
  auth.authorize("administrador"),
  requestController.getAssignmentRequests
);
router.post(
  "/create-assignment-request",
  auth.authenticateJWT,
  auth.authorize(["manager", "empleado"]),
  requestController.createAssignmentRequest
);
router.patch(
  "/update-assignment-request",
  auth.authenticateJWT,
  auth.authorize("administrador"),
  requestController.updateAssignmentRequest
);

router.get(
  "/administrators",
  auth.authenticateJWT,
  auth.authorize(["manager", "empleado"]),
  requestController.getAllAdministratorsForRequest
);
module.exports = router;
