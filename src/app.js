const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const auth = require("./middleware/auth");
const error = require("./middleware/error");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

app.use(cors());

app.use(morgan("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

auth.initializePassport(app);

app.use("/api/auth", authRoutes);
app.use("/api/projects", auth.authenticateJWT, projectRoutes);
app.use(error);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
