const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const auth = require("./src/middleware/auth");
const error = require("./src/middleware/error");
const authRoutes = require("./src/routes/authRoutes");
const projectRoutes = require("./src/routes/projectRoutes");
const bancaRoutes = require("./src/routes/bancaRoutes");
const developmentRoutes = require("./src/routes/developmentRoutes");
const requestRoutes = require("./src/routes/requestRoutes");
const notificationsRoutes = require("./src/routes/notificationsRoutes");
const recommendationRoutes = require("./src/routes/recommendationRoutes");
const informesRoutes = require("./src/routes/informesRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const feedbackRoutes = require("./src/routes/feedbackRoutes");
const cvRoutes = require("./src/routes/cvRoutes");

dotenv.config();

const pool = require("./src/db/pool");

const app = express();
const port = process.env.PORT || 4000;

// Health-check de la base de datos
app.get("/__dbtest", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT NOW() AS now");
    return res.json({ ok: true, now: rows[0].now });
  } catch (err) {
    console.error("DB Test Error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOriginPatterns = [
      "https://path-explorer-front-end-rogj.vercel.app",
      "https://path-explorer-front-end-sand.vercel.app/",
      "http://localhost:3000",
    ];

    const isAllowed = allowedOriginPatterns.some((pattern) =>
      origin.startsWith(pattern)
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      if (process.env.NODE_ENV === "test") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

auth.initializePassport(app);

app.use("/api/auth", authRoutes);
app.use("/api/projects", auth.authenticateJWT, projectRoutes);
app.use("/api/banca", auth.authenticateJWT, bancaRoutes);
app.use("/api/development", auth.authenticateJWT, developmentRoutes);
app.use("/api/requests", auth.authenticateJWT, requestRoutes);
app.use("/api/notifications", auth.authenticateJWT, notificationsRoutes);
app.use("/api/recommendations", auth.authenticateJWT, recommendationRoutes);
app.use("/api/informes", auth.authenticateJWT, informesRoutes);
app.use("/api/dashboard", auth.authenticateJWT, dashboardRoutes);
app.use("/api/feedback", auth.authenticateJWT, feedbackRoutes);
app.use("/api/cv", auth.authenticateJWT, cvRoutes);
app.use(error);
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;
