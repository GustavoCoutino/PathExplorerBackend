const multer = require('multer');
const CVProcessor = require('../services/cvProcessorService');
const CVQueries = require('../db/queries/cvQueries');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB límite
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo PDF y DOCX.'), false);
        }
    }
});

const cvProcessor = new CVProcessor();

// Endpoint principal: Procesar y guardar CV
const uploadAndSaveCV = async (req, res) => {
    try {
        console.log("🔄 Iniciando upload y guardado de CV...");

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No se proporcionó archivo"
            });
        }

        const id_persona = req.user.id_persona;
        console.log(`📁 Procesando CV para usuario: ${id_persona}`);

        const fileType = req.file.mimetype.includes('pdf') ? 'pdf' : 'docx';

        // 1. Extraer datos del CV con IA
        console.log("🤖 Extrayendo datos con IA...");
        const startTime = Date.now();
        const cvData = await cvProcessor.processCV(req.file.buffer, fileType);
        const extractionTime = Date.now() - startTime;

        console.log(`✅ Datos extraídos en ${extractionTime}ms`);
        console.log("📊 Resumen de datos extraídos:", {
            nombre: cvData.informacion_personal?.nombre_completo,
            experiencias: cvData.experiencia_laboral?.length || 0,
            educacion: cvData.educacion?.length || 0,
            certificaciones: cvData.certificaciones?.length || 0,
            habilidades_tecnicas: cvData.habilidades?.tecnicas?.length || 0,
            habilidades_blandas: cvData.habilidades?.blandas?.length || 0
        });

        // 2. Guardar datos en la base de datos
        console.log("💾 Guardando datos en base de datos...");
        const saveStartTime = Date.now();
        const savedData = await CVQueries.saveCVDataBatch(id_persona, cvData);
        const saveTime = Date.now() - saveStartTime;

        console.log(`✅ Datos guardados en ${saveTime}ms`);
        console.log("📈 Resumen de datos guardados:", {
            profile_updated: !!savedData.profile,
            certifications_added: savedData.certifications.length,
            courses_added: savedData.courses.length,
            skills_added: savedData.skills.length
        });

        const totalTime = Date.now() - startTime;

        return res.status(200).json({
            success: true,
            message: "CV procesado y guardado exitosamente",
            data: {
                extracted: cvData,
                saved: savedData,
                summary: {
                    certifications_added: savedData.certifications.length,
                    courses_added: savedData.courses.length,
                    skills_added: savedData.skills.length,
                    profile_updated: !!savedData.profile
                }
            },
            processing_time: {
                extraction_ms: extractionTime,
                saving_ms: saveTime,
                total_ms: totalTime
            }
        });

    } catch (error) {
        console.error("❌ Error en upload y guardado de CV:", error);

        return res.status(500).json({
            success: false,
            message: "Error procesando y guardando el CV",
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Endpoint solo para extraer (sin guardar)
const extractCVData = async (req, res) => {
    try {
        console.log("🔄 Extrayendo datos de CV (solo vista previa)...");

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No se proporcionó archivo"
            });
        }

        const fileType = req.file.mimetype.includes('pdf') ? 'pdf' : 'docx';

        const startTime = Date.now();
        const cvData = await cvProcessor.processCV(req.file.buffer, fileType);
        const processingTime = Date.now() - startTime;

        console.log(`✅ Datos extraídos en ${processingTime}ms (solo vista previa)`);

        return res.status(200).json({
            success: true,
            message: "CV procesado exitosamente (vista previa)",
            data: cvData,
            processing_time_ms: processingTime,
            preview_mode: true
        });

    } catch (error) {
        console.error("❌ Error extrayendo datos de CV:", error);

        return res.status(500).json({
            success: false,
            message: "Error procesando el CV",
            error: error.message
        });
    }
};

// Health check específico para CV upload
const healthCheck = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: "Servicio de CV Upload funcionando",
            version: "1.0.0",
            features: [
                "🤖 Extracción con IA avanzada",
                "💾 Guardado automático en BD",
                "🔄 Mapeo a tablas existentes",
                "📊 Vista previa editable",
                "🌍 Soporte multiidioma"
            ],
            supported_formats: ["PDF", "DOCX"],
            max_file_size: "10MB"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error en el servicio",
            error: error.message
        });
    }
};

module.exports = {
    upload,
    uploadAndSaveCV,
    extractCVData,
    healthCheck
};