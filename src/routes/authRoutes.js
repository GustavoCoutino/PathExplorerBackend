const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");

router.post("/login", userController.login);
router.get("/me", auth.authenticateJWT, userController.getUserProfile);

module.exports = router;
