const express = require("express");
const router = express.Router();
const informesController = require("../controllers/informesController");
const auth = require("../middleware/auth");

router.get(
  "/",
  auth.authenticateJWT,
  auth.authorize("administrador"),
  informesController.getAllInformesData
);

module.exports = router;
