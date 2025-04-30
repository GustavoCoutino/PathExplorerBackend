const db = require("./../pool");

const getAssignmentRequests = async (id_administrador) => {
  try {
    const result = await db.query(
      `
            SELECT 
            sa.*,
            p.nombre AS nombre_solicitante,
            pr.nombre AS nombre_proyecto
        FROM 
            evaluacion.solicitud_asignacion sa
        JOIN 
            personas.manager m ON sa.id_manager = m.id_manager
        JOIN 
            personas.persona p ON m.id_persona = p.id_persona
        JOIN 
            recursos.rol r ON sa.id_rol = r.id_rol
        JOIN 
            recursos.proyecto pr ON r.id_proyecto = pr.id_proyecto
        WHERE 
            sa.id_administrador = $1
        `,
      [id_administrador]
    );
    return result.rows || null;
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

const getAllAdministrators = async () => {
  try {
    const result = await db.query(
      `
            SELECT 
                personas.administrador.*, CONCAT(personas.persona.nombre, ' ', personas.persona.apellido) AS nombre_completo
            FROM 
                personas.administrador
            JOIN 
                personas.persona ON personas.administrador.id_persona = personas.persona.id_persona;
        `
    );
    return result.rows || null;
  } catch (error) {
    console.error("Error fetching administrators:", error);
    throw error;
  }
};

module.exports = {
  getAssignmentRequests,
  createAssignmentRequest,
  endAssignmentRequest,
  getAllAdministrators,
};
