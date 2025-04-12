const db = require("./../pool");

const createProject = async (
  nombre,
  descripcion,
  fecha_inicio,
  fecha_fin_estimada,
  fecha_fin_real,
  estado,
  prioridad,
  id_manager
) => {
  try {
    const result = await db.query(
      `
        INSERT INTO recursos.proyecto (
          nombre, descripcion, fecha_inicio, fecha_fin_estimada, fecha_fin_real, estado, prioridad, id_manager
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
      [
        nombre,
        descripcion,
        fecha_inicio,
        fecha_fin_estimada,
        fecha_fin_real,
        estado,
        prioridad,
        id_manager,
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

const editProject = async (
  id_proyecto,
  nombre,
  descripcion,
  fecha_inicio,
  fecha_fin_estimada,
  fecha_fin_real,
  estado,
  prioridad,
  id_manager
) => {
  try {
    const result = await db.query(
      `
        UPDATE recursos.proyecto
        SET nombre = $1, descripcion = $2, fecha_inicio = $3, fecha_fin_estimada = $4, fecha_fin_real = $5, estado = $6, prioridad = $7, id_manager = $8
        WHERE id_proyecto = $9
        RETURNING *
      `,
      [
        nombre,
        descripcion,
        fecha_inicio,
        fecha_fin_estimada,
        fecha_fin_real,
        estado,
        prioridad,
        id_manager,
        id_proyecto,
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error editing project:", error);
    throw error;
  }
};

const deleteProject = async (id_proyecto) => {
  try {
    const result = await db.query(
      `
        DELETE FROM recursos.proyecto
        WHERE id_proyecto = $1
        RETURNING *
      `,
      [id_proyecto]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

const getAllManagerProjects = async (id_manager) => {
  try {
    const result = await db.query(
      `
      SELECT * FROM recursos.proyecto WHERE id_manager = $1
        `[id_manager]
    );
    return result.rows || [];
  } catch (error) {
    console.error("Error getting all projects:", error);
    throw error;
  }
};

const getAllRoles = async () => {
  try {
    const result = await db.query(
      `
            SELECT * FROM recursos.rol
        `
    );
    return result.rows || [];
  } catch (error) {
    console.error("Error getting all roles:", error);
    throw error;
  }
};

const getAllAbilities = async () => {
  try {
    const result = await db.query(
      `
                SELECT * FROM recursos.habilidad
            `
    );
    return result.rows || [];
  } catch (error) {
    console.error("Error getting all abilities:", error);
    throw error;
  }
};

const createProjectRole = async (
  id_proyecto,
  id_rol,
  nivel_minimo,
  importancia
) => {
  try {
    const result = await db.query(
      `
            INSERT INTO recursos.rol_habilidad (id_proyecto, id_rol, nivel_minimo, importancia)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `,
      [id_proyecto, id_rol, nivel_minimo, importancia]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error creating project role:", error);
    throw error;
  }
};

const editProjectRole = async (
  id_proyecto,
  id_rol,
  nivel_minimo,
  importancia
) => {
  try {
    const result = await db.query(
      `
                UPDATE recursos.rol_habilidad
                SET nivel_minimo = $1, importancia = $2
                WHERE id_proyecto = $3 AND id_rol = $4
                RETURNING *
            `,
      [nivel_minimo, importancia, id_proyecto, id_rol]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error editing project role:", error);
    throw error;
  }
};

const deleteProjectRole = async (id_proyecto, id_rol) => {
  try {
    const result = await db.query(
      `
                    DELETE FROM recursos.rol_habilidad
                    WHERE id_proyecto = $1 AND id_rol = $2
                    RETURNING *
                `,
      [id_proyecto, id_rol]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error deleting project role:", error);
    throw error;
  }
};

module.exports = {
  createProject,
  editProject,
  deleteProject,
  getAllManagerProjects,
  getAllRoles,
  getAllAbilities,
  createProjectRole,
  editProjectRole,
  deleteProjectRole,
};
