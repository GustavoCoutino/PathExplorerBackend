const projectQueries = require("../db/queries/projectQueries");
const userQueries = require("../db/queries/userQueries");

const getDashboardData = async (req, res) => {
  const { id_persona } = req.user;
  const role = await userQueries.determineUserType(id_persona);
  if (role.role === "manager") {
    const managerProjects = await projectQueries.getManagerProjects(id_persona);
    const courses = await userQueries.getUserCourses(id_persona);
    const certifications = await userQueries.getUserCertifications(id_persona);
    const skills = await userQueries.getUserSkills(id_persona);

    const rolesWithoutAssignments = await Promise.all(
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

            if (assignments.length === 0) {
              return {
                ...role,
                skills,
              };
            }
          })
        );

        return {
          ...project,
          roles: rolesWithDetails,
        };
      })
    );

    return res.status(200).json({
      rolesWithoutAssignments,
      courses,
      certifications,
      skills,
    });
  } else if (role.role === "empleado") {
    const employeeProyect = await projectQueries.getUserProject(
      role.roleData.id_empleado
    );
    const id_proyecto = employeeProyect[0] ? employeeProyect[0].id_proyecto : 0;
    const teamMembers = await projectQueries.getTeamMembers(id_proyecto);
    const courses = await userQueries.getUserCourses(id_persona);
    const certifications = await userQueries.getUserCertifications(id_persona);
    const skills = await userQueries.getUserSkills(id_persona);

    return res.status(200).json({
      teamMembers,
      courses,
      certifications,
      skills,
      employeeProyect,
    });
  }
  return res.status(404).json({
    message: "No se encontró el rol del usuario",
  });
};

module.exports = {
  getDashboardData,
};
