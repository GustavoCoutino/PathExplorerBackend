const db = require("./../pool");

const getUserRoleInProject = async (id_empleado) => {
  try {
    const result = await db.query(
      `
        SELECT re.id_empleado, re.id_rol, re.id_proyecto, re.porcentaje_dedicacion, r.titulo, r.descripcion, r.nivel_experiencia_requerido
        FROM recursos.asignacion_empleado re
        JOIN recursos.rol r ON re.id_rol = r.id_rol
        WHERE re.id_empleado = $1;
      `,
      [id_empleado]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching user role in project:", error);
    throw error;
  }
};

const getUserProject = async (id_empleado) => {
  try {
    const result = await db.query(
      `
       SELECT p.id_proyecto, p.nombre, p.descripcion, p.fecha_inicio, p.fecha_fin_estimada, p.estado
        FROM recursos.proyecto p
        JOIN recursos.asignacion_empleado re ON p.id_proyecto = re.id_proyecto
        WHERE re.id_empleado = $1; 
      `,
      [id_empleado]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching user projects:", error);
    throw error;
  }
};

const getUserSkillsInRole = async (id_rol) => {
  try {
    const result = await db.query(
      `
        SELECT rh.nivel_minimo_requerido, rh.importancia, h.nombre, h.categoria, h.descripcion
        FROM recursos.habilidad h
        JOIN recursos.rol_habilidad rh ON h.id_habilidad = rh.id_habilidad
        WHERE rh.id_rol = $1;
      `,
      [id_rol]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching user skills in role:", error);
    throw error;
  }
};

module.exports = {
  getUserRoleInProject,
  getUserProject,
  getUserSkillsInRole,
};
