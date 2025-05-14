const informesQueries = require("../db/queries/informesQueries");

const getAllInformesData = async (req, res) => {
  try {
    const professionalGoals = await informesQueries.getAllProfessionalGoals();
    const professionalTrayectory =
      await informesQueries.getAllProfessionalTrayectory();
    const employeeEvaluations =
      await informesQueries.getAllEmployeeEvaluations();
    const employeesStates = await informesQueries.getAllEmployeesStates();
    const requiredAbilitiesForRoles =
      await informesQueries.getAllRequiredAbilitiesForRoles();
    const employeeCourses = await informesQueries.getAllEmployeeCourses();
    const employeeCertifications =
      await informesQueries.getAllEmployeeCertifications();
    const roles = await informesQueries.getAllRoles();
    const informes = {
      professionalGoals,
      professionalTrayectory,
      employeeEvaluations,
      employeesStates,
      requiredAbilitiesForRoles,
      employeeCourses,
      employeeCertifications,
      roles,
    };
    if (informes.length === 0) {
      return res.status(200).json({
        hasInformes: false,
        message: "No hay informes disponibles",
      });
    }
    res.status(200).json({
      hasInformes: true,
      informes,
    });
  } catch (error) {
    console.error("Error obteniendo informes:", error);
    res.status(500).json({ message: "Error obteniendo informes" });
  }
};

module.exports = {
  getAllInformesData,
};
