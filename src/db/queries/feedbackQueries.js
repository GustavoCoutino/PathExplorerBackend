const db = require("../pool");

const getEvaluacionesManager = async (id) => {
  try {
    const result = await db.query(
      `
            SELECT e.id_evaluacion, e.id_empleado, e.id_manager, e.fecha, e.areas_mejora, e.calificacion, e.id_proyecto, e.comentarios, e.fortalezas FROM evaluacion.evaluacion_desempeno e WHERE id_manager = $1;
        `,
      [id]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching manager evaluations:", error);
    throw error;
  }
};

const getEvaluacionesEmpleado = async (id) => {
  try {
    const result = await db.query(
      `
            SELECT e.id_evaluacion, e.id_empleado, e.id_manager, e.fecha, e.areas_mejora, e.calificacion, e.id_proyecto, e.comentarios, e.fortalezas FROM evaluacion.evaluacion_desempeno e WHERE id_empleado = $1;
        `,
      [id]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching employee evaluations:", error);
    throw error;
  }
};

const getEvaluacionesTodas = async () => {
  try {
    const result = await db.query(
      `
            SELECT e.id_evaluacion, e.id_empleado, e.id_manager, e.fecha, e.areas_mejora, e.calificacion, e.id_proyecto, e.comentarios, e.fortalezas FROM evaluacion.evaluacion_desempeno e;
        `
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching all evaluations:", error);
    throw error;
  }
};
const createEvaluacion = async (
  id_empleado,
  id_manager,
  fecha,
  areas_mejora,
  calificacion,
  id_proyecto,
  comentarios,
  fortalezas
) => {
  try {
    const result = await db.query(
      `
                INSERT INTO evaluacion.evaluacion_desempeno (id_empleado, id_manager, fecha, areas_mejora, calificacion, id_proyecto, comentarios, fortalezas)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *;
            `,
      [
        id_empleado,
        id_manager,
        fecha,
        areas_mejora,
        calificacion,
        id_proyecto,
        comentarios,
        fortalezas,
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error creating evaluation:", error);
    throw error;
  }
};

module.exports = {
  getEvaluacionesManager,
  getEvaluacionesEmpleado,
  getEvaluacionesTodas,
  createEvaluacion,
};
