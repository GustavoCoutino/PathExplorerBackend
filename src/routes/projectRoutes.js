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
router.post(
  "/best-candidates-for-role",
  auth.authenticateJWT,
  auth.authorize("manager"),
  projectController.getBestCandidatesForRole
);
router.patch(
  "/edit-project",
  auth.authenticateJWT,
  auth.authorize("manager"),
  projectController.editProject
);
router.post(
  "/add-roles-to-project",
  auth.authenticateJWT,
  auth.authorize("manager"),
  projectController.addRoleToProject
);
router.delete(
  "/remove-role-from-project",
  auth.authenticateJWT,
  auth.authorize("manager"),
  projectController.removeRoleFromProject
);
router.get("/all-skills", auth.authenticateJWT, projectController.getAllSkills);

module.exports = router;
