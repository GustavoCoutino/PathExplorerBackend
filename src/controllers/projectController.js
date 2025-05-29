const projectQueries = require("../db/queries/projectQueries");
const userQueries = require("../db/queries/userQueries");
const notificationsQueries = require("../db/queries/notificationsQueries");

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
    const id_proyecto = userProject[0].id_proyecto;
    const userSkills = await projectQueries.getUserSkillsInRole(
      userRole[0].id_rol
    );
    const getTeamMembers = await projectQueries.getTeamMembers(id_proyecto);
    const id_manager = userProject[0].id_manager;
    const managerInfo = await projectQueries.getProjectManager(id_manager);

    res.status(200).json({
      hasProject: true,
      userProject,
      userRole,
      userSkills,
      getTeamMembers,
      managerInfo,
    });
  } catch (error) {
    console.error("Error obteniendo proyecto y rol:", error);
    res.status(500).json({ message: "Error obteniendo proyecto y rol" });
  }
};

const getManagerProjectsWithRoles = async (req, res) => {
  try {
    const id_persona = req.user.id_persona;

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
    roles,
  } = req.body;

  try {
    await projectQueries.editProject({
      id_proyecto,
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin_estimada,
      prioridad,
      roles,
    });
    Promise.all(
      roles.map(async (role) => {
        await projectQueries.editProjectRole(role);
        Promise.all(
          role.habilidades.map(async (skill) => {
            await projectQueries.editProjectSkill(skill);
          })
        );
      })
    );

    res.status(200).json({
      success: true,
      message: "Proyecto editado exitosamente",
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
      skills,
    } = req.body;
    const { id_persona } = req.user;
    const managerData = await userQueries.determineUserType(id_persona);
    const id_manager = managerData.roleData.id_persona;

    const result = await projectQueries.addRoleToProject(
      titulo,
      descripcion,
      nivel_experiencia_requerido,
      estado,
      id_proyecto,
      id_manager,
      skills
    );

    res.status(201).json({
      success: true,
      message: "Rol agregado al proyecto exitosamente",
      role: result,
    });
  } catch (error) {
    console.error("Error adding role to project:", error);
    res.status(500).json({
      success: false,
      message: "Error adding role to project",
    });
  }
};

const removeRoleFromProject = async (req, res) => {
  try {
    const { id_rol, mensaje } = req.body;
    const { id_persona } = req.user;
    const result = await projectQueries.deleteRole(id_rol);
    await notificationsQueries.createNotification(
      id_persona,
      "Eliminacion de rol",
      mensaje,
      "ASIGNACION"
    );

    res.status(200).json({
      success: true,
      message: "Rol eliminado del proyecto exitosamente",
      id_rol: result.id_rol,
    });
  } catch (error) {
    console.error("Error removing role from project:", error);
    res.status(500).json({
      success: false,
      message: "Error removing role from project",
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
  removeRoleFromProject,
  addRoleToProject,
  editProject,
  getAllSkills,
};
