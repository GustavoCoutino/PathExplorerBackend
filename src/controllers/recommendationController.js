const { ChatOpenAI } = require("@langchain/openai");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { PromptTemplate } = require("@langchain/core/prompts");
const { RunnableSequence } = require("@langchain/core/runnables");
const userQueries = require("../db/queries/userQueries");
const developmentQueries = require("../db/queries/developmentQueries");

const recommendationCache = new Map();

const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id_persona;
    const { selectedRole } = req.body;
    const {
      selectedAbilities,
      selectedCertifications,
      selectedCourses,
      trajectoryTime,
    } = req.body;
    if (!selectedRole) {
      return res.status(400).json({
        success: false,
        message: "Se requiere especificar un rol seleccionado",
      });
    }
    const cacheKey = `${userId}-${selectedRole}-${JSON.stringify(
      selectedAbilities || []
    )}-${JSON.stringify(selectedCertifications || [])}-${JSON.stringify(
      selectedCourses || []
    )}-${trajectoryTime || ""}`;
    if (recommendationCache.has(cacheKey)) {
      return res.status(200).json({
        success: true,
        message: "Recomendaciones recuperadas de caché",
        recommendations: recommendationCache.get(cacheKey),
        source: "cache",
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

    const simplifiedUserSkills = userSkills.map((skill) => ({
      nombre: skill.nombre,
      nivel: skill.nivel_demostrado,
      categoria: skill.categoria,
    }));

    const simplifiedUserCertifications = userCertifications.map((cert) => ({
      nombre: cert.nombre,
      institucion: cert.institucion,
      estado_validacion: cert.estado_validacion,
    }));

    const simplifiedUserCourses = userCourses.map((course) => ({
      nombre: course.nombre,
      institucion: course.institucion,
      categoria: course.categoria,
    }));

    const simplifiedHistory = professionalHistory.map((history) => ({
      role: history.role,
      historial_profesional: history.historial_profesional,
      logros: history.achievements,
    }));

    const simplifiedAllCourses = allCourses.map((course) => ({
      nombre: course.nombre,
      institucion: course.institucion,
      descripcion: course.descripcion,
      categoria: course.categoria,
    }));

    const simplifiedAllCertifications = allCertifications.map((cert) => ({
      nombre: cert.nombre,
      institucion: cert.institucion,
    }));
    const llm = new ChatOpenAI({
      temperature: 0.3,
      modelName: "gpt-4",
    });

    let promptText = `
     Eres un asesor de desarrollo profesional en TI. Tu tarea es recomendar SOLAMENTE tres ESPECIALIZACIONES dentro del rol de {selectedRole}, NO roles diferentes.
        
      IMPORTANTE: El empleado ya es {selectedRole} y quiere diferentes ESPECIALIZACIONES dentro de ese MISMO rol, no desea cambiar a otro rol.
        
      Datos del empleado:
        - Habilidades: {skills}
        - Certificaciones: {certifications}
        - Cursos completados: {courses}
        - Historial: {professionalHistory}
        - Recursos disponibles - Cursos: {availableCourses}
        - Recursos disponibles - Certificaciones: {availableCertifications}`;

    if (selectedAbilities) {
      promptText += `
        - Habilidades específicas que le interesa desarrollar: {selectedAbilities}`;
    }

    if (selectedCertifications && selectedCertifications.length > 0) {
      promptText += `
        - Certificaciones específicas que le interesa obtener: {selectedCertifications}
      `;
    }

    if (selectedCourses && selectedCourses.length > 0) {
      promptText += `
        - Cursos específicos que le interesa tomar: {selectedCourses}
      `;
    }

    if (trajectoryTime) {
      promptText += `
        - Tiempo disponible para completar la trayectoria: {trajectoryTime}
      `;
    }

    promptText += `
        
        RESTRICCIONES IMPORTANTES:
        1. Cada una de las tres trayectorias DEBE ser una ESPECIALIZACIÓN o VARIANTE del rol {selectedRole}, NO un rol diferente.
        2. Por ejemplo, si {selectedRole} es "Backend Developer", las trayectorias podrían ser "Backend Developer especializado en microservicios", "Backend Developer enfocado en bases de datos" y "Backend Developer orientado a seguridad", pero NUNCA "Data Scientist", "Scrum Master" o cualquier rol que no sea explícitamente una variante de Backend Developer.
        3. Cada trayectoria debe incluir SIEMPRE el término "{selectedRole}" en su nombre para enfatizar que es una especialización del mismo rol, no un cambio de carrera.
        
        Para cada especialización, incluye:
        1. Nombre: DEBE contener "{selectedRole}" + especialización (ej: "{selectedRole} especializado en X")
        2. Descripción breve de esta especialización
        3. 3 cursos recomendados relevantes para esta especialización
        4. 3 certificaciones recomendadas para esta especialización
        5. Orden sugerido para completar estos cursos y certificaciones
        6. 10 habilidades clave para desarrollar en esta especialización
        7. Justificación breve de por qué esta especialización es adecuada
        
        Responde en JSON donde cada trayectoria incluye campos de nombre, descripcion, mejores_cursos, mejores_certificaciones, orden_cursos_certificaciones, habilidades_desarrollar, y explicacion.
    `;

    const promptTemplate = PromptTemplate.fromTemplate(promptText);

    const inputParams = {
      selectedRole: selectedRole,
      skills: JSON.stringify(simplifiedUserSkills),
      certifications: JSON.stringify(simplifiedUserCertifications),
      courses: JSON.stringify(simplifiedUserCourses),
      professionalHistory: JSON.stringify(simplifiedHistory),
      availableCourses: JSON.stringify(simplifiedAllCourses),
      availableCertifications: JSON.stringify(simplifiedAllCertifications),
    };

    if (selectedAbilities && selectedAbilities.length > 0) {
      inputParams.selectedAbilities = JSON.stringify(selectedAbilities);
    }

    if (selectedCertifications && selectedCertifications.length > 0) {
      inputParams.selectedCertifications = JSON.stringify(
        selectedCertifications
      );
    }

    if (selectedCourses && selectedCourses.length > 0) {
      inputParams.selectedCourses = JSON.stringify(selectedCourses);
    }

    if (trajectoryTime) {
      inputParams.trajectoryTime = trajectoryTime;
    }

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
    recommendationCache.set(cacheKey, recommendations);
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
