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
      SELECT
    e.id_empleado,
    SUM(COALESCE(
        CASE
            WHEN ph.nivel_demostrado >= rh.nivel_minimo_requerido THEN 100
            ELSE (ph.nivel_demostrado * 100.0 / rh.nivel_minimo_requerido)::NUMERIC(5,2)
        END, 0
    ) * rh.importancia) / SUM(rh.importancia) AS porcentaje_match,
    e.porcentaje_disponibilidad,
    CONCAT(p.nombre, ' ', p.apellido) AS nombre_completo,
    pf.puesto_actual
FROM recursos.rol_habilidad rh
CROSS JOIN personas.empleado e
LEFT JOIN personas.persona_habilidad ph ON ph.id_persona = e.id_persona AND ph.id_habilidad = rh.id_habilidad
JOIN personas.persona p ON e.id_persona = p.id_persona
JOIN personas.perfil pf ON p.id_persona = pf.id_persona
WHERE rh.id_rol = $1
GROUP BY e.id_empleado, e.porcentaje_disponibilidad, p.nombre, p.apellido, pf.puesto_actual
ORDER BY porcentaje_match DESC;
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

const editProjectRole = async (role) => {
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE recursos.rol SET titulo = $1, descripcion = $2, nivel_experiencia_requerido = $3 WHERE id_rol = $4 RETURNING *;`,
      [
        role.titulo,
        role.descripcion,
        role.nivel_experiencia_requerido,
        role.id_rol,
      ]
    );

    await client.query("COMMIT");

    return result.rows;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error editing project role:", error);
    throw error;
  } finally {
    client.release();
  }
};

const editProjectSkill = async (roles) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE recursos.rol_habilidad SET nivel_minimo_requerido = $1, importancia = $2 WHERE id_rol = $3 AND id_habilidad = $4 RETURNING *;`,
      [
        roles.nivel_minimo_requerido,
        roles.importancia,
        roles.id_rol,
        roles.id_habilidad,
      ]
    );

    await client.query("COMMIT");

    return result.rows;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error editing project skill:", error);
    throw error;
  } finally {
    client.release();
  }
};

const addRoleToProject = async (
  titulo,
  descripcion,
  nivel_experiencia_requerido,
  estado,
  id_proyecto,
  id_manager,
  habilidades
) => {
  const client = await db.pool.connect();

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

    const roleId = result.rows[0].id_rol;
    const skillPromises = habilidades.map((skill) =>
      client.query(
        `INSERT INTO recursos.rol_habilidad (id_rol, id_habilidad, nivel_minimo_requerido, importancia) VALUES ($1, $2, $3, $4);`,
        [
          roleId,
          skill.id_habilidad,
          skill.nivel_minimo_requerido,
          skill.importancia,
        ]
      )
    );
    await Promise.all(skillPromises);

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

const deleteRole = async (id_rol) => {
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `DELETE FROM recursos.rol WHERE id_rol = $1 RETURNING *;`,
      [id_rol]
    );

    const roleId = result.rows[0].id_rol;
    await client.query(
      `DELETE FROM recursos.rol_habilidad WHERE id_rol = $1;`,
      [roleId]
    );

    await client.query("COMMIT");

    return result.rows;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting role:", error);
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
  const client = await db.pool.connect();
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
  editProjectRole,
  editProjectSkill,
  deleteRole,
  getAllSkills,
  getTeamMembers,
  getProjectManager,
};
