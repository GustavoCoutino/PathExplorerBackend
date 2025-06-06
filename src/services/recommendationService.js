const { ChatOpenAI } = require("@langchain/openai");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { PromptTemplate } = require("@langchain/core/prompts");
const { RunnableSequence } = require("@langchain/core/runnables");
const NodeCache = require("node-cache");

const trajectoryCache = new NodeCache({ stdTTL: 30 * 24 * 60 * 60 });
const courseRecommendationsCache = new NodeCache({ stdTTL: 30 * 24 * 60 * 60 });
const roleRecommendationsCache = new NodeCache({ stdTTL: 30 * 24 * 60 * 60 });

async function generateTrajectoryRecommendations(userData) {
  const { currentRole } = userData;
  const cacheKey = `trajectory_recommendations_${currentRole}`;
  const cachedRecommendations = trajectoryCache.get(cacheKey);
  if (cachedRecommendations) {
    return {
      fromCache: true,
      recommendations: cachedRecommendations,
    };
  }

  const llm = new ChatOpenAI({
    temperature: 0.3,
    modelName: "gpt-3.5-turbo",
    openAIApiKey: process.env.OPENAI_API_KEY,
    timeout: 30 * 1000,
  });

  let promptText = `
    Como consultor de carrera profesional, genera 3 posibles trayectorias de desarrollo para un empleado con las siguientes características:
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
    employeeRole: userData.currentRole,
    employeeCourses: userData.employeeCourses,
    employeeCertifications: userData.employeeCertifications,
    employeeSkills: userData.employeeSkills,
    employeeProfessionalHistory: userData.employeeProfessionalHistory,
  };

  const chain = RunnableSequence.from([
    promptTemplate,
    llm,
    new StringOutputParser(),
  ]);

  const result = await chain.invoke(inputParams);

  try {
    const recommendations = JSON.parse(result);
    trajectoryCache.set(cacheKey, recommendations);

    return {
      fromCache: false,
      recommendations,
    };
  } catch (error) {
    console.error("Error parsing LLM response:", error);
    throw new Error("Error processing recommendations");
  }
}

async function generateCourseAndCertRecommendations(
  userData,
  topCourses,
  topCertifications,
  filters = {}
) {
  const { id_persona } = userData.userProfile;
  const filterString = Object.entries(filters)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const cacheKey = `course_recommendations_${id_persona}${
    filterString ? "_" + Buffer.from(filterString).toString("base64") : ""
  }`;

  const cachedRecommendations = courseRecommendationsCache.get(cacheKey);
  if (cachedRecommendations) {
    return {
      fromCache: true,
      recommendations: cachedRecommendations,
    };
  }

  const llm = new ChatOpenAI({
    temperature: 0.3,
    modelName: "gpt-3.5-turbo",
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  let promptText = `
    Como consultor de carrera profesional, genera recomendaciones de cursos y certificaciones para un empleado con las siguientes características:
    Rol: {employeeRole}
    Cursos ya tomados: {employeeCourses}
    Certificaciones ya obtenidas: {employeeCertifications}
    Habilidades: {employeeSkills}
    Historial: {employeeProfessionalHistory}

    Estos son cursos recomendados por un sistema de IA basado en similitud vectorial: {topCourses}
    Estas son certificaciones recomendadas por un sistema de IA basado en similitud vectorial: {topCertifications}

    Selecciona 3 cursos y 3 certificaciones de las opciones anteriores que sean más relevantes para el desarrollo profesional del empleado.
    Para cada recomendación, proporciona una explicación clara sobre por qué es adecuada basada en el perfil profesional.

    Responde solo con JSON que tenga los siguientes campos: cursos_recomendados y certificaciones_recomendadas. Cada uno debe ser un arreglo con 3 objetos, donde cada objeto contenga id, nombre, institucion, descripcion, y razon_recomendacion.

    En caso de que no haya suficientes cursos o certificaciones, no es necesario incluir los 3 de cada uno, es posible regresar un arreglo vacio.
  `;

  const promptTemplate = PromptTemplate.fromTemplate(promptText);

  const inputParams = {
    employeeRole: userData.currentRole,
    employeeCourses: JSON.stringify(userData.employeeCourses.slice(0, 5)),
    employeeCertifications: JSON.stringify(
      userData.employeeCertifications.slice(0, 5)
    ),
    employeeSkills: JSON.stringify(userData.employeeSkills.slice(0, 10)),
    employeeProfessionalHistory: JSON.stringify(
      userData.employeeProfessionalHistory.slice(0, 3)
    ),
    topCourses: JSON.stringify(topCourses),
    topCertifications: JSON.stringify(topCertifications),
  };

  const chain = RunnableSequence.from([
    promptTemplate,
    llm,
    new StringOutputParser(),
  ]);

  const result = await chain.invoke(inputParams);

  try {
    const recommendations = JSON.parse(result);
    courseRecommendationsCache.set(cacheKey, recommendations);

    return {
      fromCache: false,
      recommendations,
    };
  } catch (error) {
    console.error("Error parsing LLM response:", error);
    throw new Error("Error processing course recommendations");
  }
}

async function generateRoleRecommendations(userData, topRoles, filters = {}) {
  const { id_persona } = userData.userProfile;
  const filterString = Object.entries(filters)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const cacheKey = `role_recommendations_${id_persona}${
    filterString ? "_" + Buffer.from(filterString).toString("base64") : ""
  }`;

  const cachedRecommendations = roleRecommendationsCache.get(cacheKey);
  if (cachedRecommendations) {
    return {
      fromCache: true,
      recommendations: cachedRecommendations,
    };
  }

  const llm = new ChatOpenAI({
    temperature: 0.3,
    modelName: "gpt-3.5-turbo",
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  let promptText = `
    Como consultor de carrera profesional, genera recomendaciones de roles para un empleado con las siguientes características:
    Rol actual: {employeeRole}
    Cursos: {employeeCourses} 
    Certificaciones: {employeeCertifications}
    Habilidades: {employeeSkills}
    Historial profesional: {employeeProfessionalHistory}

    Estos son roles disponibles en la empresa que podrían ser adecuados según un sistema de IA basado en similitud vectorial: {topRoles}

    Selecciona 3 roles de las opciones anteriores que sean más relevantes para el desarrollo profesional del empleado.
    Para cada recomendación, proporciona una explicación clara sobre por qué es adecuada basada en el perfil profesional
    y cómo se alinea con las metas profesionales del empleado.

    Responde solo con JSON que tenga el siguiente campo: roles_recomendados. Debe ser un arreglo con 3 objetos, 
    donde cada objeto contenga id_rol, nombre, razon_recomendacion, y compatibilidad_porcentaje (un número del 1 al 100).

    En caso de que no haya suficientes roles, no es necesario incluir los 3, es posible regresar un arreglo más pequeño. Responde unicamente en JSON, no incluyas texto adicional.
  `;

  const promptTemplate = PromptTemplate.fromTemplate(promptText);

  const inputParams = {
    employeeRole: userData.currentRole,
    employeeCourses: userData.employeeCourses,
    employeeCertifications: userData.employeeCertifications,
    employeeSkills: userData.employeeSkills,
    employeeProfessionalHistory: userData.employeeProfessionalHistory,
    topRoles: JSON.stringify(topRoles),
  };

  const chain = RunnableSequence.from([
    promptTemplate,
    llm,
    new StringOutputParser(),
  ]);

  const result = await chain.invoke(inputParams);

  try {
    const recommendations = JSON.parse(result);
    roleRecommendationsCache.set(cacheKey, recommendations);

    return {
      fromCache: false,
      recommendations,
    };
  } catch (error) {
    console.error("Error parsing LLM response:", error);
    throw new Error("Error processing role recommendations");
  }
}

function invalidateRecommendationCaches(userData, id_persona) {
  if (userData?.currentRole) {
    trajectoryCache.del(`trajectory_recommendations_${userData.currentRole}`);
  }
  courseRecommendationsCache.del(`course_recommendations_${id_persona}`);
  roleRecommendationsCache.del(`role_recommendations_${id_persona}`);
}

module.exports = {
  generateTrajectoryRecommendations,
  generateCourseAndCertRecommendations,
  invalidateRecommendationCaches,
  generateRoleRecommendations,
};
