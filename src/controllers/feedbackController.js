const feedbackQueries = require("../db/queries/feedbackQueries");
const userQueries = require("../db/queries/userQueries");
const recommendationsQueries = require("../db/queries/recommendationsQueries");

const getEvaluacionesManager = async (req, res) => {
  const { id_persona } = req.user;
  const roleData = await userQueries.determineUserType(id_persona);
  const id_manager = roleData.roleData.id_manager;
  try {
    const evaluaciones = await feedbackQueries.getEvaluacionesManager(
      id_manager
    );

    if (evaluaciones.length === 0) {
      return res.status(200).json({
        hasEvaluaciones: false,
        evaluaciones: [],
      });
    }

    const evaluacionesConProyecto = await Promise.all(
      evaluaciones.map(async (evaluacion) => {
        const proyecto = await recommendationsQueries.getProjectByProjectId(
          evaluacion.id_proyecto
        );
        return {
          ...evaluacion,
          proyecto_nombre: proyecto[0].nombre,
        };
      })
    );

    res.status(200).json({
      hasEvaluaciones: true,
      evaluaciones: evaluacionesConProyecto,
    });
  } catch (error) {
    console.error("Error obteniendo evaluaciones del manager:", error);
    res.status(500).json({ message: "Error obteniendo evaluaciones" });
  }
};

const getEvaluacionesEmpleado = async (req, res) => {
  const { id_persona } = req.user;
  const roleData = await userQueries.determineUserType(id_persona);
  const id_empleado = roleData.roleData.id_empleado;
  try {
    const evaluaciones = await feedbackQueries.getEvaluacionesEmpleado(
      id_empleado
    );
    if (evaluaciones.length === 0) {
      return res.status(200).json({
        hasEvaluaciones: false,
        evaluaciones: [],
      });
    }
    const evaluacionesConProyecto = await Promise.all(
      evaluaciones.map(async (evaluacion) => {
        const proyecto = await recommendationsQueries.getProjectByProjectId(
          evaluacion.id_proyecto
        );
        return {
          ...evaluacion,
          proyecto: proyecto[0].nombre,
        };
      })
    );

    res.status(200).json({
      hasEvaluaciones: true,
      evaluaciones: evaluacionesConProyecto,
    });
  } catch (error) {
    console.error("Error obteniendo evaluaciones del empleado:", error);
    res.status(500).json({ message: "Error obteniendo evaluaciones" });
  }
};

const getEvaluacionesAdministrador = async (req, res) => {
  try {
    const evaluaciones = await feedbackQueries.getEvaluacionesTodas();
    if (evaluaciones.length === 0) {
      return res.status(200).json({
        hasEvaluaciones: false,
        evaluaciones: [],
      });
    }
    const evaluacionesConProyecto = await Promise.all(
      evaluaciones.map(async (evaluacion) => {
        const proyecto = await recommendationsQueries.getProjectByProjectId(
          evaluacion.id_proyecto
        );
        return {
          ...evaluacion,
          proyecto: proyecto[0].nombre,
        };
      })
    );

    res.status(200).json({
      hasEvaluaciones: true,
      evaluaciones: evaluacionesConProyecto,
    });
  } catch (error) {
    console.error("Error obteniendo evaluaciones del administrador:", error);
    res.status(500).json({ message: "Error obteniendo evaluaciones" });
  }
};

const createEvaluacion = async (req, res) => {
  const { id_persona } = req.user;
  const roleData = await userQueries.determineUserType(id_persona);
  const id_manager = roleData.roleData.id_manager;
  const {
    id_empleado,
    fecha,
    areas_mejora,
    calificacion,
    id_proyecto,
    comentarios,
    fortalezas,
  } = req.body;

  try {
    const evaluacion = await feedbackQueries.createEvaluacion(
      id_empleado,
      id_manager,
      fecha,
      areas_mejora,
      calificacion,
      id_proyecto,
      comentarios,
      fortalezas
    );
    res.status(201).json({
      message: "Evaluación creada exitosamente",
      evaluacion,
    });
  } catch (error) {
    console.error("Error creando evaluación:", error);
    res.status(500).json({ message: "Error creando evaluación" });
  }
};

module.exports = {
  getEvaluacionesManager,
  getEvaluacionesEmpleado,
  getEvaluacionesAdministrador,
  createEvaluacion,
};
