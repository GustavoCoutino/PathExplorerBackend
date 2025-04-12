const db = require("./../pool");

const getAllEmployees = async () => {
  try {
    const result = await db.query(
      `
            SELECT personas.persona.*, personas.empleado.*, personas.perfil.* 
            FROM personas.persona
            JOIN personas.empleado ON personas.persona.id_persona = personas.empleado.id_persona
            JOIN personas.perfil ON personas.persona.id_persona = personas.perfil.id_persona;
        `
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};
module.exports = {
  getAllEmployees,
};
