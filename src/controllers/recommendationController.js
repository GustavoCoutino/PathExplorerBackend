const { ChatOpenAI } = require("@langchain/openai");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { PromptTemplate } = require("@langchain/core/prompts");
const { RunnableSequence } = require("@langchain/core/runnables");
const userQueries = require("../db/queries/userQueries");
const recommendationQueries = require("../db/queries/recommendationsQueries");

const getRecommendations = async (req, res) => {
  try {
    const { id_persona } = req.user;

    const employeeCourses = await userQueries.getUserCourses(id_persona);
    const employeeCertifications = await userQueries.getUserCertifications(
      id_persona
    );
    const employeeSkills = await userQueries.getUserSkills(id_persona);
    const employeeProfessionalHistory =
      await userQueries.getUserProfessionalHistory(id_persona);
    const userProfile = await userQueries.getUserProfile(id_persona);
    const employeeRole = userProfile.puesto_actual;

    const llm = new ChatOpenAI({
      temperature: 0.3,
      modelName: "gpt-4",
    });

    let promptText = `
    Como consultor de carrera profesional, genera 3 posibles trayectorias de desarrollo para un empleado con:
    Rol: {employeeRole}
    Cursos: {employeeCourses}
    Certificaciones: {employeeCertifications}
    Habilidades: {employeeSkills}
    Historial: {employeeProfessionalHistory}

    Ejemplo de trayectoria: "Desarrollo de Software: Desarrollador Junior → Desarrollador Senior → Arquitecto de Software (60 meses)"

    Crea 3 trayectorias profesionales únicas basadas en este perfil. Cada trayectoria debe ser realista y adecuada 
    a sus habilidades actuales pero con potencial de crecimiento.

    Responde solo con JSON que tenga los siguientes campos: nombre, descripcion, roles_secuenciales y tiempo_estimado (debe ser un numero). Debe ser un arreglo JSON de 3 trayectorias.
    `;

    const promptTemplate = PromptTemplate.fromTemplate(promptText);

    const inputParams = {
      employeeRole,
      employeeCourses,
      employeeCertifications,
      employeeSkills,
      employeeProfessionalHistory,
    };

    const chain = RunnableSequence.from([
      promptTemplate,
      llm,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke(inputParams);
    let recommendations;
    try {
      recommendations = JSON.parse(result);
    } catch (error) {
      console.error("Error al parsear la respuesta del LLM:", error);
      return res.status(500).json({
        success: false,
        message: "Error al procesar las recomendaciones",
        rawResponse: result,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Recomendaciones generadas exitosamente",
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
      trayectorias: userTrayectorias[0],
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

module.exports = {
  getRecommendations,
  createEmployeeTrayectory,
  getUserTrayectoria,
};
