const express = require("express");
const router = express.Router();
const cvController = require("../controllers/cvController");
const cvUploadController = require("../controllers/cvUploadController");
const auth = require("../middleware/auth");

// Rutas existentes (sin autenticación para testing)
router.post(
  "/scan-cv",
  cvController.upload.single("file"),
  cvController.scanCV
);
router.get("/health", cvController.healthCheck);

// Ruta principal: Upload, procesar y guardar CV
router.post(
  "/upload-and-save",
  auth.authenticateJWT,
  cvUploadController.upload.single("file"),
  cvUploadController.uploadAndSaveCV
);

// Ruta para solo extraer datos (vista previa)
router.post(
  "/extract-preview",
  auth.authenticateJWT,
  cvUploadController.upload.single("file"),
  cvUploadController.extractCVData
);

// Health check para upload
router.get("/upload/health", cvUploadController.healthCheck);

module.exports = router;
