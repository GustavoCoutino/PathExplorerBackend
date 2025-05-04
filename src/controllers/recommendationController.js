const { ChatOpenAI } = require("@langchain/openai");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { PromptTemplate } = require("@langchain/core/prompts");
const { RunnableSequence } = require("@langchain/core/runnables");
const userQueries = require("../db/queries/userQueries");
const developmentQueries = require("../db/queries/developmentQueries");

const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id_persona;
    const selectedRole = req.body;
    if (!selectedRole) {
      return res.status(400).json({
        success: false,
        message: "Se requiere especificar un rol seleccionado",
      });
    }

    const userSkills = await userQueries.getUserSkills(userId);
    const userCertifications = await userQueries.getUserCertifications(userId);
    const userCourses = await userQueries.getUserCourses(userId);
    const professionalHistory = await userQueries.getUserProfessionalHistory(
      userId
    );

    const allCourses = await developmentQueries.getAllCourses();
    const allCertifications = await developmentQueries.getAllCertifications();

    const llm = new ChatOpenAI({
      temperature: 0.7,
      modelName: "gpt-4",
    });

    const promptTemplate = PromptTemplate.fromTemplate(`
      Como asesor de desarrollo profesional con experiencia en crecimiento profesional en TI,
      recomienda tres trayectorias de desarrollo profesional para el rol de {selectedRole}, basado en las habilidades y experiencia del empleado.
      
      Habilidades del Empleado:
      {skills}
      
      Certificaciones Actuales y Pasadas:
      {certifications}
      
      Cursos Completados:
      {courses}
      
      Historial Profesional:
      {professionalHistory}
      
      Cursos Disponibles:
      {availableCourses}
      
      Certificaciones Disponibles:
      {availableCertifications}
      
      Basado en esta información, proporciona tres trayectorias de desarrollo profesional diferentes. Cada trayectoria debe incluir:
      1. Nombre de la trayectoria
      2. Descripción de la trayectoria
      3. Los 3 mejores cursos que mejorarían su rol actual
      4. Las 3 mejores certificaciones que avanzarían esta trayectoria profesional
      5. Orden en el que deben completarse los cursos y certificaciones
      6. Las 10 principales habilidades que deberían desarrollarse para esta trayectoria
      7. Una breve explicación de por qué esta trayectoria es adecuada para el perfil del empleado
      
      Formatea tu respuesta como una estructura JSON que contenga un array llamado "trayectorias" con tres objetos, cada uno representando una trayectoria.
    `);

    const chain = RunnableSequence.from([
      promptTemplate,
      llm,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({
      selectedRole: selectedRole,
      skills: JSON.stringify(userSkills),
      certifications: JSON.stringify(userCertifications),
      courses: JSON.stringify(userCourses),
      professionalHistory: JSON.stringify(professionalHistory),
      availableCourses: JSON.stringify(allCourses),
      availableCertifications: JSON.stringify(allCertifications),
    });

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

module.exports = {
  getRecommendations,
};
