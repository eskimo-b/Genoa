import jwt from "jsonwebtoken";

// pour mettre à jour la route courante
const router = express.Router();

// ---------------------------------------------------------------------------
// Middleware : vérifie le JWT dans le header Authorization: Bearer <token>
// ---------------------------------------------------------------------------
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token manquant" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré" });
  }
};

// ---------------------------------------------------------------------------
// Middleware : vérifie qu'un rôle minimum est respecté
// Usage : requireRole("admin") ou requireRole("editor")
// ---------------------------------------------------------------------------
export const requireRole = (role) => (req, res, next) => {
  const roles = ["reader", "editor", "admin"];
  if (roles.indexOf(req.user?.role) < roles.indexOf(role)) {
    return res.status(403).json({ error: "Droits insuffisants" });
  }
  next();
};

// ---------------------------------------------------------------------------
// Routes (à monter dans app.js avec : app.use("/auth", authRouter))
// ---------------------------------------------------------------------------

// POST /auth/register — Inscription
// Body : { email, password }
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  // TODO : vérifier que l'email n'existe pas déjà en base
  // TODO : hasher le mot de passe puis insérer l'utilisateur
  //   const hash = await bcrypt.hash(password, 10);
  //   const isFirstUser = (await users.countDocuments()) === 0;
  //   const role = isFirstUser ? "admin" : "reader"; // premier inscrit → admin
  //   await users.insertOne({ email, password: hash, role, validated: isFirstUser });
  res.status(201).json({ message: "Inscription en attente de validation" });
});

// POST /auth/login — Connexion
// Body : { email, password }
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  // TODO : récupérer l'utilisateur en base par son email
  //   const user = await users.findOne({ email });
  //   if (!user || !user.validated) return res.status(401).json({ error: "Compte invalide ou non validé" });
  //   const match = await bcrypt.compare(password, user.password);
  //   if (!match) return res.status(401).json({ error: "Mot de passe incorrect" });
  const token = jwt.sign(
    { userId: "TODO", role: "TODO" },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
  res.json({ token });
});

export default router;