const db = require("../pool");

const addTrayectoryWithUser = async (
  nombre,
  descripcion,
  roles_secuenciales,
  tiempo_estimado,
  id_persona
) => {
  const client = await db.pool.connect();

  try {
    await client.query("BEGIN");

    const trajectoryResult = await client.query(
      `INSERT INTO desarrollo.trayectoria_carrera (nombre, descripcion, roles_secuenciales, tiempo_estimado)
             VALUES ($1, $2, $3, $4)
             RETURNING *;`,
      [nombre, descripcion, roles_secuenciales, tiempo_estimado]
    );

    const trajectory = trajectoryResult.rows[0];

    const userTrajectoryResult = await client.query(
      `INSERT INTO desarrollo.persona_trayectoria (id_persona, id_trayectoria, progreso, etapa_actual)
             VALUES ($1, $2, 0, 'Fase inicial')
             RETURNING *;`,
      [id_persona, trajectory.id_trayectoria]
    );

    await client.query("COMMIT");

    return {
      trajectory: trajectory,
      userTrajectory: userTrajectoryResult.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in transaction:", error);
    throw error;
  } finally {
    client.release();
  }
};

const getUserTrayectoria = async (id_persona) => {
  const client = await db.pool.connect();

  try {
    const result = await client.query(
      `SELECT pt.id_persona, pt.id_trayectoria, t.nombre, t.descripcion, t.roles_secuenciales, t.tiempo_estimado, pt.progreso, pt.etapa_actual
         FROM desarrollo.persona_trayectoria pt
         JOIN desarrollo.trayectoria_carrera t ON pt.id_trayectoria = t.id_trayectoria
         WHERE pt.id_persona = $1;`,
      [id_persona]
    );

    return result.rows;
  } catch (error) {
    console.error("Error fetching user trayectorias:", error);
    throw error;
  } finally {
    client.release();
  }
};

const getAvailableRoles = async () => {
  const client = await db.pool.connect();

  try {
    const result = await client.query(
      `SELECT recursos.rol.id_rol, recursos.rol.titulo, recursos.rol.descripcion, recursos.rol.nivel_experiencia_requerido, recursos.rol.id_proyecto, id_manager  
         FROM recursos.rol where recursos.rol.estado = 'ABIERTO';`
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching available roles:", error);
    throw error;
  } finally {
    client.release();
  }
};

const getProjectByProjectId = async (id_rol) => {
  const client = await db.pool.connect();

  try {
    const result = await client.query(
      `SELECT recursos.proyecto.id_proyecto, recursos.proyecto.nombre, recursos.proyecto.descripcion, recursos.proyecto.fecha_inicio, recursos.proyecto.fecha_fin_estimada, recursos.proyecto.estado FROM recursos.proyecto WHERE recursos.proyecto.id_proyecto = $1;`,
      [id_rol]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  } finally {
    client.release();
  }
};

const getRoleSkills = async (id_rol) => {
  const client = await db.pool.connect();

  try {
    const result = await client.query(
      `SELECT recursos.habilidad.id_habilidad, recursos.habilidad.nombre, recursos.habilidad.categoria, recursos.habilidad.descripcion, recursos.rol_habilidad.nivel_minimo_requerido, recursos.rol_habilidad.importancia
         FROM recursos.rol_habilidad
         JOIN recursos.habilidad ON rol_habilidad.id_habilidad = habilidad.id_habilidad
         WHERE rol_habilidad.id_rol = $1;`,
      [id_rol]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching role skills:", error);
    throw error;
  } finally {
    client.release();
  }
};

const getManager = async (id_persona) => {
  const client = await db.pool.connect();

  try {
    const result = await client.query(
      `SELECT personas.persona.id_persona, personas.persona.nombre, personas.persona.apellido, personas.persona.email
         FROM personas.persona
         WHERE personas.persona.id_persona = $1;`,
      [id_persona]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching manager:", error);
    throw error;
  } finally {
    client.release();
  }
};

const getUniqueCategoriesCourses = async () => {
  try {
    const result = await db.query(
      `SELECT DISTINCT desarrollo.curso.categoria FROM desarrollo.curso;`
    );
    return result.rows.map((row) => row.categoria);
  } catch (error) {
    console.error("Error fetching unique categories:", error);
    throw error;
  }
};

const getUniqueInstitutionsCourses = async () => {
  try {
    const result = await db.query(
      `SELECT DISTINCT institucion FROM desarrollo.curso;`
    );
    return result.rows.map((row) => row.institucion);
  } catch (error) {
    console.error("Error fetching unique institutions:", error);
    throw error;
  }
};

const getUniqueInstitutionsCertifications = async () => {
  try {
    const result = await db.query(
      `SELECT DISTINCT institucion FROM desarrollo.certificacion;`
    );
    return result.rows.map((row) => row.institucion);
  } catch (error) {
    console.error("Error fetching unique institutions:", error);
    throw error;
  }
};

module.exports = {
  addTrayectoryWithUser,
  getUserTrayectoria,
  getAvailableRoles,
  getProjectByProjectId,
  getRoleSkills,
  getManager,
  getUniqueCategoriesCourses,
  getUniqueInstitutionsCourses,
  getUniqueInstitutionsCertifications,
};
