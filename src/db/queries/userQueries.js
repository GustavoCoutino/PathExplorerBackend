const db = require("./../pool");

const findUserByEmail = async (email) => {
  try {
    const result = await db.query(
      "SELECT * FROM personas.persona WHERE email = $1",
      [email]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error finding user by email:", error);
    throw error;
  }
};

const findUserById = async (id_persona) => {
  try {
    const result = await db.query(
      "SELECT * FROM personas.persona WHERE id_persona = $1",
      [id_persona]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error finding user by id:", error);
    throw error;
  }
};

const findEmpleadoIdByPersonaId = async (id_persona) => {
  try {
    const result = await db.query(
      "SELECT id_empleado FROM personas.empleado WHERE id_persona = $1",
      [id_persona]
    );
    return result.rows[0] ? result.rows[0].id_empleado : null;
  } catch (error) {
    console.error("Error finding empleado id by persona id:", error);
    throw error;
  }
};

const determineUserType = async (id_persona) => {
  try {
    const adminResult = await db.query(
      "SELECT * FROM personas.administrador WHERE id_persona = $1",
      [id_persona]
    );

    if (adminResult.rows.length > 0) {
      return {
        role: "administrador",
        roleData: adminResult.rows[0],
      };
    }

    const managerResult = await db.query(
      "SELECT * FROM personas.manager WHERE id_persona = $1",
      [id_persona]
    );

    if (managerResult.rows.length > 0) {
      return {
        role: "manager",
        roleData: managerResult.rows[0],
      };
    }

    const employeeResult = await db.query(
      "SELECT * FROM personas.empleado WHERE id_persona = $1",
      [id_persona]
    );

    if (employeeResult.rows.length > 0) {
      return {
        role: "empleado",
        roleData: employeeResult.rows[0],
      };
    }

    return {
      role: "usuario",
      roleData: null,
    };
  } catch (error) {
    console.error("Error determining user type:", error);
    throw error;
  }
};

const getUserProfile = async (id_persona) => {
  try {
    const result = await db.query(
      "SELECT * FROM personas.perfil WHERE id_persona = $1",
      [id_persona]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

const createUser = async (userData) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const result = await db.query(
      `
      INSERT INTO personas.persona (nombre, apellido, email, password_hash, fecha_contratacion)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_persona
    `,
      [
        userData.nombre,
        userData.apellido,
        userData.email,
        userData.password_hash,
        userData.fecha_contratacion,
      ]
    );

    const id_persona = result.rows[0].id_persona;

    await db.query(
      `
      INSERT INTO personas.perfil (id_persona, puesto_actual, antiguedad, historial_profesional)
      VALUES ($1, $2, $3, $4)
      RETURNING id_perfil
    `,
      [
        id_persona,
        userData.puesto_actual,
        userData.antiguedad,
        userData.historial_profesional,
      ]
    );

    await client.query("COMMIT");
    return { id_persona, message: "Usuario creado con éxito" };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating user:", error);
    throw error;
  }
};

const createEmpleado = async (userData) => {
  try {
    await db.query(
      `
      INSERT INTO personas.empleado (id_persona, estado, porcentaje_disponibilidad)
      VALUES ($1, $2, $3);
    `,
      [userData.id_persona, userData.estado, userData.porcentaje_disponibilidad]
    );

    return {
      id_persona: userData.id_persona,
      message: "Empleado creado con éxito",
    };
  } catch (error) {
    console.error("Error creating empleado:", error);
    throw error;
  }
};

const createManager = async (userData) => {
  try {
    await db.query(
      `
      INSERT INTO personas.manager (id_persona, area_responsabilidad, nivel_autorizacion)
      VALUES ($1, $2, 5)
    `,
      [userData.id_persona, userData.area_responsabilidad]
    );

    return {
      id_persona: userData.id_persona,
      message: "Manager creado con éxito",
    };
  } catch (error) {
    console.error("Error creating manager:", error);
    throw error;
  }
};

const createAdministrador = async (userData) => {
  try {
    await db.query(
      `
      INSERT INTO personas.administrador (id_persona, departamento, nivel_acceso)
      VALUES ($1, $2, 5)
    `,
      [userData.id_persona, userData.departamento]
    );

    return {
      id_persona: userData.id_persona,
      message: "Administrador creado con éxito",
    };
  } catch (error) {
    console.error("Error creating administrador:", error);
    throw error;
  }
};

const editUserProfile = async (id_persona, profileData) => {
  try {
    const { nombre, apellido, correo, cargo } = profileData;

    const personaResult = await db.query(
      `
      UPDATE personas.persona 
      SET nombre = $1, apellido = $2, email = $3
      WHERE id_persona = $4
      RETURNING id_persona, nombre, apellido, email
    `,
      [nombre, apellido, correo, id_persona]
    );

    const perfilResult = await db.query(
      `
      UPDATE personas.perfil
      SET puesto_actual = $1
      WHERE id_persona = $2
      RETURNING id_perfil, puesto_actual
    `,
      [cargo, id_persona]
    );

    return {
      persona: personaResult.rows[0],
      perfil: perfilResult.rows[0],
      message: "Perfil actualizado con éxito",
    };
  } catch (error) {
    console.error("Error al actualizar el perfil del usuario:", error);
    throw error;
  }
};

const editUserPassword = async (id_persona, newPassword) => {
  try {
    const result = await db.query(
      `
      UPDATE personas.persona 
      SET password_hash = $1
      WHERE id_persona = $2
      RETURNING id_persona
    `,
      [newPassword, id_persona]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error("Error updating user password:", error);
    throw error;
  }
};

const getUserCertifications = async (id_persona) => {
  try {
    const result = await db.query(
      `
      SELECT c.ID_Certificacion, c.Nombre, c.Institucion, c.Validez, c.Nivel, pc.fecha_obtencion, pc.fecha_vencimiento, pc.estado_validacion, pc.fecha_creacion
      FROM desarrollo.certificacion c
      JOIN desarrollo.persona_certificacion pc ON c.ID_Certificacion = pc.ID_Certificacion
      WHERE pc.ID_Persona = $1
      `,
      [id_persona]
    );
    return result.rows || [];
  } catch (error) {
    console.error("SQL Error getting user certifications:", error);
    throw error;
  }
};

const getUserCourses = async (id_persona) => {
  try {
    const result = await db.query(
      `
      SELECT c.id_curso, c.nombre, c.Institucion, c.descripcion, c.duracion, c.modalidad, c.categoria, pc.fecha_inicio, pc.fecha_finalizacion, pc.calificacion, pc.certificado, pc.fecha_creacion, pc.progreso
      FROM desarrollo.curso c
      JOIN desarrollo.persona_curso pc ON c.id_curso = pc.id_curso
      WHERE pc.id_persona = $1
      `,
      [id_persona]
    );
    return result.rows || [];
  } catch (error) {
    console.error("Error getting user courses:", error);
    throw error;
  }
};

const getUserProfessionalHistory = async (id_persona) => {
  try {
    const result = await db.query(
        `
          SELECT
            p.nombre,           -- ← minúscula
            p.apellido,         -- ← minúscula  
            pf.historial_profesional,  -- ← snake_case
            pf.puesto_actual AS role,  -- ← snake_case
            m.descripcion AS achievements
          FROM
            personas.persona p
              JOIN
            personas.perfil pf ON p.id_persona = pf.id_persona  -- ← Corregido el JOIN
              LEFT JOIN
            desarrollo.meta_profesional m ON p.id_persona = m.id_persona
          WHERE
            p.id_persona = $1
        `,
        [id_persona]
    );

    console.log('SQL Query Result:', result.rows); // ← Debug log
    return result.rows || [];
  } catch (error) {
    console.error("Error getting user professional history:", error);
    throw error;
  }
};

const getUserSkills = async (id_persona) => {
  try {
    const result = await db.query(
      `
      SELECT 
          ps.*, h.*
      FROM 
          personas.persona_habilidad ps
      JOIN 
          recursos.habilidad h ON h.id_habilidad = ps.id_habilidad
      WHERE 
          ps.id_persona = $1
      `,
      [id_persona]
    );
    return result.rows || [];
  } catch (error) {
    console.error("Error getting user skills:", error);
    throw error;
  }
};

const getUserTrajectory = async (id_persona) => {
  try {
    const result = await db.query(
      `
      SELECT 
          pt.*, tc.*
      FROM 
          desarrollo.persona_trayectoria pt
      JOIN 
          personas.PERFIL pf ON pt.ID_Persona = pf.ID_Perfil
      LEFT JOIN
          desarrollo.trayectoria_carrera tc ON pt.id_trayectoria = tc.id_trayectoria
      WHERE
          pt.id_persona = $1
      `,
      [id_persona]
    );
    return result.rows || [];
  } catch (error) {
    console.error("Error getting user trajectory:", error);
    throw error;
  }
};

const getUserProfessionalGoals = async (id_persona) => {
  try {
    const result = await db.query(
      `
      SELECT 
          mp.*
      FROM 
          desarrollo.meta_profesional mp
      WHERE
          mp.id_persona = $1
      `,
      [id_persona]
    );
    return result.rows || [];
  } catch (error) {
    console.error("Error getting user professional goals:", error);
    throw error;
  }
};

module.exports = {
  findUserByEmail,
  findUserById,
  findEmpleadoIdByPersonaId,
  determineUserType,
  getUserProfile,
  editUserProfile,
  editUserPassword,
  createUser,
  createEmpleado,
  createManager,
  createAdministrador,
  getUserCertifications,
  getUserCourses,
  getUserProfessionalHistory,
  getUserSkills,
  getUserTrajectory,
  getUserProfessionalGoals,
};
