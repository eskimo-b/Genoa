const express = require("express");

// pour mettre à jour la route courante
const router = express.Router();

const { register, login } = require("./auth");
const { verifyToken } = require("./middleware/verifyToken");

// Route d'inscription - pas besoin de token, n'importe qui peut s'inscrire
router.post("/register", register);

// Route de login - pas besoin de token, on en génère un ici
router.post("/login", login);

// Route protégée - exemple, il faut un token valide pour y accéder
// router.get("/protected", verifyToken, fonctionACreer);

module.exports = router;