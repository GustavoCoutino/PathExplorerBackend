const db = require("../pool");

const addTrayectoryWithUser = async (
  nombre,
  descripcion,
  roles_secuenciales,
  tiempo_estimado,
  id_persona
) => {
  const client = await db.connect();

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
  const client = await db.connect();

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

module.exports = {
  addTrayectoryWithUser,
  getUserTrayectoria,
};
