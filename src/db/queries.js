const db = require("./pool");

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
        role: "administrator",
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
        role: "employee",
        roleData: employeeResult.rows[0],
      };
    }

    return {
      role: "user",
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

module.exports = {
  findUserByEmail,
  findUserById,
  determineUserType,
  getUserProfile,
};
