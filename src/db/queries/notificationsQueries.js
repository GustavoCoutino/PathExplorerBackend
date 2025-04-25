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

const addNotificationToCertificates = async () => {
  try {
    const result = await db.query(
      `
            INSERT INTO sistema.notificaciones (id_persona, tipo, titulo, mensaje, prioridad, leida, fecha_lectura, fecha_creacion)
            SELECT * FROM vw_certificaciones_por_vencer
            ;
        `
    );
    return result.rowCount;
  } catch (error) {
    console.error("Error adding notification to certificates:", error);
    throw error;
  }
};

const addCertificationNotifications = async () => {
  try {
    const result = await db.query(
      `
      INSERT INTO sistema.notificaciones (id_persona, tipo, titulo, mensaje, prioridad, leida, fecha_creacion)
      SELECT 
        v.id_persona,
        CASE 
          WHEN v.estado = 'VENCIDA' THEN 'certificacion_vencida'
          WHEN v.estado = 'POR VENCER' THEN 'certificacion_por_vencer'
          WHEN v.estado = 'VIGENTE' AND (v.fecha_vencimiento - CURRENT_DATE) = 30 THEN 'certificacion_30_dias'
          WHEN v.estado = 'VIGENTE' AND (v.fecha_vencimiento - CURRENT_DATE) = 60 THEN 'certificacion_60_dias'
          WHEN v.estado = 'VIGENTE' AND (v.fecha_vencimiento - CURRENT_DATE) = 90 THEN 'certificacion_90_dias'
          ELSE 'certificacion_estado'
        END as tipo,
        CASE 
          WHEN v.estado = 'VENCIDA' THEN 'Certificación vencida'
          WHEN v.estado = 'POR VENCER' THEN 'Certificación por vencer pronto'
          WHEN v.estado = 'VIGENTE' AND (v.fecha_vencimiento - CURRENT_DATE) = 30 THEN 'Certificación vence en 30 días'
          WHEN v.estado = 'VIGENTE' AND (v.fecha_vencimiento - CURRENT_DATE) = 60 THEN 'Certificación vence en 60 días'
          WHEN v.estado = 'VIGENTE' AND (v.fecha_vencimiento - CURRENT_DATE) = 90 THEN 'Certificación vence en 90 días'
          ELSE 'Estado de certificación'
        END as titulo,
        CASE 
          WHEN v.estado = 'VENCIDA' THEN 'Tu certificación ' || v.certificacion || ' ha vencido el ' || TO_CHAR(v.fecha_vencimiento, 'DD/MM/YYYY') || '. Por favor, renuévala lo antes posible.'
          WHEN v.estado = 'POR VENCER' THEN 'Tu certificación ' || v.certificacion || ' vencerá el ' || TO_CHAR(v.fecha_vencimiento, 'DD/MM/YYYY') || '. Por favor, realiza los trámites necesarios para renovarla.'
          WHEN v.estado = 'VIGENTE' AND (v.fecha_vencimiento - CURRENT_DATE) = 30 THEN 'Tu certificación ' || v.certificacion || ' vencerá en 30 días (' || TO_CHAR(v.fecha_vencimiento, 'DD/MM/YYYY') || '). Planifica su renovación pronto.'
          WHEN v.estado = 'VIGENTE' AND (v.fecha_vencimiento - CURRENT_DATE) = 60 THEN 'Tu certificación ' || v.certificacion || ' vencerá en 60 días (' || TO_CHAR(v.fecha_vencimiento, 'DD/MM/YYYY') || '). Recuerda que deberás renovarla.'
          WHEN v.estado = 'VIGENTE' AND (v.fecha_vencimiento - CURRENT_DATE) = 90 THEN 'Tu certificación ' || v.certificacion || ' vencerá en 90 días (' || TO_CHAR(v.fecha_vencimiento, 'DD/MM/YYYY') || '). Te recomendamos comenzar a planificar su renovación.'
          ELSE 'Certificación ' || v.certificacion || ' - Estado: ' || v.estado || ' - Fecha vencimiento: ' || TO_CHAR(v.fecha_vencimiento, 'DD/MM/YYYY')
        END as mensaje,
        CASE 
          WHEN v.estado = 'VENCIDA' THEN 'alta'
          WHEN v.estado = 'POR VENCER' THEN 'alta'
          WHEN v.estado = 'VIGENTE' AND (v.fecha_vencimiento - CURRENT_DATE) = 30 THEN 'alta'
          WHEN v.estado = 'VIGENTE' AND (v.fecha_vencimiento - CURRENT_DATE) = 60 THEN 'media'
          WHEN v.estado = 'VIGENTE' AND (v.fecha_vencimiento - CURRENT_DATE) = 90 THEN 'baja'
          ELSE 'media'
        END as prioridad,
        FALSE as leida,
        CURRENT_TIMESTAMP as fecha_creacion
      FROM vw_certificaciones_por_vencer v
      WHERE 
        (
          v.estado = 'VENCIDA' OR
          v.estado = 'POR VENCER' OR
          (v.estado = 'VIGENTE' AND (v.fecha_vencimiento - CURRENT_DATE) IN (30, 60, 90))
        )
        AND NOT EXISTS (
          SELECT 1 FROM sistema.notificaciones n 
          WHERE n.id_persona = v.id_persona 
          AND n.mensaje LIKE '%' || v.certificacion || '%'
          AND n.fecha_creacion > CURRENT_DATE - INTERVAL '3 days'
        )
      `
    );

    return {
      totalCount: result.rowCount,
      message: `${result.rowCount} notifications created for certifications`,
    };
  } catch (error) {
    console.error("Error adding certification notifications:", error);
    throw error;
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  addNotificationToCertificates,
};
