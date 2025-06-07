const userDataService = require("../services/userDataService");
const vectorService = require("../services/vectorService");
const recommendationService = require("../services/recommendationService");
const recommendationQueries = require("../db/queries/recommendationsQueries");
const userQueries = require("../db/queries/userQueries");
const developmentQueries = require("../db/queries/developmentQueries");
const projectQueries = require("../db/queries/projectQueries");

const getRecommendations = async (req, res) => {
  try {
    const { id_persona } = req.user;
    const userData = await userDataService.getUserData(id_persona, userQueries);

    const { fromCache, recommendations } =
      await recommendationService.generateTrajectoryRecommendations(userData);

    return res.status(200).json({
      success: true,
      message: fromCache
        ? "Recomendaciones obtenidas desde caché"
        : "Recomendaciones generadas exitosamente",
      recommendations,
    });
  } catch (error) {
    console.error("Error al generar recomendaciones:", error);
    return res.status(500).json({
      success: false,
      message: "Error al generar recomendaciones",
      error: error.message,
    });
  }
};

const createEmployeeTrayectory = async (req, res) => {
  try {
    const { id_persona } = req.user;
    const { nombre, descripcion, roles_secuenciales, tiempo_estimado } =
      req.body;
    const roles_secuenciales_string = roles_secuenciales.join(" → ");

    await recommendationQueries.addTrayectoryWithUser(
      nombre,
      descripcion,
      roles_secuenciales_string,
      tiempo_estimado,
      id_persona
    );

    const userData = await userDataService.getUserData(id_persona, userQueries);
    vectorService.invalidateUserCache(id_persona);
    vectorService.invalidateUserVectorCache(id_persona);
    recommendationService.invalidateRecommendationCaches(userData, id_persona);

    return res.status(201).json({
      success: true,
      message: "Trayectoria creada y asignada al empleado exitosamente",
    });
  } catch (error) {
    console.error("Error al crear la trayectoria:", error);
    return res.status(500).json({
      success: false,
      message: "Error al crear la trayectoria",
      error: error.message,
    });
  }
};

const getUserTrayectoria = async (req, res) => {
  try {
    const { id_persona } = req.user;
    const userTrayectorias = await recommendationQueries.getUserTrayectoria(
      id_persona
    );

    return res.status(200).json({
      success: true,
      message: "Trayectorias obtenidas exitosamente",
      trayectoria: userTrayectorias[0],
    });
  } catch (error) {
    console.error("Error al obtener las trayectorias:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener las trayectorias",
      error: error.message,
    });
  }
};
const getCoursesAndCertificationsRecommendations = async (req, res) => {
  try {
    const { id_persona } = req.user;

    const {
      coursesCategory,
      certificationsAbilities,
      coursesAbilities,
      coursesProvider,
      certificationsProvider,
    } = req.query;

    const filters = {
      coursesCategory,
      certificationsAbilities,
      coursesAbilities,
      coursesProvider,
      certificationsProvider,
    };

    const userData = await userDataService.getUserData(id_persona, userQueries);

    const vectors = await vectorService.getOrCreateVectors(developmentQueries);

    const userVector = await vectorService.getUserProfileVector(userData);

    const { topCourses, topCertifications } =
      await vectorService.findRelevantCoursesAndCerts(
        userData,
        userVector,
        vectors,
        10,
        coursesCategory,
        certificationsAbilities,
        coursesAbilities,
        coursesProvider,
        certificationsProvider
      );

    const { fromCache, recommendations } =
      await recommendationService.generateCourseAndCertRecommendations(
        userData,
        topCourses,
        topCertifications,
        filters
      );

    return res.status(200).json({
      success: true,
      message: fromCache
        ? "Recomendaciones de cursos y certificaciones obtenidas desde caché"
        : "Recomendaciones de cursos y certificaciones generadas exitosamente",
      recommendations,
    });
  } catch (error) {
    console.error("Error al generar recomendaciones de cursos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al generar recomendaciones de cursos",
      error: error.message,
    });
  }
};

const getFilterOptions = async (req, res) => {
  try {
    const uniqueCategoriesCourses =
      await recommendationQueries.getUniqueCategoriesCourses();
    const uniqueInstitutionsCourses =
      await recommendationQueries.getUniqueInstitutionsCourses();
    const uniqueInstitutionsCertifications =
      await recommendationQueries.getUniqueInstitutionsCertifications();
    const allSkills = await projectQueries.getAllSkills();
    const allSkillsNames = allSkills.map((skill) => skill.nombre);

    return res.status(200).json({
      success: true,
      message: "Opciones de filtro obtenidas exitosamente",
      uniqueCategoriesCourses,
      uniqueInstitutionsCourses,
      uniqueInstitutionsCertifications,
      allSkillsNames,
    });
  } catch (error) {
    console.error("Error al obtener las opciones de filtro:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener las opciones de filtro",
      error: error.message,
    });
  }
};

const getRecommendedEmployeeRoles = async (req, res) => {
  try {
    const { id_persona } = req.user;
    const { roleSkills, roleState } = req.query;

    const filters = {
      roleSkills,
      roleState,
    };
    const availableRoles = await recommendationQueries.getAvailableRoles();
    const rolesWithProjects = await Promise.all(
      availableRoles.map(async (role) => {
        const project = await recommendationQueries.getProjectByProjectId(
          role.id_proyecto
        );
        return { ...role, project };
      })
    );
    const filteredRoles = roleState
      ? rolesWithProjects.filter((role) => role.project[0].estado === roleState)
      : rolesWithProjects;
    const rolesWithDetails = await Promise.all(
      filteredRoles.map(async (role) => {
        const skills = await recommendationQueries.getRoleSkills(role.id_rol);
        const manager = await recommendationQueries.getManager(role.id_manager);
        return {
          ...role,
          skills,
          manager,
        };
      })
    );

    const userData = await userDataService.getUserData(id_persona, userQueries);
    const roleVectors = await vectorService.getOrCreateRoleVectors(
      rolesWithDetails
    );
    const userVector = await vectorService.getUserProfileVector(userData);

    const { topRoles } = await vectorService.findRelevantRoles(
      userVector,
      roleVectors,
      5,
      roleSkills,
      roleState
    );

    const { fromCache, recommendations } =
      await recommendationService.generateRoleRecommendations(
        userData,
        topRoles,
        filters
      );
    const recommendedRolesWithProjectInfo = await Promise.all(
      recommendations.roles_recomendados.map(async (role) => {
        const roleWithProject = rolesWithDetails.find(
          (r) => r.id_rol === role.id_rol
        );
        return {
          ...role,
          roleWithProject,
        };
      })
    );
    return res.status(200).json({
      success: true,
      message: fromCache
        ? "Recomendaciones de roles obtenidas desde caché"
        : "Recomendaciones de roles generadas exitosamente",
      recommendations: recommendedRolesWithProjectInfo,
    });
  } catch (error) {
    console.error("Error al generar recomendaciones de roles:", error);
    return res.status(500).json({
      success: false,
      message: "Error al generar recomendaciones de roles",
      error: error.message,
    });
  }
};

module.exports = {
  getRecommendations,
  createEmployeeTrayectory,
  getUserTrayectoria,
  getCoursesAndCertificationsRecommendations,
  getRecommendedEmployeeRoles,
  getFilterOptions,
};
