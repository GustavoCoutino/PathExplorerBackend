const db = require("./../pool");

const getAssignmentRequests = async (id_administrador) => {
  try {
    const result = await db.query(
      `
            SELECT evaluacion.solicitud_asignacion.* 
            FROM evaluacion.solicitud_asignacion
            WHERE id_administrador = $1 
        `,
      [id_administrador]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching assignment requests:", error);
    throw error;
  }
};

const createAssignmentRequest = async (
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
) => {
  try {
    const result = await db.query(
      `
            INSERT INTO evaluacion.solicitud_asignacion (
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
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *;
        `,
      [
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
        fecha_actualizacion,
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error creating assignment request:", error);
    throw error;
  }
};

const endAssignmentRequest = async (
  id_solicitud,
  estado,
  comentarios_resolucion
) => {
  try {
    const result = await db.query(
      `
                UPDATE evaluacion.solicitud_asignacion
                SET estado = $1,
                    comentarios_resolucion = $2,
                    fecha_resolucion = NOW()
                WHERE id_solicitud = $3
            `,
      [estado, comentarios_resolucion, id_solicitud]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error ending assignment request:", error);
    throw error;
  }
};

module.exports = {
  getAssignmentRequests,
  createAssignmentRequest,
  endAssignmentRequest,
};
