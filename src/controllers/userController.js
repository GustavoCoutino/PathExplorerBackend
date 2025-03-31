const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userQueries = require("../db/queries");
const auth = require("../middleware/auth");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await userQueries.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
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

module.exports = {
  login,
  getUserProfile,
};
