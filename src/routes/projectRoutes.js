const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const auth = require("../middleware/auth");

router.post(
  "/user-project-and-role",
  auth.authenticateJWT,
  projectController.getUserProjectAndRole
);
module.exports = router;
