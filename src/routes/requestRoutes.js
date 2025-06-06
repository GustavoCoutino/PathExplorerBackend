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
  "/create-assignment-request-employee",
  auth.authenticateJWT,
  auth.authorize("empleado"),
  requestController.createAssignmentRequestEmployee
);

router.post(
  "/create-assignment-request-manager",
  auth.authenticateJWT,
  auth.authorize("manager"),
  requestController.createAssignmentRequestManager
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

router.get(
  "/has-pending-assignment-request",
  auth.authenticateJWT,
  auth.authorize("empleado"),
  requestController.findIfEmployeeHasPendingAssignmentRequest
);
module.exports = router;
