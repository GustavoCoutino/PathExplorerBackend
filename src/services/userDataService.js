const NodeCache = require("node-cache");
const userDataCache = new NodeCache({ stdTTL: 7 * 24 * 60 * 60 });

async function getUserData(id_persona, userQueries) {
  const cacheKey = `user_data_${id_persona}`;

  const cachedUserData = userDataCache.get(cacheKey);
  if (cachedUserData) {
    return cachedUserData;
  }

  const [
    userProfile,
    employeeCourses,
    employeeCertifications,
    employeeSkills,
    employeeProfessionalHistory,
  ] = await Promise.all([
    userQueries.getUserProfile(id_persona),
    userQueries.getUserCourses(id_persona),
    userQueries.getUserCertifications(id_persona),
    userQueries.getUserSkills(id_persona),
    userQueries.getUserProfessionalHistory(id_persona),
  ]);

  const userData = {
    userProfile,
    currentRole: userProfile.puesto_actual,
    employeeCourses,
    employeeCertifications,
    employeeSkills,
    employeeProfessionalHistory,
  };

  userDataCache.set(cacheKey, userData);

  return userData;
}

module.exports = {
  getUserData,
};
