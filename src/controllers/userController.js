const userQueries = require("../db/queries/userQueries");
const auth = require("../middleware/auth");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email y contraseña son requeridos",
      });
    }

    const user = await userQueries.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }
    // Todavia no estan hasheados en la base de datos
    //const isValid = await bcrypt.compare(password, user.password_hash);
    const isValid = password === user.password_hash;

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    const userTypeInfo = await userQueries.determineUserType(user.id_persona);
    const profileInfo = await userQueries.getUserProfile(user.id_persona);

    const userWithRole = {
      id_persona: user.id_persona,
      email: user.email,
      role: userTypeInfo.role,
    };

    const token = auth.generateToken(userWithRole);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id_persona: user.id_persona,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        fecha_contratacion: user.fecha_contratacion,
        role: userTypeInfo.role,
        roleData: userTypeInfo.roleData,
        profile: profileInfo,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id_persona;

    const user = await userQueries.findUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userTypeInfo = await userQueries.determineUserType(user.id_persona);

    const profileInfo = await userQueries.getUserProfile(user.id_persona);

    return res.status(200).json({
      success: true,
      user: {
        id_persona: user.id_persona,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        fecha_contratacion: user.fecha_contratacion,
        role: userTypeInfo.role,
        roleData: userTypeInfo.roleData,
        profile: profileInfo,
      },
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id_persona;
    const { nombre, apellido, correo, cargo } = req.body;

    if (!nombre || !apellido || !correo) {
      return res.status(400).json({
        success: false,
        message: "Nombre, apellido y correo son requeridos",
      });
    }

    const existingUser = await userQueries.findUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const profileData = {
      nombre,
      apellido,
      correo,
      cargo,
    };

    const updatedUser = await userQueries.editUserProfile(userId, profileData);
    if (!updatedUser || !updatedUser.persona) {
      return res.status(500).json({
        success: false,
        message: "Error al actualizar el perfil - respuesta incompleta",
      });
    }

    const userTypeInfo = await userQueries.determineUserType(userId);
    const profileInfo = await userQueries.getUserProfile(userId);

    return res.status(200).json({
      success: true,
      message: "Perfil actualizado con éxito",
      user: {
        id_persona: existingUser.id_persona,
        nombre: updatedUser.persona.nombre || existingUser.nombre,
        apellido: updatedUser.persona.apellido || existingUser.apellido,
        email: updatedUser.persona.correo || existingUser.email,
        fecha_contratacion: existingUser.fecha_contratacion,
        role: userTypeInfo.role,
        roleData: userTypeInfo.roleData,
        profile: {
          ...profileInfo,
          puesto_actual:
            updatedUser.perfil?.puesto_actual || profileInfo.puesto_actual,
        },
      },
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar el perfil del usuario",
    });
  }
};

const editUserPassword = async (req, res) => {
  try {
    const userId = req.user.id_persona;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "Nueva contraseña es requerida",
      });
    }

    const existingUser = await userQueries.findUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const updatedUser = await userQueries.editUserPassword(userId, newPassword);

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: "Error al actualizar la contraseña",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Contraseña actualizada con éxito",
    });
  } catch (error) {
    console.error("Update user password error:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar la contraseña",
    });
  }
};

const getUserCertifications = async (req, res) => {
  try {
    const userId = req.user.id_persona;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID missing",
      });
    }

    const certifications = await userQueries.getUserCertifications(userId);

    const formattedCertifications = certifications.map((cert) => ({
      ID_Certificacion: cert.id_certificacion,
      Nombre: cert.nombre,
      Institucion: cert.institucion,
      Validez: cert.validez,
      Nivel: cert.nivel,
      fecha_obtencion: cert.fecha_obtencion,
      fecha_vencimiento: cert.fecha_vencimiento,
      estado_validacion: cert.estado_validacion,
      fecha_creacion: cert.fecha_creacion,
    }));

    return res.status(200).json({
      success: true,
      certifications: formattedCertifications,
    });
  } catch (error) {
    console.error("Get user certifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener certificaciones",
      error: error.message,
    });
  }
};

const getUserCourses = async (req, res) => {
  try {
    const userId = req.user.id_persona;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID missing",
      });
    }

    const courses = await userQueries.getUserCourses(userId);

    if (!courses || courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron cursos para este usuario",
      });
    }
    return res.status(200).json({
      success: true,
      courses: courses,
    });
  } catch (error) {
    console.error("Get user courses error:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener cursos",
      error: error.message,
    });
  }
};

const getUserProfessionalHistory = async (req, res) => {
  try {
    const userId = req.user.id_persona;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID missing",
      });
    }

    const professionalHistoryResults =
      await userQueries.getUserProfessionalHistory(userId);

    if (
      !professionalHistoryResults ||
      professionalHistoryResults.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "Professional history not found for this user",
      });
    }

    const formattedHistory = professionalHistoryResults.map((entry) => ({
      nombre: entry.nombre,
      apellido: entry.apellido,
      historial: entry.historial_profesional,
      role: entry.role,
      achievements: entry.achievements,
    }));

    return res.status(200).json({
      success: true,
      professionalHistory: formattedHistory,
    });
  } catch (error) {
    console.error("Get user professional history error:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener historial profesional",
      error: error.message,
    });
  }
};

module.exports = {
  login,
  getUserProfile,
  updateUserProfile,
  editUserPassword,
  getUserCertifications,
  getUserCourses,
  getUserProfessionalHistory,
};
