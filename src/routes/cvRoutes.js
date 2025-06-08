const express = require("express");
const router = express.Router();
const cvController = require("../controllers/cvController");

// Ruta para procesar CV
router.post(
    "/scan-cv",
    cvController.upload.single('file'),
    cvController.scanCV
);

// Ruta para health check
router.get("/health", cvController.healthCheck);

module.exports = router;