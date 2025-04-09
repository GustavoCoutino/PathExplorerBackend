const projectQueries = require("../db/queries/projectQueries");

const createNewProject = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin_estimada,
      fecha_fin_real,
      estado,
      prioridad,
      id_manager,
      roles,
    } = req.body;

    if (!nombre || !fecha_inicio || !estado || !prioridad) {
      return res.status(400).json({ error: "Missing required project fields" });
    }

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one role must be provided" });
    }

    const allRoles = await projectQueries.getAllRoles();
    const allAbilities = await projectQueries.getAllAbilities();

    const roleIds = new Set(allRoles.map((role) => role.id_rol));
    const abilityIds = new Set(
      allAbilities.map((ability) => ability.id_habilidad)
    );

    for (const role of roles) {
      if (!roleIds.has(role.id_rol)) {
        return res
          .status(400)
          .json({ error: `Role with ID ${role.id_rol} does not exist` });
      }

      if (
        !role.abilities ||
        !Array.isArray(role.abilities) ||
        role.abilities.length === 0
      ) {
        return res.status(400).json({
          error: `Role with ID ${role.id_rol} must have at least one ability`,
        });
      }

      for (const abilityId of role.abilities) {
        if (!abilityIds.has(abilityId)) {
          return res.status(400).json({
            error: `Ability with ID ${abilityId} does not exist`,
          });
        }
      }
    }

    const project = await projectQueries.createProject(
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin_estimada,
      fecha_fin_real,
      estado,
      prioridad,
      id_manager
    );

    const projectRoles = [];
    for (const role of roles) {
      const nivel_minimo = role.nivel_minimo;
      const importancia = role.importancia;

      const projectRole = await projectQueries.createProjectRole(
        project.id_proyecto,
        role.id_rol,
        nivel_minimo,
        importancia
      );

      projectRoles.push({
        ...projectRole,
        abilities: role.abilities,
      });
    }

    res.status(201).json({
      project,
      roles: projectRoles,
    });
  } catch (error) {
    console.error("Error in createNewProject controller:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
};

module.exports = {
  createNewProject,
};
