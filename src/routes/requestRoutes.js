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
  auth.authorize("manager"),
  requestController.createAssignmentRequest
);
router.patch(
  "/update-assignment-request",
  auth.authenticateJWT,
  auth.authorize("administrador"),
  requestController.updateAssignmentRequest
);
module.exports = router;
