// Esto es un placeholder en lo que se levanta la base de datos
const { Router } = require("express");
const router = Router();

router.get("/", (req, res) => {
  res.json({
    message: "Pathexplorer API is running",
  });
});

module.exports = router;
