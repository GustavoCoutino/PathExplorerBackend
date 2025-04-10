const bancaQueries = require("../db/queries/bancaQueries");

const managerGetAllEmployees = async (req, res) => {
  try {
    const employees = await bancaQueries.getAllEmployees();
    return res.status(200).json({
      success: true,
      message: "Lista de empleados obtenida correctamente",
      employees,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener la lista de empleados",
    });
  }
};

module.exports = {
  managerGetAllEmployees,
};
