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

async function createAssignmentRequestEmployee(req, res) {
  const {
    id_administrador,
    id_manager,
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
  const manager = await requestQueries.findManagerById(id_manager);
  const real_id_manager = manager ? manager.id_manager : null;
  const real_id_empleado = await userQueries.findEmpleadoIdByPersonaId(
    id_empleado
  );
  try {
    const newRequest = await requestQueries.createAssignmentRequest(
      id_administrador,
      real_id_manager,
      real_id_empleado,
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
      newRequest: newRequest,
    });
  } catch (error) {
    console.error("Error creando solicitud de asignación:", error);
    res.status(500).json({ message: "Error creando solicitud de asignación" });
  }
}

async function createAssignmentRequestManager(req, res) {
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
  const manager = await requestQueries.findManagerById(id_persona);
  const id_manager = manager ? manager.id_manager : null;
  const real_id_empleado = await userQueries.findEmpleadoIdByPersonaId(
    id_empleado
  );
  try {
    const newRequest = await requestQueries.createAssignmentRequest(
      id_administrador,
      id_manager,
      real_id_empleado,
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
      newRequest: newRequest,
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

async function findIfEmployeeHasPendingAssignmentRequest(req, res) {
  try {
    const { id_persona } = req.user;
    const result =
      await requestQueries.getIfEmployeeHasPendingAssignmentRequest(id_persona);
    res.status(200).json({
      hasPendingRequest: result,
      message: result
        ? "El empleado tiene una solicitud pendiente"
        : "El empleado no tiene solicitudes pendientes",
    });
  } catch (error) {
    console.error("Error verificando solicitudes pendientes:", error);
    res
      .status(500)
      .json({ message: "Error verificando solicitudes pendientes" });
  }
}

module.exports = {
  getAssignmentRequests,
  createAssignmentRequestEmployee,
  createAssignmentRequestManager,
  updateAssignmentRequest,
  getAllAdministratorsForRequest,
  findIfEmployeeHasPendingAssignmentRequest,
};
