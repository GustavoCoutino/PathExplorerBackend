const projectQueries = require("../db/queries/projectQueries");
const userQueries = require("../db/queries/userQueries");

const getUserProjectAndRole = async (req, res) => {
  const id_empleado = req.body.id_empleado;
  try {
    const userProject = await projectQueries.getUserProject(id_empleado);
    if (userProject.length === 0) {
      return res.status(200).json({
        hasProject: false,
        message: "Este usuario no tiene proyectos asignados",
      });
    }
    const userRole = await projectQueries.getUserRoleInProject(id_empleado);
    const userSkills = await projectQueries.getUserSkillsInRole(
      userRole[0].id_rol
    );

    res.status(200).json({
      hasProject: true,
      userProject,
      userRole,
      userSkills,
    });
  } catch (error) {
    console.error("Error obteniendo proyecto y rol:", error);
    res.status(500).json({ message: "Error obteniendo proyecto y rol" });
  }
};

const getManagerProjectsWithRoles = async (req, res) => {
  try {
    const id_persona = req.user.id_persona;
    const userTypeInfo = await userQueries.determineUserType(id_persona);

    if (userTypeInfo.role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Solo los managers pueden acceder a esta funcionalidad",
      });
    }

    const managerProjects = await projectQueries.getManagerProjects(id_persona);

    if (managerProjects.length === 0) {
      return res.status(200).json({
        hasProjects: false,
        message: "Este gerente no tiene proyectos asignados",
      });
    }

    const projectsWithDetails = await Promise.all(
      managerProjects.map(async (project) => {
        const roles = await projectQueries.getProjectRoles(project.id_proyecto);

        const rolesWithDetails = await Promise.all(
          roles.map(async (role) => {
            const skills = await projectQueries.getUserSkillsInRole(
              role.id_rol
            );
            const assignments = await projectQueries.getRoleAssignments(
              role.id_rol
            );

            return {
              ...role,
              skills,
              assignments,
            };
          })
        );

        return {
          ...project,
          roles: rolesWithDetails,
        };
      })
    );

    res.status(200).json({
      success: true,
      hasProjects: true,
      managerProjects: projectsWithDetails,
    });
  } catch (error) {
    console.error("Error obteniendo proyectos del gerente:", error);
    res.status(500).json({
      success: false,
      message: "Error obteniendo proyectos del gerente",
    });
  }
};

const createProject = async (req, res) => {
  const {
    nombre,
    descripcion,
    fecha_inicio,
    fecha_fin_estimada,
    id_manager,
    prioridad,
    roles,
  } = req.body;

  try {
    const newProject = await projectQueries.createProject({
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin_estimada,
      prioridad,
      id_manager,
      roles,
    });

    res.status(201).json({
      success: true,
      message: "Proyecto creado exitosamente",
      project: newProject,
    });
  } catch (error) {
    console.error("Error creando proyecto:", error);
    res.status(500).json({
      success: false,
      message: "Error creando proyecto",
    });
  }
};

const getBestCandidatesForRole = async (req, res) => {
  try {
    const id_rol = req.body.id_rol;
    const candidates = await projectQueries.getBestCandidatesForRole(id_rol);
    res.status(200).json({
      success: true,
      candidates,
    });
  } catch (error) {
    console.error("Error fetching best candidates for role:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching best candidates for role",
    });
  }
};

const editProject = async (req, res) => {
  const {
    id_proyecto,
    nombre,
    descripcion,
    fecha_inicio,
    fecha_fin_estimada,
    prioridad,
  } = req.body;

  try {
    const updatedProject = await projectQueries.editProject({
      id_proyecto,
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin_estimada,
      prioridad,
    });

    res.status(200).json({
      success: true,
      message: "Proyecto editado exitosamente",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error editando proyecto:", error);
    res.status(500).json({
      success: false,
      message: "Error editando proyecto",
    });
  }
};

const addRoleToProject = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      nivel_experiencia_requerido,
      estado,
      id_proyecto,
      id_manager,
      id_habilidad,
      nivel_minimo_requerido,
      importancia,
    } = req.body;

    const result = await projectQueries.addRoleToProject(
      titulo,
      descripcion,
      nivel_experiencia_requerido,
      estado,
      id_proyecto,
      id_manager,
      id_habilidad,
      nivel_minimo_requerido,
      importancia
    );

    if (result) {
      res.status(201).json({
        success: true,
        message: "Rol agregado al proyecto exitosamente",
        role: result,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Error al agregar rol al proyecto",
      });
    }
  } catch (error) {
    console.error("Error adding role to project:", error);
    res.status(500).json({
      success: false,
      message: "Error adding role to project",
    });
  }
};

const getAllSkills = async (req, res) => {
  try {
    const skills = await projectQueries.getAllSkills();
    res.status(200).json({
      success: true,
      skills,
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching skills",
    });
  }
};

module.exports = {
  getUserProjectAndRole,
  getManagerProjectsWithRoles,
  createProject,
  getBestCandidatesForRole,
  addRoleToProject,
  editProject,
  getAllSkills,
};
