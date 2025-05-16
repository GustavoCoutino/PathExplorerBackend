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
       SELECT p.id_proyecto, p.nombre, p.descripcion, p.fecha_inicio, p.fecha_fin_estimada, p.estado, p.id_manager
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

const getManagerProjects = async (id_manager) => {
  try {
    const result = await db.query(
      `
        SELECT p.* FROM recursos.proyecto p
        WHERE p.id_manager = $1;
      `,
      [id_manager]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching manager projects:", error);
    throw error;
  }
};

const getProjectRoles = async (id_proyecto) => {
  try {
    const result = await db.query(
      `
      SELECT r.id_rol, r.titulo, r.descripcion, r.nivel_experiencia_requerido
      FROM recursos.rol r
      WHERE r.id_proyecto = $1
      `,
      [id_proyecto]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching project roles:", error);
    throw error;
  }
};

const getRoleAssignments = async (id_rol) => {
  try {
    const result = await db.query(
      `
      SELECT ae.id_empleado,
             p.nombre, p.apellido, p.email
      FROM recursos.asignacion_empleado ae
      JOIN personas.persona p ON ae.id_empleado = p.id_persona
      WHERE ae.id_rol = $1
      `,
      [id_rol]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching role assignments:", error);
    throw error;
  }
};
const createProject = async (projectData) => {
  try {
    const result = await db.query(
      `SELECT recursos.crear_proyecto_completo($1, $2, $3, $4, $5, $6, $7)`,
      [
        projectData.nombre,
        projectData.descripcion,
        projectData.fecha_inicio,
        projectData.fecha_fin_estimada,
        projectData.prioridad,
        projectData.id_manager,
        JSON.stringify(projectData.roles),
      ]
    );

    return result.rows;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

const getBestCandidatesForRole = async (id_rol) => {
  try {
    const result = await db.query(
      `
      SELECT id_empleado, nombre_completo, puesto_actual, porcentaje_disponibilidad, porcentaje_match
      FROM recursos.vw_candidatos_para_roles
      WHERE id_rol = $1
      ORDER BY porcentaje_match DESC, porcentaje_disponibilidad DESC  
      LIMIT 5;
      `,
      [id_rol]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching best candidates for role:", error);
    throw error;
  }
};

const editProject = async (projectData) => {
  try {
    const result = await db.query(
      `UPDATE recursos.proyecto SET nombre = $1, descripcion = $2, fecha_inicio = $3, fecha_fin_estimada = $4, prioridad = $5 WHERE id_proyecto = $6 RETURNING *;`,
      [
        projectData.nombre,
        projectData.descripcion,
        projectData.fecha_inicio,
        projectData.fecha_fin_estimada,
        projectData.prioridad,
        projectData.id_proyecto,
      ]
    );
    return result.rows;
  } catch (error) {
    console.error("Error editing project:", error);
    throw error;
  }
};

const addRoleToProject = async (
  titulo,
  descripcion,
  nivel_experiencia_requerido,
  estado,
  id_proyecto,
  id_manager,
  id_habilidad,
  nivel_minimo_requerido,
  importancia
) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO recursos.rol (titulo, descripcion, nivel_experiencia_requerido, estado, id_proyecto, id_manager) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
      [
        titulo,
        descripcion,
        nivel_experiencia_requerido,
        estado,
        id_proyecto,
        id_manager,
      ]
    );

    await client.query(
      `INSERT INTO recursos.rol_habilidad (id_rol, id_habilidad, nivel_minimo_requerido, importancia) VALUES ($1, $2, $3, $4);`,
      [result.rows[0].id_rol, id_habilidad, nivel_minimo_requerido, importancia]
    );

    await client.query("COMMIT");

    return result.rows;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error adding role to project:", error);
    throw error;
  } finally {
    client.release();
  }
};

const getAllSkills = async () => {
  try {
    const result = await db.query(
      `
        SELECT recursos.habilidad.*
        FROM recursos.habilidad;
      `
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching all skills:", error);
    throw error;
  }
};

const getTeamMembers = async (id_proyecto) => {
  try {
    const result = await db.query(
      `
        SELECT vw_empleados_por_proyecto.* FROM vw_empleados_por_proyecto where id_proyecto = $1;
      `,
      [id_proyecto]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching team members:", error);
    throw error;
  }
};

const getProjectManager = async (id_manager) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await db.query(
      `
        SELECT m.id_manager
        FROM personas.manager m
        WHERE m.id_persona = $1;
      `,
      [id_manager]
    );
    const result2 = await db.query(
      `
        SELECT vw_manager_completo.* from vw_manager_completo where id_manager = $1;
      `,
      [result.rows[0].id_manager]
    );
    return result2.rows;
  } catch (error) {
    console.error("Error fetching project manager:", error);
    throw error;
  }
};

module.exports = {
  getUserRoleInProject,
  getUserProject,
  getUserSkillsInRole,
  getManagerProjects,
  getProjectRoles,
  getRoleAssignments,
  createProject,
  getBestCandidatesForRole,
  addRoleToProject,
  editProject,
  getAllSkills,
  getTeamMembers,
  getProjectManager,
};
