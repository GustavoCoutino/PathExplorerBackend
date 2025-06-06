const feedbackQueries = require("../db/queries/feedbackQueries");
const userQueries = require("../db/queries/userQueries");
const recommendationsQueries = require("../db/queries/recommendationsQueries");
const projectQueries = require("../db/queries/projectQueries");

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

const getProyectAndTeam = async (req, res) => {
  const { id_persona } = req.user;

  try {
    const proyectos = await projectQueries.getManagerProjects(id_persona);
    const integrantesConNombreProyecto = await Promise.all(
      proyectos.map(async (proyecto) => {
        const integrantes = await projectQueries.getTeamMembers(
          proyecto.id_proyecto
        );
        if (integrantes.length === 0) {
          return {
            proyecto: proyecto.nombre,
            integrantes: [],
          };
        }
        return {
          id_proyecto: proyecto.id_proyecto,
          proyecto: proyecto.nombre,
          integrantes: {
            id_empleado: integrantes[0].id_empleado,
            nombre: integrantes[0].nombre_empleado,
          },
        };
      })
    );
    res.status(200).json({
      equipos: integrantesConNombreProyecto,
    });
  } catch (error) {
    console.error("Error obteniendo proyectos y equipos:", error);
    res.status(500).json({ message: "Error obteniendo proyectos y equipos" });
  }
};

const deleteEvaluacion = async (req, res) => {
  const { id_evaluacion } = req.params;
  try {
    await feedbackQueries.deleteEvaluacion(id_evaluacion);
    res.status(200).json({ message: "Evaluación eliminada exitosamente" });
  } catch (error) {
    console.error("Error eliminando evaluación:", error);
    res.status(500).json({ message: "Error eliminando evaluación" });
  }
};

module.exports = {
  getEvaluacionesManager,
  getEvaluacionesEmpleado,
  getEvaluacionesAdministrador,
  createEvaluacion,
  getProyectAndTeam,
  deleteEvaluacion,
};
