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
const { scheduleCertificationNotifications } = require("./src/certifications");

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(helmet());

app.use(cors());

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

app.use(error);

const initializeScheduledJobs = () => {
  scheduleCertificationNotifications();
};

initializeScheduledJobs();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
