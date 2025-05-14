const db = require("./../pool");

const getAllProfessionalGoals = async () => {
  try {
    const result = await db.query(
      `
            SELECT id_meta, id_persona, plazo, fecha_establecimiento, estado, prioridad, fecha_actualizacion FROM desarrollo.meta_profesional;
        `
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching professional goals:", error);
    throw error;
  }
};

const getAllProfessionalTrayectory = async () => {
  try {
    const result = await db.query(
      `
            SELECT pt.id_persona, pt.id_trayectoria, pt.progreso, pt.etapa_actual, pt.fecha_actualizacion, tc.nombre, tc.descripcion, tc.roles_secuenciales, tc.tiempo_estimado FROM desarrollo.persona_trayectoria pt INNER JOIN desarrollo.trayectoria_carrera tc ON pt.id_trayectoria = tc.id_trayectoria;
        `
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching professional trajectory:", error);
    throw error;
  }
};

const getAllEmployeeEvaluations = async () => {
  try {
    const result = await db.query(
      `
            SELECT e.id_evaluacion, e.id_empleado, e.id_manager, e.fecha, e.areas_mejora, e.calificacion, e.id_proyecto, e.comentarios, e.fortalezas FROM evaluacion.evaluacion_desempeno e;
        `
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching employee evaluations:", error);
    throw error;
  }
};

const getAllEmployeesStates = async () => {
  try {
    const result = await db.query(
      `SELECT e.id_empleado, e.id_persona, e.estado, e.porcentaje_disponibilidad FROM personas.empleado e;`
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching employee states:", error);
    throw error;
  }
};

const getAllRequiredAbilitiesForRoles = async () => {
  try {
    const result = await db.query(
      `SELECT r.id_rol, r.id_habilidad, r.nivel_minimo_requerido, r.importancia, h.nombre, rr.titulo FROM recursos.rol_habilidad r INNER JOIN recursos.habilidad h ON r.id_habilidad = h.id_habilidad INNER JOIN recursos.rol rr ON r.id_rol = rr.id_rol;`
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching habilidades:", error);
    throw error;
  }
};

const getAllEmployeeCourses = async () => {
  try {
    const result = await db.query(
      `
                SELECT pc.id_persona, pc.id_curso, pc.fecha_inicio, pc.fecha_finalizacion, pc.calificacion, pc.progreso, c.nombre FROM desarrollo.persona_curso pc INNER JOIN desarrollo.curso c ON pc.id_curso = c.id_curso;
            `
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching employee courses:", error);
    throw error;
  }
};

const getAllEmployeeCertifications = async () => {
  try {
    const result = await db.query(
      `
                SELECT pc.id_persona, pc.id_certificacion, pc.fecha_obtencion, pc.fecha_vencimiento, pc.estado_validacion, c.nombre FROM desarrollo.persona_certificacion pc INNER JOIN desarrollo.certificacion c ON pc.id_certificacion = c.id_certificacion;
            `
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching employee certifications:", error);
    throw error;
  }
};

const getAllRoles = async () => {
  try {
    const result = await db.query(
      `
                SELECT r.id_rol, r.titulo, r.nivel_experiencia_requerido, r.estado, r.id_proyecto, r.id_manager FROM recursos.rol r;
            `
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};

module.exports = {
  getAllProfessionalGoals,
  getAllProfessionalTrayectory,
  getAllEmployeeEvaluations,
  getAllEmployeesStates,
  getAllRequiredAbilitiesForRoles,
  getAllEmployeeCourses,
  getAllEmployeeCertifications,
  getAllRoles,
};
