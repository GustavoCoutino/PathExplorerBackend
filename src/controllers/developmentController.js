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
      fecha_creacion
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

module.exports = {
  getAllCourses,
  getAllCertifications,
  addUserCourse,
  addUserCertification,
};
