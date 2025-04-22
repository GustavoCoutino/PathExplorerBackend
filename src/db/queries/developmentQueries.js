const db = require("./../pool");

const getAllCourses = async () => {
  try {
    const result = await db.query(
      `
        SELECT c.id_curso, c.nombre, c.Institucion, c.descripcion, c.duracion, c.modalidad, c.categoria FROM desarrollo.curso c;
    `
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw error;
  }
};

const getAllCertifications = async () => {
  try {
    const result = await db.query(
      `
                SELECT c.ID_Certificacion, c.Nombre, c.Institucion, c.Validez, c.Nivel
      FROM desarrollo.certificacion c;
            `
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching certifications:", error);
    throw error;
  }
};

const addUserCourse = async (
  id_persona,
  id_curso,
  fecha_inicio,
  fecha_finalizacion,
  calificacion,
  certificado,
  fecha_creacion,
  progreso
) => {
  try {
    if (fecha_finalizacion === "") {
      fecha_finalizacion = null;
    }
    const result = await db.query(
      `
                      INSERT INTO desarrollo.persona_curso (id_persona, id_curso, fecha_inicio, fecha_finalizacion, calificacion, certificado, fecha_creacion, progreso)
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                      RETURNING *;
                  `,
      [
        id_persona,
        id_curso,
        fecha_inicio,
        fecha_finalizacion,
        calificacion,
        certificado,
        fecha_creacion,
        progreso,
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error adding user course:", error);
    throw error;
  }
};

const addUserCertification = async (
  id_persona,
  id_certificacion,
  fecha_inicio,
  fecha_finalizacion,
  estado_validacion,
  fecha_creacion
) => {
  try {
    const result = await db.query(
      `
        INSERT INTO desarrollo.persona_certificacion (id_persona, id_certificacion, fecha_obtencion, fecha_vencimiento, estado_validacion, fecha_creacion)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
        `,
      [
        id_persona,
        id_certificacion,
        fecha_inicio,
        fecha_finalizacion,
        estado_validacion,
        fecha_creacion,
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error adding user certification:", error);
    throw error;
  }
};

const getUserCourseByIds = async (id_persona, id_curso) => {
  try {
    const result = await db.query(
      `
        SELECT * FROM desarrollo.persona_curso
        WHERE id_persona = $1 AND id_curso = $2;
      `,
      [id_persona, id_curso]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching user course:", error);
    throw error;
  }
};

module.exports = {
  getAllCourses,
  getAllCertifications,
  addUserCourse,
  addUserCertification,
  getUserCourseByIds,
};
