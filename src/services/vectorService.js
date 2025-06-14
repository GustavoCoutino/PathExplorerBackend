const { OpenAIEmbeddings } = require("@langchain/openai");
const NodeCache = require("node-cache");
const userDataCache = new NodeCache({ stdTTL: 7 * 24 * 60 * 60 });
const courseRecommendationsCache = new NodeCache({ stdTTL: 0 });

const vectorCache = new NodeCache({ stdTTL: 0 });
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

async function getOrCreateVectors(developmentQueries) {
  const cacheKey = "course_cert_vectors";
  const cachedVectors = vectorCache.get(cacheKey);

  if (cachedVectors) {
    return cachedVectors;
  }

  const [courses, certifications] = await Promise.all([
    developmentQueries.getAllCourses(),
    developmentQueries.getAllCertifications(),
  ]);

  const courseTexts = courses.map((course) => {
    return `Curso: ${course.nombre}. Descripción: ${
      course.descripcion || ""
    }. Categoría: ${course.categoria || ""}. Nivel: ${
      course.nivel || ""
    }. Institucion: ${course.institucion || ""}. Duración: ${
      course.duracion || ""
    }.`;
  });

  const certTexts = certifications.map((cert) => {
    return `Certificación: ${cert.nombre}. Descripción: ${
      cert.descripcion || ""
    }. Institucion: ${cert.institucion || ""}`;
  });

  const courseVectors = await Promise.all(
    courseTexts.map((text) => embeddings.embedQuery(text))
  );

  const certVectors = await Promise.all(
    certTexts.map((text) => embeddings.embedQuery(text))
  );

  const courseEmbeddings = courses.map((course, index) => ({
    original: course,
    vector: courseVectors[index],
  }));

  const certEmbeddings = certifications.map((cert, index) => ({
    original: cert,
    vector: certVectors[index],
  }));

  const vectors = {
    courseEmbeddings,
    certEmbeddings,
  };

  vectorCache.set(cacheKey, vectors);

  return vectors;
}

async function getUserProfileVector(userData) {
  const cacheKey = `user_vector_${userData.userProfile.id_persona}`;
  const cachedVector = vectorCache.get(cacheKey);

  if (cachedVector) {
    return cachedVector;
  }

  const userText = `
    Rol: ${userData.currentRole}.
    Habilidades: ${userData.employeeSkills
      .map((skill) => skill.nombre)
      .join(", ")}.
    Historial profesional: ${userData.employeeProfessionalHistory
      .map((h) => h.historial_profesional + "Logros: " + h.achievements)
      .join(", ")}.
  `;

  const userVector = await embeddings.embedQuery(userText);

  vectorCache.set(cacheKey, userVector, 24 * 60 * 60);

  return userVector;
}

function invalidateUserCache(id_persona) {
  const cacheKey = `user_data_${id_persona}`;
  const userData = userDataCache.get(cacheKey);

  userDataCache.del(cacheKey);
  vectorCache.del(`user_vector_${id_persona}`);

  if (userData?.currentRole) {
    trajectoryCache.del(`trajectory_recommendations_${userData.currentRole}`);
  }

  courseRecommendationsCache.del(`course_recommendations_${id_persona}`);
}

async function findRelevantCoursesAndCerts(
  userData,
  userVector,
  vectors,
  topN = 5,
  coursesCategory = null,
  certificationsAbilities = null,
  coursesAbilities = null,
  coursesProvider = null,
  certificationsProvider = null
) {
  const userCourseIds = new Set(
    userData.employeeCourses.map((c) => c.id_curso)
  );
  const userCertIds = new Set(
    userData.employeeCertifications.map((c) => c.id_certificacion)
  );

  let courseEmbeddings = vectors.courseEmbeddings
    .filter((item) => !userCourseIds.has(item.original.id_curso))
    .filter(
      (item) => !coursesCategory || item.original.categoria === coursesCategory
    )
    .filter(
      (item) =>
        !coursesProvider || item.original.institucion === coursesProvider
    );

  let certEmbeddings = vectors.certEmbeddings
    .filter((item) => !userCertIds.has(item.original.id_certificacion))
    .filter(
      (item) =>
        !certificationsProvider ||
        item.original.institucion === certificationsProvider
    );

  if (coursesAbilities) {
    const abilityVector = await embeddings.embedQuery(coursesAbilities);
    const similarityThreshold = 0.75;

    courseEmbeddings = courseEmbeddings.filter((item) => {
      const similarity = cosineSimilarity(abilityVector, item.vector);
      return similarity >= similarityThreshold;
    });
  }

  if (certificationsAbilities) {
    const abilityVector = await embeddings.embedQuery(certificationsAbilities);
    const similarityThreshold = 0.75;

    certEmbeddings = certEmbeddings.filter((item) => {
      const similarity = cosineSimilarity(abilityVector, item.vector);
      return similarity >= similarityThreshold;
    });
  }

  let courseScores = courseEmbeddings
    .map((item) => ({
      item: item.original,
      score: cosineSimilarity(userVector, item.vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  let certScores = certEmbeddings
    .map((item) => ({
      item: item.original,
      score: cosineSimilarity(userVector, item.vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return {
    topCourses: courseScores.map((c) => c.item),
    topCertifications: certScores.map((c) => c.item),
  };
}

async function getOrCreateRoleVectors(roles) {
  const cacheKey = "role_vectors";
  const cachedVectors = vectorCache.get(cacheKey);

  if (cachedVectors) {
    return cachedVectors;
  }

  const roleTexts = roles.map((role) => {
    return `Rol: ${role.nombre}. Descripción: ${
      role.descripcion || ""
    }. Habilidades requeridas: ${
      role.skills ? role.skills.map((s) => s.nombre).join(", ") : ""
    }. Proyecto: ${role.project ? role.project.nombre : ""}.`;
  });

  const roleVectors = await Promise.all(
    roleTexts.map((text) => embeddings.embedQuery(text))
  );

  const roleEmbeddings = roles.map((role, index) => ({
    original: role,
    vector: roleVectors[index],
  }));

  vectorCache.set(cacheKey, roleEmbeddings, 24 * 60 * 60);

  return roleEmbeddings;
}

async function findRelevantRoles(
  userVector,
  roleVectors,
  topN = 5,
  roleSkills = null
) {
  let filteredRoles = roleVectors;

  if (roleSkills) {
    const skillsVector = await embeddings.embedQuery(roleSkills);
    const similarityThreshold = 0.75;

    filteredRoles = filteredRoles.filter((item) => {
      const similarity = cosineSimilarity(skillsVector, item.vector);
      return similarity >= similarityThreshold;
    });
  }

  let roleScores = filteredRoles
    .map((item) => ({
      item: item.original,
      score: cosineSimilarity(userVector, item.vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return {
    topRoles: roleScores.map((r) => r.item),
  };
}

function invalidateUserVectorCache(id_persona) {
  vectorCache.del(`user_vector_${id_persona}`);
}

module.exports = {
  cosineSimilarity,
  getOrCreateVectors,
  getUserProfileVector,
  findRelevantCoursesAndCerts,
  invalidateUserCache,
  getOrCreateRoleVectors,
  findRelevantRoles,
  invalidateUserVectorCache,
};
