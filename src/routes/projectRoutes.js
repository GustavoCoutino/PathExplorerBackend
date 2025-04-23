const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const auth = require("../middleware/auth");

router.post(
  "/user-project-and-role",
  auth.authenticateJWT,
  projectController.getUserProjectAndRole
);

router.get(
  "/manager-projects-with-roles",
  auth.authenticateJWT,
  auth.authorize("manager"),
  projectController.getManagerProjectsWithRoles
);
router.post(
  "/create-project",
  auth.authenticateJWT,
  auth.authorize("manager"),
  projectController.createProject
);
module.exports = router;
