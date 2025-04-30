const requestQueries = require("../db/queries/requestQueries");
const userQueries = require("../db/queries/userQueries");

async function getAssignmentRequests(req, res) {
  const { id_persona } = req.user;
  const role = await userQueries.determineUserType(id_persona);
  const id_administrador = role.roleData.id_administrador;

  try {
    const requests = await requestQueries.getAssignmentRequests(
      id_administrador
    );
    if (requests.length === 0) {
      return res.status(200).json({
        hasRequests: false,
        message: "No hay solicitudes de asignación",
      });
    }
    res.status(200).json({
      hasRequests: true,
      requests: requests,
    });
  } catch (error) {
    console.error("Error obteniendo solicitudes de asignación:", error);
    res
      .status(500)
      .json({ message: "Error obteniendo solicitudes de asignación" });
  }
}

async function createAssignmentRequest(req, res) {
  const {
    id_administrador,
    id_empleado,
    id_rol,
    fecha_solicitud,
    justificacion,
    urgencia,
    estado,
    comentarios_resolucion,
    fecha_resolucion,
    fecha_creacion,
    fecha_actualizacion,
  } = req.body;
  const { id_persona } = req.user;
  const role = await userQueries.determineUserType(id_persona);
  const id_manager = role.roleData.id_manager;

  try {
    const newRequest = await requestQueries.createAssignmentRequest(
      id_manager,
      id_administrador,
      id_empleado,
      id_rol,
      fecha_solicitud,
      justificacion,
      urgencia,
      estado,
      comentarios_resolucion,
      fecha_resolucion,
      fecha_creacion,
      fecha_actualizacion
    );
    res.status(201).json({
      message: "Solicitud de asignación creada exitosamente",
      newRequest: newRequest[0],
    });
  } catch (error) {
    console.error("Error creando solicitud de asignación:", error);
    res.status(500).json({ message: "Error creando solicitud de asignación" });
  }
}

async function updateAssignmentRequest(req, res) {
  const { id_solicitud, estado, comentarios_resolucion } = req.body;

  try {
    await requestQueries.endAssignmentRequest(
      id_solicitud,
      estado,
      comentarios_resolucion
    );
    res.status(200).json({
      message: "Solicitud de asignación finalizada exitosamente",
    });
  } catch (error) {
    console.error("Error actualizando solicitud de asignación:", error);
    res
      .status(500)
      .json({ message: "Error actualizando solicitud de asignación" });
  }
}

async function getAllAdministratorsForRequest(req, res) {
  try {
    const administrators = await requestQueries.getAllAdministrators();
    if (administrators.length === 0) {
      return res.status(200).json({
        hasRequests: false,
        message: "No hay administradores disponibles",
      });
    }
    res.status(200).json({
      hasRequests: true,
      administrators: administrators,
    });
  } catch (error) {
    console.error("Error obteniendo administradores:", error);
    res.status(500).json({ message: "Error obteniendo administradores" });
  }
}

module.exports = {
  getAssignmentRequests,
  createAssignmentRequest,
  updateAssignmentRequest,
  getAllAdministratorsForRequest,
};
