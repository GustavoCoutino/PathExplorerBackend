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
      SELECT c.id_curso, c.nombre, c.Institucion, c.descripcion, c.duracion, c.modalidad, pc.fecha_inicio, pc.fecha_finalizacion, pc.calificacion, pc.certificado, pc.fecha_creacion
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
          p.Nombre,
          p.Apellido,
          pf.Historial_Profesional,
          pf.Puesto_Actual AS Role,
          m.Descripcion AS Achievements
      FROM 
          personas.PERSONA p
      JOIN 
          personas.PERFIL pf ON p.ID_Persona = pf.ID_Perfil
      LEFT JOIN
          desarrollo.META_PROFESIONAL m ON p.ID_Persona = m.ID_Meta
      WHERE
          p.ID_Persona = $1
      `,
      [id_persona]
    );
    return result.rows || [];
  } catch (error) {
    console.error("Error getting user professional history:", error);
    throw error;
  }
};

module.exports = {
  findUserByEmail,
  findUserById,
  determineUserType,
  getUserProfile,
  editUserProfile,
  getUserCertifications,
  getUserCourses,
  getUserProfessionalHistory,
};
