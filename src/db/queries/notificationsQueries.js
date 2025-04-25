const db = require("./../pool");

const getUserNotifications = async (id_persona) => {
  try {
    const result = await db.query(
      `
            SELECT n.id_notificacion, n.id_persona, n.tipo, n.titulo, n.mensaje, n.prioridad, n.leida, n.fecha_lectura, n.fecha_creacion    
            FROM sistema.notificaciones n
            WHERE n.id_persona = $1
            ORDER BY n.fecha_creacion DESC, n.prioridad DESC;
        `,
      [id_persona]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    throw error;
  }
};

const markNotificationAsRead = async (id_notificacion) => {
  try {
    const result = await db.query(
      `
            UPDATE sistema.notificaciones
            SET leida = true, fecha_lectura = NOW()
            WHERE id_notificacion = $1
            RETURNING *;
        `,
      [id_notificacion]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
};
