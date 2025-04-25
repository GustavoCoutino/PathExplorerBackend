const notificationsQueries = require("../db/queries/notificationsQueries");

const getUserNotifications = async (req, res) => {
  const id_persona = req.user.id_persona;
  try {
    const notifications = await notificationsQueries.getUserNotifications(
      id_persona
    );
    if (notifications.length === 0) {
      return res.status(200).json({
        hasNotifications: false,
        message: "No hay notificaciones para este usuario",
      });
    }
    res.status(200).json({
      hasNotifications: true,
      notifications,
    });
  } catch (error) {
    console.error("Error obteniendo notificaciones:", error);
    res.status(500).json({ message: "Error obteniendo notificaciones" });
  }
};

const markNotificationAsRead = async (req, res) => {
  const { id_notificacion } = req.body;
  try {
    const notification = await notificationsQueries.markNotificationAsRead(
      id_notificacion
    );
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notificación no encontrada",
      });
    }
    res.status(200).json({
      success: true,
      message: "Notificación marcada como leída",
      notification,
    });
  } catch (error) {
    console.error("Error marcando notificación como leída:", error);
    res.status(500).json({
      success: false,
      message: "Error marcando notificación como leída",
    });
  }
};
module.exports = {
  getUserNotifications,
  markNotificationAsRead,
};
