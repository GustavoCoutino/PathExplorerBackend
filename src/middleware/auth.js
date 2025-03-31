const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userQueries = require("./../db/queries");

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

const initializePassport = (app) => {
  app.use(passport.initialize());

  passport.use(
    new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
      try {
        const user = await userQueries.findUserById(jwtPayload.id_persona);

        if (!user) {
          return done(null, false);
        }

        const userTypeInfo = await userQueries.determineUserType(
          user.id_persona
        );

        return done(null, {
          id_persona: user.id_persona,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          role: userTypeInfo.role,
        });
      } catch (error) {
        return done(error, false);
      }
    })
  );
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id_persona: user.id_persona,
      email: user.email,
      role: user.role,
    },
    jwtOptions.secretOrKey,
    { expiresIn: "24h" }
  );
};

const authenticateJWT = passport.authenticate("jwt", { session: false });

const authorize = (roles = []) => {
  if (typeof roles === "string") {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Insufficient permissions",
      });
    }

    next();
  };
};

const login = async (req, res, next) => {
  passport.authenticate(
    "local",
    { session: false },
    async (err, user, info) => {
      try {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(401).json({
            success: false,
            message: info?.message || "Invalid credentials",
          });
        }

        const profileInfo = await userQueries.getUserProfile(user.id_persona);

        const userTypeInfo = await userQueries.determineUserType(
          user.id_persona
        );

        const token = generateToken(user);

        return res.status(200).json({
          success: true,
          message: "Login successful",
          token,
          user: {
            id_persona: user.id_persona,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            role: user.role,
            roleData: userTypeInfo.roleData,
            profile: profileInfo,
          },
        });
      } catch (error) {
        return next(error);
      }
    }
  )(req, res, next);
};

const getCurrentUser = async (req, res) => {
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
    console.error("Get current user error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  initializePassport,
  generateToken,
  authenticateJWT,
  authorize,
  login,
  getCurrentUser,
};
