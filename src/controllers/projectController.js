const projectQueries = require("../db/queries/projectQueries");

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

module.exports = {
  getUserProjectAndRole,
};
