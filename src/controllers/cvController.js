const multer = require("multer");
const CVProcessor = require("../services/cvProcessorService");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB límite
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de archivo no permitido. Solo PDF y DOCX."), false);
    }
  },
});

const cvProcessor = new CVProcessor();

const scanCV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionó archivo",
      });
    }

    const fileType = req.file.mimetype.includes("pdf") ? "pdf" : "docx";

    const startTime = Date.now();
    const cvData = await cvProcessor.processCV(req.file.buffer, fileType);
    const processingTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      message: "CV procesado exitosamente",
      data: cvData,
      processing_time_ms: processingTime,
    });
  } catch (error) {
    console.error("❌ Error procesando CV:", error);

    return res.status(500).json({
      success: false,
      message: "Error procesando el CV",
      error: error.message,
    });
  }
};

const healthCheck = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Servicio de CV Scanner funcionando",
      version: "5.0.0",
      features: [
        "🛡️ Preserva toda la información del usuario",
        "🧠 Extrae habilidades implícitas",
        "🌍 Funciona con CVs en cualquier idioma",
        "🎯 Maximiza oportunidades de contratación",
      ],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error en el servicio",
      error: error.message,
    });
  }
};

module.exports = {
  upload,
  scanCV,
  healthCheck,
};
