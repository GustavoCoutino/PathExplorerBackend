const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const auth = require("./middleware/auth");
const error = require("./middleware/error");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const bancaRoutes = require("./routes/bancaRoutes");
const developmentRoutes = require("./routes/developmentRoutes");

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
app.use(error);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
