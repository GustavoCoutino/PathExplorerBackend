const feedbackController = require("../controllers/feedbackController");
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

router.get(
  "/manager",
  auth.authenticateJWT,
  auth.authorize(["manager"]),
  feedbackController.getEvaluacionesManager
);
router.get(
  "/empleado",
  auth.authenticateJWT,
  auth.authorize(["empleado"]),
  feedbackController.getEvaluacionesEmpleado
);
router.get(
  "/administrador",
  auth.authenticateJWT,
  auth.authorize(["administrador"]),
  feedbackController.getEvaluacionesAdministrador
);
router.post(
  "/create",
  auth.authenticateJWT,
  auth.authorize(["manager"]),
  feedbackController.createEvaluacion
);

router.get(
  "/team-and-members",
  auth.authenticateJWT,
  auth.authorize(["manager"]),
  feedbackController.getProyectAndTeam
);

router.delete(
  "/borrar/:id_evaluacion",
  auth.authenticateJWT,
  auth.authorize(["manager"]),
  feedbackController.deleteEvaluacion
);
module.exports = router;
