const express = require("express");
const router = express.Router();
const bancaController = require("../controllers/bancaController");
const auth = require("../middleware/auth");

router.get(
  "/empleados",
  auth.authenticateJWT,
  auth.authorize("administrador"),
  bancaController.managerGetAllEmployees
);

module.exports = router;
