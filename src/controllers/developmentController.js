const developmentQueries = require("../db/queries/developmentQueries");

const getAllCourses = async (req, res) => {
  try {
    const courses = await developmentQueries.getAllCourses();
    res.status(200).json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Error retrieving courses" });
  }
};

const getAllCertifications = async (req, res) => {
  try {
    const certifications = await developmentQueries.getAllCertifications();
    res.status(200).json(certifications);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving certifications" });
  }
};

const addUserCourse = async (req, res) => {
  try {
    const { id_persona } = req.user;
    const {
      id_curso,
      fecha_inicio,
      fecha_finalizacion,
      calificacion,
      certificado,
      progreso,
    } = req.body;

    const fecha_creacion = new Date();
    const existingCourse = await developmentQueries.getUserCourseByIds(
      id_persona,
      id_curso
    );
    if (existingCourse && Object.keys(existingCourse).length > 0) {
      return res.status(400).json({
        message: "El curso ya ha sido registrado para este usuario",
      });
    }

    const newCourse = await developmentQueries.addUserCourse(
      id_persona,
      id_curso,
      fecha_inicio,
      fecha_finalizacion,
      calificacion,
      certificado,
      fecha_creacion,
      progreso
    );

    res.status(201).json(newCourse);
  } catch (error) {
    res.status(500).json({ message: "Error adding user course" });
  }
};

const addUserCertification = async (req, res) => {
  try {
    const {
      id_certificacion,
      fecha_obtencion,
      fecha_vencimiento,
      estado_validacion,
    } = req.body;
    const { id_persona } = req.user;

    const fecha_creacion = new Date();
    const existingCertification =
      await developmentQueries.getUserCertificationByIds(
        id_persona,
        id_certificacion
      );
    if (
      existingCertification &&
      Object.keys(existingCertification).length > 0
    ) {
      return res.status(400).json({
        message: "La certificación ya ha sido registrada para este usuario",
      });
    }

    const newCertification = await developmentQueries.addUserCertification(
      id_persona,
      id_certificacion,
      fecha_obtencion,
      fecha_vencimiento,
      estado_validacion,
      fecha_creacion
    );

    res.status(201).json(newCertification);
  } catch (error) {
    res.status(500).json({ message: "Error adding user certification" });
  }
};

const editUserCourse = async (req, res) => {
  try {
    const userId = req.user.id_persona;

    const {
      id_curso,
      fecha_inicio,
      fecha_finalizacion,
      calificacion,
      certificado,
      progreso,
    } = req.body;

    if (!id_curso || !fecha_inicio || !calificacion) {
      return res.status(400).json({
        success: false,
        message: "ID de curso, fecha de inicio y calificación son requeridos",
      });
    }

    const updatedCourse = await developmentQueries.editUserCourse(userId, {
      id_curso,
      fecha_inicio,
      fecha_finalizacion,
      calificacion,
      certificado,
      progreso,
    });

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: "Curso no encontrado o no se pudo actualizar",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Curso actualizado con éxito",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Update user course error:", error);
    return res.status(500).json({
      success: false,
      message: `Error al actualizar el curso: ${
        error.message || "Error desconocido"
      }`,
    });
  }
};

const editUserCertification = async (req, res) => {
  try {
    const userId = req.user.id_persona;

    const {
      id_certificacion,
      fecha_obtencion,
      fecha_vencimiento,
      estado_validacion,
    } = req.body;

    const fecha_creacion = req.body.fecha_creacion || new Date().toISOString();

    if (!id_certificacion) {
      console.error("Missing required field: id_certificacion");
      return res.status(400).json({
        success: false,
        message: "ID de certificación es requerido",
      });
    }

    const updateCertification = await developmentQueries.editUserCertification(
      userId,
      {
        id_certificacion,
        fecha_obtencion,
        fecha_vencimiento,
        estado_validacion,
        fecha_creacion,
      }
    );

    if (!updateCertification) {
      console.error("No se encontró la certificación para actualizar");
      return res.status(404).json({
        success: false,
        message: "No se encontró la certificación para actualizar",
      });
    }

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({
      success: true,
      message: "Certificación actualizada con éxito",
      certification: updateCertification,
    });
  } catch (error) {
    console.error("Update user certification error:", error);
    res.setHeader("Content-Type", "application/json");
    return res.status(500).json({
      success: false,
      message:
        "Error al actualizar la certificación: " + (error.message || error),
    });
  }
};

module.exports = {
  getAllCourses,
  getAllCertifications,
  addUserCourse,
  addUserCertification,
  editUserCourse,
  editUserCertification,
};
