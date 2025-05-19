const userDataService = require("../services/userDataService");
const vectorService = require("../services/vectorService");
const recommendationService = require("../services/recommendationService");
const recommendationQueries = require("../db/queries/recommendationsQueries");
const userQueries = require("../db/queries/userQueries");
const developmentQueries = require("../db/queries/developmentQueries");

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
    userDataService.invalidateUserCache(id_persona);
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

    const userData = await userDataService.getUserData(id_persona, userQueries);

    const vectors = await vectorService.getOrCreateVectors(developmentQueries);

    const userVector = await vectorService.getUserProfileVector(userData);

    const { topCourses, topCertifications } =
      await vectorService.findRelevantCoursesAndCerts(
        userData,
        userVector,
        vectors,
        10
      );

    const { fromCache, recommendations } =
      await recommendationService.generateCourseAndCertRecommendations(
        userData,
        topCourses,
        topCertifications
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

module.exports = {
  getRecommendations,
  createEmployeeTrayectory,
  getUserTrayectoria,
  getCoursesAndCertificationsRecommendations,
};
